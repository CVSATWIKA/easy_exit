from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json
from .models import LeaveRequest
from accounts.models import StudentProfile
import uuid
from django.utils import timezone
from qrlogs.models import QRSession
from accounts.decorators import role_required
from datetime import timedelta


# ── Monthly quota limits ─────────────────────────────────────────────────────
MONTHLY_QUOTA = {
    "gate": 2,
    "home": 1,
}

def get_monthly_usage(student_profile, year, month):
    """
    Return {"gate": <used>, "home": <used>} for the given student/month.

    A pass is counted toward the quota ONLY if the student actually walked out,
    i.e. the linked QRSession has scanned_out_at set (status "out" or "in").
    Passes that are pending, approved but never scanned, or rejected do NOT
    consume quota — the student is only charged once they physically leave.
    """
    base_qs = LeaveRequest.objects.filter(
        student=student_profile,
        # status "out" means scanned out but not yet back;
        # status "in"  means fully returned — both confirm at least one scan.
        status__in=["out", "in"],
        # Use the QRSession scan timestamp as the authoritative month boundary
        # so a pass applied in month N but scanned in month N+1 counts for N+1.
        qrsession__scanned_out_at__year=year,
        qrsession__scanned_out_at__month=month,
    )
    gate_used = base_qs.filter(pass_type="gate").count()
    home_used = base_qs.filter(pass_type="home").count()
    return {"gate": gate_used, "home": home_used}


@role_required(["student"])
def my_leaves(request):

    try:
        student_profile = StudentProfile.objects.get(user=request.user)
    except StudentProfile.DoesNotExist:
        return JsonResponse({"error": "Logged-in user is not a student"}, status=403)

    leaves = LeaveRequest.objects.filter(
        student__user=request.user
    ).order_by("-id")

    data = []

    for l in leaves:
        qr_token = None
        scanned_out_at = None
        scanned_in_at = None

        try:
            qr = QRSession.objects.get(leave_request=l)
            qr_token       = str(qr.token)
            scanned_out_at = qr.scanned_out_at.isoformat() if qr.scanned_out_at else None
            scanned_in_at  = qr.scanned_in_at.isoformat()  if qr.scanned_in_at  else None
        except QRSession.DoesNotExist:
            pass

        latest_comment = (
            l.warden_comment or
            l.manager_comment or
            l.hod_comment or
            ""
        )

        data.append({
            "id":             l.id,
            "leave_type":     l.pass_type,
            "reason":         l.reason,
            "status":         l.status,
            "comment":        latest_comment,
            "qr_token":       qr_token,
            # Planned times (entered by student at apply time)
            "out_time":       l.out_datetime.isoformat() if l.out_datetime else None,
            "in_time":        l.in_datetime.isoformat()  if l.in_datetime  else None,
            # Actual scan times (recorded at gate)
            "scanned_out_at": scanned_out_at,
            "scanned_in_at":  scanned_in_at,
        })

    # ── Attach this month's quota info ────────────────────────────────────────
    now   = timezone.localtime(timezone.now())
    usage = get_monthly_usage(student_profile, now.year, now.month)

    quota_info = {
        "gate": {
            "used":      usage["gate"],
            "limit":     MONTHLY_QUOTA["gate"],
            "remaining": max(0, MONTHLY_QUOTA["gate"] - usage["gate"]),
        },
        "home": {
            "used":      usage["home"],
            "limit":     MONTHLY_QUOTA["home"],
            "remaining": max(0, MONTHLY_QUOTA["home"] - usage["home"]),
        },
        "month": now.strftime("%B %Y"),   # e.g. "July 2025"
    }

    return JsonResponse({"leaves": data, "quota": quota_info}, safe=False)


@csrf_exempt
@role_required(["student"])
def create_leave(request):

    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=400)

    try:
        data = json.loads(request.body)

        student_profile = StudentProfile.objects.get(user=request.user)

        leave_type = data.get("leave_type")

        # ── Monthly quota check ───────────────────────────────────────────────
        now   = timezone.localtime(timezone.now())
        usage = get_monthly_usage(student_profile, now.year, now.month)

        if leave_type not in MONTHLY_QUOTA:
            return JsonResponse({"error": f"Unknown leave type: {leave_type}"}, status=400)

        limit = MONTHLY_QUOTA[leave_type]
        used  = usage[leave_type]

        if used >= limit:
            type_label = "Gate Pass" if leave_type == "gate" else "Home Pass"
            return JsonResponse(
                {
                    "error": (
                        f"Monthly quota exceeded. You can apply for at most "
                        f"{limit} {type_label}(s) per month. "
                        f"You have already used {used}/{limit} this month "
                        f"({now.strftime('%B %Y')}). "
                        f"Unused passes do not carry over to the next month."
                    ),
                    "quota_exceeded": True,
                    "leave_type":     leave_type,
                    "used":           used,
                    "limit":          limit,
                },
                status=400,
            )

        out_time_str = data.get("out_time")

        # ── Sunday holiday check ──────────────────────────────────────────────
        # If the out_datetime falls on a Sunday, skip HOD and Manager
        # and send directly to Warden for approval.
        initial_status = "pending_hod"
        is_sunday      = False

        if out_time_str:
            from django.utils.dateparse import parse_datetime
            from django.utils import timezone as tz
            parsed = parse_datetime(out_time_str)
            if parsed:
                # Convert to local time before checking weekday
                local_dt = tz.localtime(parsed) if tz.is_aware(parsed) else parsed
                # weekday(): Monday=0 ... Sunday=6
                if local_dt.weekday() == 6:
                    initial_status = "pending_warden"
                    is_sunday      = True

        leave = LeaveRequest.objects.create(
            student=student_profile,
            pass_type=leave_type,
            reason=data.get("reason"),
            out_datetime=out_time_str,
            in_datetime=data.get("in_time"),
            status=initial_status,
        )

        # Return updated quota so the frontend can refresh without a second call
        updated_usage = get_monthly_usage(student_profile, now.year, now.month)

        return JsonResponse({
            "message": "Leave created",
            "id":      leave.id,
            "status":  initial_status,
            # Let the frontend know it was a Sunday fast-track
            "sunday_fasttrack": is_sunday,
            # Updated quota after creation
            "quota": {
                "gate": {
                    "used":      updated_usage["gate"],
                    "limit":     MONTHLY_QUOTA["gate"],
                    "remaining": max(0, MONTHLY_QUOTA["gate"] - updated_usage["gate"]),
                },
                "home": {
                    "used":      updated_usage["home"],
                    "limit":     MONTHLY_QUOTA["home"],
                    "remaining": max(0, MONTHLY_QUOTA["home"] - updated_usage["home"]),
                },
                "month": now.strftime("%B %Y"),
            },
        })

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)



@role_required(["hod"])
def hod_requests(request):

    status = request.GET.get("status", "pending")
    leaves = LeaveRequest.objects.all()

    if status == "pending":
        leaves = leaves.filter(status="pending_hod", student__department=request.user.department)
    elif status == "approved":
        leaves = leaves.filter(status__in=["pending_manager", "pending_warden", "approved", "out", "in"])
    elif status == "rejected":
        leaves = leaves.filter(status="hod_rejected")

    data = []
    for l in leaves:
        data.append({
            "id":         l.id,
            "roll_no":    l.student.roll_no,
            "year":       l.student.year,
            "reason":     l.reason,
            "leave_type": l.pass_type,
            "out_time":   l.out_datetime.isoformat() if l.out_datetime else None,
            "in_time":    l.in_datetime.isoformat()  if l.in_datetime  else None,
        })

    return JsonResponse(data, safe=False)


@csrf_exempt
@require_http_methods(["POST"])
@role_required(["hod"])
def hod_action(request, leave_id):
    leave = LeaveRequest.objects.get(id=leave_id)
    action = request.POST.get("action")
    comment = request.POST.get("comment", "")

    if action == "reject":
        leave.status = "hod_rejected"
    elif action == "approve":
        leave.status = "pending_manager"
    if comment:
        leave.hod_comment = comment.strip()
    leave.save()

    return JsonResponse({"message": "Action recorded"})



@role_required(["manager"])
def manager_requests(request):
    status = request.GET.get("status", "pending")
    leaves = LeaveRequest.objects.all()
    if status == "pending":
        leaves = leaves.filter(status="pending_manager")
    elif status == "approved":
        leaves = leaves.filter(status__in=["pending_warden", "approved", "out", "in"])
    elif status == "rejected":
        leaves = leaves.filter(status="manager_rejected")

    data = []
    for l in leaves:
        data.append({
            "id":         l.id,
            "roll_no":    l.student.roll_no,
            "department": l.student.department,
            "year":       l.student.year,
            "reason":     l.reason,
            "leave_type": l.pass_type,
            "out_time":   l.out_datetime.isoformat() if l.out_datetime else None,
            "in_time":    l.in_datetime.isoformat()  if l.in_datetime  else None,
        })

    return JsonResponse(data, safe=False)


@csrf_exempt
@require_http_methods(["POST"])
@role_required(["manager"])
def manager_action(request, leave_id):
    leave = LeaveRequest.objects.get(id=leave_id)
    action = request.POST.get("action")
    comment = request.POST.get("comment", "")

    if action == "reject":
        leave.status = "manager_rejected"
    elif action == "approve":
        leave.status = "pending_warden"
    if comment:
        leave.manager_comment = comment.strip()
    leave.save()
    return JsonResponse({"message": "Manager action recorded"})



@role_required(["warden"])
def warden_requests(request):
    status = request.GET.get("status", "pending")
    leaves = LeaveRequest.objects.all()
    if status == "pending":
        leaves = leaves.filter(status="pending_warden")
    elif status == "approved":
        leaves = leaves.filter(status__in=["approved", "out", "in"])
    elif status == "rejected":
        leaves = leaves.filter(status="warden_rejected")

    year    = request.GET.get("year")
    hostel  = request.GET.get("hostel")
    branch  = request.GET.get("branch")
    start   = request.GET.get("start")
    end     = request.GET.get("end")
    roll_no = request.GET.get("roll_no")

    if year:    leaves = leaves.filter(student__year=year)
    if hostel:  leaves = leaves.filter(student__hostel_no=hostel)
    if branch:  leaves = leaves.filter(student__department__iexact=branch)
    if roll_no: leaves = leaves.filter(student__roll_no__icontains=roll_no)
    if start and end:
        leaves = leaves.filter(out_datetime__range=[start, end])

    data = []
    for l in leaves:
        s = l.student
        data.append({
            "id":               l.id,
            "roll_no":          s.roll_no,
            "department":       s.department,
            "year":             s.year,
            "hostel_no":        s.hostel_no,
            "room_no":          s.room_no,
            "personal_contact": s.personal_contact,
            "parent_contact":   s.parent_contact,
            "reason":           l.reason,
            "leave_type":       l.pass_type,
            "out_time":         l.out_datetime.isoformat() if l.out_datetime else None,
            "in_time":          l.in_datetime.isoformat()  if l.in_datetime  else None,
        })

    return JsonResponse(data, safe=False)


@csrf_exempt
@require_http_methods(["POST"])
@role_required(["warden"])
def warden_action(request, leave_id):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=400)

    try:
        leave = LeaveRequest.objects.get(id=leave_id)
    except LeaveRequest.DoesNotExist:
        return JsonResponse({"error": "Leave not found"}, status=404)

    action  = request.POST.get("action")
    comment = request.POST.get("comment", "")

    if action == "reject":
        leave.status = "warden_rejected"
        leave.warden_comment = comment
        leave.save()
        return JsonResponse({"message": "Rejected successfully"})

    if action == "approve":
        leave.status = "approved"
        if comment:
            leave.warden_comment = comment.strip()
        leave.save()

        qr, created = QRSession.objects.get_or_create(
            leave_request=leave,
            defaults={"expires_at": timezone.now() + timedelta(hours=24)}
        )
        if not created:
            qr.expires_at = timezone.now() + timedelta(hours=24)
            qr.token = uuid.uuid4()
            qr.save()

        return JsonResponse({"message": "Approved", "token": str(qr.token)})

    return JsonResponse({"error": "Invalid action"}, status=400)


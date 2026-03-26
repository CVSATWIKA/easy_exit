from django.http import JsonResponse
from django.utils import timezone
from .models import QRSession
from django.views.decorators.csrf import csrf_exempt
from accounts.decorators import role_required



@csrf_exempt
def scan_qr(request, token):
    try:
        qr = QRSession.objects.get(token=token)
    except QRSession.DoesNotExist:
        return JsonResponse({"error": "Invalid QR"}, status=400)

    if qr.expires_at is not None and timezone.now() > qr.expires_at:
        return JsonResponse({"error": "QR expired"}, status=400)

    leave   = qr.leave_request
    student = leave.student
    now     = timezone.now()

    # ── FIRST SCAN → student going OUT ─────────────────────────
    if not qr.is_out_scanned:
        qr.is_out_scanned  = True
        qr.scanned_out_at  = now          # ← record OUT timestamp
        leave.status = "out"
        leave.save()
        qr.save()

        return JsonResponse({
            "status": "OUT",
            "message": "✅ Student checked OUT",
            "student": {
                "roll_no":  student.roll_no,
                "name":     student.user.get_full_name() or student.user.username,
                "hostel_no": student.hostel_no,
                "room_no":  student.room_no,
                "photo":    request.build_absolute_uri(student.photo.url),
            }
        })

    # ── SECOND SCAN → student coming IN ────────────────────────
    if qr.is_out_scanned and not qr.is_in_scanned:
        qr.is_in_scanned  = True
        qr.scanned_in_at  = now           # ← record IN timestamp
        leave.status = "in"
        leave.save()
        qr.save()

        # Calculate how long the student was out
        duration     = now - qr.scanned_out_at
        total_mins   = int(duration.total_seconds() // 60)
        hours, mins  = divmod(total_mins, 60)
        duration_str = f"{hours}h {mins}m" if hours else f"{mins}m"

        return JsonResponse({
            "status": "IN",
            "message": f"✅ Student returned (was out for {duration_str})",
            "student": {
                "roll_no":  student.roll_no,
                "name":     student.user.get_full_name() or student.user.username,
                "hostel_no": student.hostel_no,
                "room_no":  student.room_no,
                "photo":    request.build_absolute_uri(student.photo.url),
            }
        })

    # ── ALREADY USED ────────────────────────────────────────────
    return JsonResponse({"error": "QR already used — student has returned."}, status=400)


from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from accounts.decorators import role_required
from qrlogs.models import QRSession
from django.utils.dateparse import parse_date
from django.utils import timezone


def _build_record(qr, overdue=False):
    """Convert a QRSession into a tracking record dict."""
    l = qr.leave_request
    s = l.student

    duration_str = None
    if qr.scanned_out_at and qr.scanned_in_at:
        delta        = qr.scanned_in_at - qr.scanned_out_at
        total_mins   = int(delta.total_seconds() // 60)
        h, m         = divmod(total_mins, 60)
        duration_str = f"{h}h {m}m" if h else f"{m}m"

    # How long overdue (time since they went out, no return)
    overdue_str = None
    if overdue and qr.scanned_out_at and not qr.scanned_in_at:
        delta        = timezone.now() - qr.scanned_out_at
        total_mins   = int(delta.total_seconds() // 60)
        h, m         = divmod(total_mins, 60)
        days         = h // 24
        h            = h % 24
        if days:
            overdue_str = f"{days}d {h}h {m}m"
        elif h:
            overdue_str = f"{h}h {m}m"
        else:
            overdue_str = f"{m}m"

    if qr.scanned_out_at and qr.scanned_in_at:
        scan_status = "returned"
    elif qr.scanned_out_at:
        scan_status = "out"
    else:
        scan_status = "not_scanned"

    return {
        "leave_id":       l.id,
        "roll_no":        s.roll_no,
        "name":           s.user.get_full_name() or s.user.username,
        "department":     s.department,
        "year":           s.year,
        "hostel_no":      s.hostel_no,
        "room_no":        s.room_no,
        "leave_type":     l.pass_type,
        "reason":         l.reason,
        "scan_status":    scan_status,
        "overdue":        overdue,
        "overdue_since":  overdue_str,
        "scanned_out_at": qr.scanned_out_at.isoformat() if qr.scanned_out_at else None,
        "scanned_in_at":  qr.scanned_in_at.isoformat()  if qr.scanned_in_at  else None,
        "duration":       duration_str,
    }


@login_required
@role_required(["warden"])
def warden_tracking(request):
    """
    Returns two independent sections:

    1. "date_records"   — students whose scanned_out_at matches the selected date
                          (filtered by hostel + status if provided)

    2. "overdue"        — students who went out BEFORE the selected date
                          and have NOT returned yet (scanned_in_at is null)
                          These appear regardless of date filter — always visible.

    3. "summary"        — counts for the selected date + total overdue count
    """

    date_str = request.GET.get("date", "")
    hostel   = request.GET.get("hostel", "")
    status   = request.GET.get("status", "all")
    roll_no  = request.GET.get("roll_no", "")

    # Resolve filter date
    filter_date = parse_date(date_str) if date_str else timezone.localdate()

    base_qs = QRSession.objects.select_related(
        "leave_request__student__user"
    ).filter(
        leave_request__status__in=["approved", "out", "in"]
    )

    if hostel:
        base_qs = base_qs.filter(
            leave_request__student__hostel_no__iexact=hostel
        )
    if roll_no:
        base_qs = base_qs.filter(
            leave_request__student__roll_no__icontains=roll_no
        )

    # ── SECTION 1: Selected date records ───────────────────────
    date_qs = base_qs.filter(scanned_out_at__date=filter_date)

    if status == "out":
        date_qs = date_qs.filter(scanned_out_at__isnull=False, scanned_in_at__isnull=True)
    elif status == "in":
        date_qs = date_qs.filter(scanned_out_at__isnull=False, scanned_in_at__isnull=False)
    elif status == "pending_scan":
        date_qs = base_qs.filter(scanned_out_at__isnull=True)

    date_records = [_build_record(qr, overdue=False) for qr in date_qs]

    # Sort: out first, then returned, then not_scanned
    sort_order = {"out": 0, "returned": 1, "not_scanned": 2}
    date_records.sort(key=lambda x: sort_order.get(x["scan_status"], 3))

    # ── SECTION 2: Overdue — went out before selected date, still not returned ──
    overdue_qs = base_qs.filter(
        scanned_out_at__date__lt=filter_date,
        scanned_in_at__isnull=True,
    )
    overdue_records = [_build_record(qr, overdue=True) for qr in overdue_qs]
    # Sort: longest overdue first
    overdue_records.sort(key=lambda x: x["scanned_out_at"] or "")

    # ── SECTION 3: Returned late — went out before selected date, DID return ──
    # These are students who were overdue at some point but have since come back.
    # We want to keep a record of them so wardens can see who returned late.
    returned_late_qs = base_qs.filter(
        scanned_out_at__date__lt=filter_date,
        scanned_in_at__isnull=False,
    )
    returned_late_records = [_build_record(qr, overdue=False) for qr in returned_late_qs]
    returned_late_records.sort(key=lambda x: x["scanned_in_at"] or "")

    # ── SECTION 4: Summary counts ─────────────────────────────────────────────
    # Date records counts (scanned_out on selected date)
    all_date_qs = base_qs.filter(scanned_out_at__date=filter_date)
    all_date    = list(all_date_qs)

    # "Awaiting scan" = approved QR exists but scanned_out_at is still null
    # These students have no scanned_out_at so they won't appear in all_date_qs.
    # Count them separately using the full base_qs (no date filter on scanned_out_at).
    awaiting_scan_count = base_qs.filter(
        scanned_out_at__isnull=True,
        leave_request__status="approved",
    ).count()

    summary = {
        "out":              sum(1 for q in all_date if q.scanned_out_at and not q.scanned_in_at),
        "returned":         sum(1 for q in all_date if q.scanned_out_at and q.scanned_in_at),
        "not_scanned":      awaiting_scan_count,   # fixed: was always 0 before
        "overdue":          len(overdue_records),
        "returned_late":    len(returned_late_records),
    }

    return JsonResponse({
        "date":                 filter_date.isoformat(),
        "date_records":         date_records,
        "overdue":              overdue_records,
        "returned_late":        returned_late_records,   # NEW
        "summary":              summary,
    })


@login_required
@role_required(["warden"])
def warden_live_outside(request):
    """
    Returns ALL students who have not returned yet, in two groups:

    GROUP 1 — "out_records":
        Scanned out at gate, scanned_in_at is still null.
        These students CONFIRMED went outside.

    GROUP 2 — "not_reported":
        QR pass approved + generated, but scanned_out_at is STILL null.
        These students got approval but never scanned at gate —
        either they haven't left yet, or they left without scanning.

    Optional: ?hostel=... to filter by hostel
    """
    hostel = request.GET.get("hostel", "")
    now    = timezone.now()
    today  = timezone.localdate()

    base_qs = QRSession.objects.select_related(
        "leave_request__student__user"
    )

    if hostel:
        base_qs = base_qs.filter(
            leave_request__student__hostel_no__iexact=hostel
        )

    # ── GROUP 1: Scanned out, not yet returned ──────────────────
    out_qs = base_qs.filter(
        scanned_out_at__isnull=False,
        scanned_in_at__isnull=True,
    )

    out_records = []
    for qr in out_qs:
        l = qr.leave_request
        s = l.student

        delta      = now - qr.scanned_out_at
        total_mins = int(delta.total_seconds() // 60)
        h, m       = divmod(total_mins, 60)
        days       = h // 24
        h          = h % 24
        if days:   time_out_str = f"{days}d {h}h {m}m"
        elif h:    time_out_str = f"{h}h {m}m"
        else:      time_out_str = f"{m}m"

        is_overdue = qr.scanned_out_at.date() < today

        out_records.append({
            "leave_id":         l.id,
            "roll_no":          s.roll_no,
            "name":             s.user.get_full_name() or s.user.username,
            "department":       s.department,
            "year":             s.year,
            "hostel_no":        s.hostel_no,
            "room_no":          s.room_no,
            "personal_contact": s.personal_contact,
            "parent_contact":   s.parent_contact,
            "leave_type":       l.pass_type,
            "reason":           l.reason,
            "scanned_out_at":   qr.scanned_out_at.isoformat(),
            "time_out":         time_out_str,
            "overdue":          is_overdue,
            "group":            "out",
        })

    # Sort: overdue first (oldest out_time first), then today by out time
    out_records.sort(key=lambda x: (not x["overdue"], x["scanned_out_at"]))

    # ── GROUP 2: Approved + QR generated, never scanned out ─────
    # These are passes whose planned out_datetime has already passed
    # but QR was never scanned — warden needs to investigate
    not_reported_qs = base_qs.filter(
        scanned_out_at__isnull=True,
        scanned_in_at__isnull=True,
        leave_request__status="approved",
        leave_request__out_datetime__lte=now,  # planned time has passed
    )

    not_reported = []
    for qr in not_reported_qs:
        l = qr.leave_request
        s = l.student

        # How long since their planned out time
        delta      = now - l.out_datetime
        total_mins = int(delta.total_seconds() // 60)
        h, m       = divmod(total_mins, 60)
        days       = h // 24
        h          = h % 24
        if days:   since_str = f"{days}d {h}h {m}m ago"
        elif h:    since_str = f"{h}h {m}m ago"
        else:      since_str = f"{m}m ago"

        not_reported.append({
            "leave_id":         l.id,
            "roll_no":          s.roll_no,
            "name":             s.user.get_full_name() or s.user.username,
            "department":       s.department,
            "year":             s.year,
            "hostel_no":        s.hostel_no,
            "room_no":          s.room_no,
            "personal_contact": s.personal_contact,
            "parent_contact":   s.parent_contact,
            "leave_type":       l.pass_type,
            "reason":           l.reason,
            "planned_out":      l.out_datetime.isoformat(),
            "planned_in":       l.in_datetime.isoformat() if l.in_datetime else None,
            "since_planned":    since_str,
            "group":            "not_reported",
        })

    not_reported.sort(key=lambda x: x["planned_out"])

    return JsonResponse({
        "out_count":           len(out_records),
        "out_overdue_count":   sum(1 for r in out_records if r["overdue"]),
        "not_reported_count":  len(not_reported),
        "out_records":         out_records,
        "not_reported":        not_reported,
    })
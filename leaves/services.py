from leaves.models import Approval
from qrlogs.services import generate_qr_for_leave


def warden_decision(leave, warden_user, decision, comment=""):
    """
    Handles warden approval or rejection after parent confirmation
    """

    # Record warden approval decision
    Approval.objects.create(
        leave_request=leave,
        approved_by=warden_user,
        decision=decision,
        comment=comment
    )

    # If rejected, update leave status
    if decision == 'rejected':
        leave.status = 'rejected'
        leave.save()
        return None

    # If approved, update status and generate QR
    leave.status = 'approved'
    leave.save()

    qr_token = generate_qr_for_leave(leave)
    return qr_token

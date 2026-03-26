import uuid
from django.db import models
from leaves.models import LeaveRequest


class QRSession(models.Model):
    leave_request = models.OneToOneField(
        LeaveRequest,
        on_delete=models.CASCADE
    )
    token      = models.UUIDField(default=uuid.uuid4, unique=True)
    expires_at = models.DateTimeField()

    # ── Scan flags (existing) ───────────────────────────────────
    is_out_scanned = models.BooleanField(default=False)
    is_in_scanned  = models.BooleanField(default=False)

    # ── Scan timestamps (new) ───────────────────────────────────
    scanned_out_at = models.DateTimeField(null=True, blank=True)
    scanned_in_at  = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return str(self.token)
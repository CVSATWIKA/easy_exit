import qrcode
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from .models import QRSession
import os


def generate_qr_for_leave(leave):
    expiry_time = leave.in_datetime + timedelta(hours=2)

    qr_session = QRSession.objects.create(
        leave_request=leave,
        expires_at=expiry_time
    )

    return qr_session.token

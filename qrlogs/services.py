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

    # QR content (token-based, secure)
    qr_data = f"QR:{qr_session.token}"

    qr = qrcode.make(qr_data)

    qr_dir = os.path.join(settings.MEDIA_ROOT, "qr_codes")
    os.makedirs(qr_dir, exist_ok=True)

    qr_path = os.path.join(qr_dir, f"{qr_session.token}.png")
    qr.save(qr_path)

    return qr_session.token

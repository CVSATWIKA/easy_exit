from django.contrib import admin
from .models import QRSession

@admin.register(QRSession)
class QRSessionAdmin(admin.ModelAdmin):
    list_display = ('leave_request', 'token', 'expires_at', 'is_out_scanned', 'is_in_scanned')

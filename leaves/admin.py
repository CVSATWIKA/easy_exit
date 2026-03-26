from django.contrib import admin
from .models import LeaveRequest, Approval


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = (
        'student',
        'pass_type',
        'out_datetime',
        'in_datetime',
        'status',
    )
    list_filter = ('pass_type', 'status')
    search_fields = ('student__user__username', 'student__roll_no')


@admin.register(Approval)
class ApprovalAdmin(admin.ModelAdmin):
    list_display = (
        'leave_request',
        'approved_by',
        'decision',
        'approved_at',
    )
    list_filter = ('decision',)

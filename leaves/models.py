from django.db import models
from accounts.models import User, StudentProfile


class LeaveRequest(models.Model):

    PASS_TYPE_CHOICES = (
        ('gate', 'Gate Pass'),
        ('home', 'Home Pass'),
    )

    STATUS_CHOICES = (
        ('pending_hod', 'Pending HOD Approval'),
        ('pending_manager', 'Pending Hostel Manager Approval'),
        ('pending_warden', 'Pending Warden Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('out', 'Student Out'),
        ('in', 'Student Returned'),
    )

    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE
    )

    pass_type = models.CharField(
        max_length=10,
        choices=PASS_TYPE_CHOICES
    )

    reason = models.TextField()

    out_datetime = models.DateTimeField()
    in_datetime = models.DateTimeField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending_hod'
    )

    hod_comment = models.TextField(blank=True, null=True)
    manager_comment = models.TextField(blank=True, null=True)
    warden_comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.user.username} - {self.pass_type}"


class Approval(models.Model):

    DECISION_CHOICES = (
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    leave_request = models.ForeignKey(
        LeaveRequest,
        on_delete=models.CASCADE,
        related_name='approvals'
    )

    approved_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    decision = models.CharField(
        max_length=10,
        choices=DECISION_CHOICES
    )

    comment = models.TextField(blank=True)

    approved_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.leave_request} - {self.decision}"

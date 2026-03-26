from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('hod', 'HOD'),
        ('warden', 'Warden'),
        ('manager', 'Hostel Manager'),
        ('security', 'Security'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, blank=True, default="")

    # Department is required ONLY for HOD
    department = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    def __str__(self):
        return f"{self.username} ({self.role})"
    
    # Student Profile (linked to User)
class StudentProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'student'}
    )
    roll_no = models.CharField(max_length=20, unique=True)
    department = models.CharField(max_length=100)
    year = models.CharField(max_length=10)          # e.g., 1st, 2nd, 3rd, 4th
    class_name = models.CharField(max_length=50)

    # Hostel details
    hostel_no = models.CharField(max_length=20)
    room_no = models.CharField(max_length=20)

    # Contact details
    personal_contact = models.CharField(max_length=15)
    parent_contact = models.CharField(max_length=15)

    # Security
    photo = models.ImageField(upload_to='student_photos/')

    def __str__(self):
        return self.user.username
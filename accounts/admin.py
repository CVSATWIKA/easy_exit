from django.contrib import admin
from .models import User, StudentProfile

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role', 'is_staff')
    list_filter = ('role',)
    search_fields = ('username', 'email')


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = (
        'roll_no',
        'user',
        'department',
        'year',
        'personal_contact',
        'parent_contact',
        'hostel_no',
        'room_no',
    )

    search_fields = (
        'roll_no',
        'user__username',
        'department',
        'hostel_no',
        'room_no',
    )

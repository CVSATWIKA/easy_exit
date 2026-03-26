from django.contrib.auth import authenticate, login, update_session_auth_hash
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
import json


@csrf_exempt
def login_view(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=400)

    data     = json.loads(request.body)
    username = data.get("username")
    password = data.get("password")

    user = authenticate(username=username, password=password)
    if user is None:
        return JsonResponse({"error": "Invalid credentials"}, status=401)

    login(request, user)
    return JsonResponse({"message": "Login successful", "role": user.role})


@csrf_exempt
def profile_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    user = request.user

    profile_data = {
        "username":   user.username,
        "full_name":  f"{user.first_name} {user.last_name}".strip() or user.username,
        "email":      user.email,
        "role":       user.role,
        "department": user.department or "",
    }

    if user.role == "student":
        try:
            sp = user.studentprofile
            profile_data.update({
                "roll_no":          sp.roll_no,
                "year":             sp.year,
                "class_name":       sp.class_name,
                "hostel_no":        sp.hostel_no,
                "room_no":          sp.room_no,
                "personal_contact": sp.personal_contact,
                "parent_contact":   sp.parent_contact,
                "department":       sp.department,
                "photo":            sp.photo.url if sp.photo else "",
            })
        except Exception:
            pass

    return JsonResponse(profile_data)


@csrf_exempt
@login_required
def change_password_view(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=400)

    try:
        data             = json.loads(request.body)
        current_password = data.get("current_password", "")
        new_password     = data.get("new_password", "")

        # ── Validate inputs ─────────────────────────────────────
        if not current_password or not new_password:
            return JsonResponse({"error": "Both current and new password are required."}, status=400)

        if len(new_password) < 8:
            return JsonResponse({"error": "New password must be at least 8 characters."}, status=400)

        if current_password == new_password:
            return JsonResponse({"error": "New password must be different from current password."}, status=400)

        # ── Verify current password ──────────────────────────────
        user = authenticate(username=request.user.username, password=current_password)
        if user is None:
            return JsonResponse({"error": "Current password is incorrect."}, status=400)

        # ── Set new password ─────────────────────────────────────
        user.set_password(new_password)
        user.save()

        # Keep user logged in after password change
        update_session_auth_hash(request, user)

        return JsonResponse({"message": "Password changed successfully."})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)
from django.http import JsonResponse
from django.contrib.sessions.backends.db import SessionStore
from django.contrib.auth import get_user_model
from functools import wraps

def role_required(allowed_roles):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                session_id = request.headers.get("X-Session-ID")
                if session_id:
                    session = SessionStore(session_key=session_id)
                    uid = session.get("_auth_user_id")
                    if uid:
                        User = get_user_model()
                        try:
                            request.user = User.objects.get(pk=uid)
                        except User.DoesNotExist:
                            pass

            if not request.user.is_authenticated:
                return JsonResponse({"error": "Authentication required"}, status=401)

            if request.user.role not in allowed_roles:
                return JsonResponse({"error": "Permission denied"}, status=403)

            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator
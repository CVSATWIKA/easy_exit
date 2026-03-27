from django.urls import path
from .views import (
    my_leaves,
    create_leave,
    hod_requests,
    hod_action,
    manager_requests,
    manager_action,
    warden_requests,
    warden_action,
)
from .warden_tracking import warden_tracking , warden_live_outside  # ← new

urlpatterns = [
    path("my/",      my_leaves),
    path("create/",  create_leave),

    path("hod/",                      hod_requests),
    path("hod/action/<int:leave_id>/", hod_action),

    path("manager/",                      manager_requests),
    path("manager/action/<int:leave_id>/", manager_action),

    path("warden/",                      warden_requests),
    path("warden/action/<int:leave_id>/", warden_action),
    path("warden/tracking/",              warden_tracking),  # ← new

    path("warden/live_outside/",          warden_live_outside), 
 ] # ← new]
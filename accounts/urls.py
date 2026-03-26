from django.urls import path
from .views import login_view, profile_view, change_password_view

urlpatterns = [
    path("login/",           login_view,           name="login"),
    path("profile/",         profile_view,         name="profile"),
    path("change-password/", change_password_view, name="change-password"),
]
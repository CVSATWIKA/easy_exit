from django.urls import path
from .views import login_view, logout_view, profile_view, change_password_view
from .views import load_data


urlpatterns = [
    path("login/",           login_view,           name="login"),
    path("profile/",         profile_view,         name="profile"),
    path("change-password/", change_password_view, name="change-password"),
    path("load-data/",       load_data,            name="load-data"),
    path("logout/",          logout_view,          name="logout"),
]
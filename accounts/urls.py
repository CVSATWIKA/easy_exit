from django.urls import path
from .views import login_view, profile_view, change_password_view
from .views import load_data
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("login/",           login_view,           name="login"),
    path("profile/",         profile_view,         name="profile"),
    path("change-password/", change_password_view, name="change-password"),
    path("load-data/",       load_data,            name="load-data"),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
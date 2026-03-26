from django.urls import path
from .views import scan_qr

urlpatterns = [
    path('scan/<uuid:token>/', scan_qr),
]

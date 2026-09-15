from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    LoginView,
    RegistroView,
  GoogleOauthView,
    PasswordResetRequestView,
    PasswordResetConfirmView
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('registro/', RegistroView.as_view(), name='registro'),
    path('login-oauth/', GoogleOauthView.as_view(), name='google_auth'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
]

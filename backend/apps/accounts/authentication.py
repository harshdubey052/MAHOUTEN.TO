import jwt
from django.conf import settings
from rest_framework import authentication, exceptions
from apps.accounts.models import User

class MongoJWTAuthentication(authentication.BaseAuthentication):
    """
    Authenticates requests using JWT tokens stored in the Authorization header:
    Authorization: Bearer <token>
    """
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None

        token = parts[1]
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=['HS256']
            )
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Access token has expired')
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Invalid authentication token')

        user_id = payload.get('user_id')
        if not user_id:
            raise exceptions.AuthenticationFailed('User identifier missing in token claims')

        try:
            user = User.objects.get(id=user_id)
        except (User.DoesNotExist, Exception):
            raise exceptions.AuthenticationFailed('User not found')

        if user.is_banned:
            raise exceptions.AuthenticationFailed('User account is suspended')

        return (user, token)


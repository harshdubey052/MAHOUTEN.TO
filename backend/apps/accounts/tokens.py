import datetime
import jwt
from django.conf import settings

def generate_tokens_for_user(user):
    """
    Generate access and refresh tokens embedding role and user claims.
    """
    now = datetime.datetime.utcnow()
    
    access_payload = {
        'token_type': 'access',
        'user_id': str(user.id),
        'username': user.username,
        'email': user.email,
        'role': user.role,
        'exp': now + datetime.timedelta(minutes=60),
        'iat': now,
    }
    
    refresh_payload = {
        'token_type': 'refresh',
        'user_id': str(user.id),
        'role': user.role,
        'exp': now + datetime.timedelta(days=7),
        'iat': now,
    }
    
    access_token = jwt.encode(access_payload, settings.SECRET_KEY, algorithm='HS256')
    refresh_token = jwt.encode(refresh_payload, settings.SECRET_KEY, algorithm='HS256')
    
    return {
        'access': access_token,
        'refresh': refresh_token,
        'user': {
            'id': str(user.id),
            'username': user.username,
            'email': user.email,
            'role': user.role,
        }
    }

def decode_refresh_token(refresh_token):
    try:
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=['HS256'])
        if payload.get('token_type') != 'refresh':
            return None
        return payload
    except Exception:
        return None


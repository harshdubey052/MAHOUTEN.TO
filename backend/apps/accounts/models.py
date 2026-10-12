import datetime
import mongoengine as me
from django.contrib.auth.hashers import make_password, check_password

class User(me.Document):
    meta = {
        'collection': 'users',
        'indexes': [
            'email',
            'username',
            'role',
            'is_banned',
        ]
    }
    
    ROLE_CHOICES = ('user', 'admin')
    
    email = me.EmailField(required=True, unique=True)
    username = me.StringField(required=True, unique=True, max_length=50)
    password_hash = me.StringField(required=True)
    role = me.StringField(choices=ROLE_CHOICES, default='user')
    is_banned = me.BooleanField(default=False)
    created_at = me.DateTimeField(default=datetime.datetime.utcnow)
    updated_at = me.DateTimeField(default=datetime.datetime.utcnow)

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    @property
    def is_staff(self):
        return self.role == 'admin'

    @property
    def is_superuser(self):
        return self.role == 'admin'

    def set_password(self, raw_password):
        self.password_hash = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password_hash)

    def __str__(self):
        return f"{self.username} ({self.role})"


class Profile(me.Document):
    meta = {
        'collection': 'profiles',
        'indexes': [
            'user_id',
        ]
    }

    user_id = me.StringField(required=True)
    name = me.StringField(required=True, max_length=50)
    avatar = me.StringField(default='avatar_1')
    is_kids = me.BooleanField(default=False)
    created_at = me.DateTimeField(default=datetime.datetime.utcnow)

    def __str__(self):
        return f"{self.name} (User: {self.user_id})"


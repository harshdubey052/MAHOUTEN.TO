from rest_framework import serializers

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=50, min_length=3)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class UserSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    username = serializers.CharField()
    email = serializers.EmailField()
    role = serializers.CharField()
    is_banned = serializers.BooleanField()
    created_at = serializers.DateTimeField()

class ProfileSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    user_id = serializers.CharField(read_only=True)
    name = serializers.CharField(max_length=50)
    avatar = serializers.CharField(default='avatar_1')
    is_kids = serializers.BooleanField(default=False)
    created_at = serializers.DateTimeField(read_only=True)


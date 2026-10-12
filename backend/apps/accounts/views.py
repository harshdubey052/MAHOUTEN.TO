from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from apps.accounts.models import User, Profile
from apps.accounts.serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer, ProfileSerializer
)
from apps.accounts.tokens import generate_tokens_for_user, decode_refresh_token

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        if User.objects(email=data['email']).first():
            return Response({'error': 'Email is already registered'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects(username=data['username']).first():
            return Response({'error': 'Username is already taken'}, status=status.HTTP_400_BAD_REQUEST)

        user = User(
            email=data['email'],
            username=data['username'],
            role='user'
        )
        user.set_password(data['password'])
        user.save()

        # Create default profile
        default_profile = Profile(
            user_id=str(user.id),
            name=user.username,
            avatar='avatar_1'
        )
        default_profile.save()

        tokens = generate_tokens_for_user(user)
        response = Response({
            'message': 'Registration successful',
            'access': tokens['access'],
            'user': tokens['user'],
            'profiles': [ProfileSerializer(default_profile).data],
        }, status=status.HTTP_201_CREATED)

        # Set refresh token in httpOnly cookie
        response.set_cookie(
            key='refresh_token',
            value=tokens['refresh'],
            httponly=True,
            samesite='Lax',
            max_age=7 * 24 * 3600,
            secure=False # True in production HTTPS
        )
        return response


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        user = User.objects(email=data['email']).first()
        if not user or not user.check_password(data['password']):
            return Response({'error': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)

        if user.is_banned:
            return Response({'error': 'Account is suspended'}, status=status.HTTP_403_FORBIDDEN)

        tokens = generate_tokens_for_user(user)
        user_profiles = Profile.objects(user_id=str(user.id))

        response = Response({
            'message': 'Login successful',
            'access': tokens['access'],
            'user': tokens['user'],
            'profiles': ProfileSerializer(user_profiles, many=True).data,
        }, status=status.HTTP_200_OK)

        response.set_cookie(
            key='refresh_token',
            value=tokens['refresh'],
            httponly=True,
            samesite='Lax',
            max_age=7 * 24 * 3600,
            secure=False
        )
        return response


class RefreshTokenView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token') or request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token missing'}, status=status.HTTP_401_UNAUTHORIZED)

        payload = decode_refresh_token(refresh_token)
        if not payload:
            return Response({'error': 'Invalid or expired refresh token'}, status=status.HTTP_401_UNAUTHORIZED)

        user_id = payload.get('user_id')
        user = User.objects(id=user_id).first()
        if not user or user.is_banned:
            return Response({'error': 'User not found or suspended'}, status=status.HTTP_401_UNAUTHORIZED)

        tokens = generate_tokens_for_user(user)
        response = Response({
            'access': tokens['access'],
            'user': tokens['user'],
        }, status=status.HTTP_200_OK)

        response.set_cookie(
            key='refresh_token',
            value=tokens['refresh'],
            httponly=True,
            samesite='Lax',
            max_age=7 * 24 * 3600,
            secure=False
        )
        return response


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        response = Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)
        response.delete_cookie('refresh_token')
        return response


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profiles = Profile.objects(user_id=str(request.user.id))
        return Response({
            'user': UserSerializer(request.user).data,
            'profiles': ProfileSerializer(profiles, many=True).data,
        })


class ProfileListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profiles = Profile.objects(user_id=str(request.user.id))
        return Response(ProfileSerializer(profiles, many=True).data)

    def post(self, request):
        count = Profile.objects(user_id=str(request.user.id)).count()
        if count >= 5:
            return Response({'error': 'Maximum 5 profiles allowed per account'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ProfileSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        profile = Profile(
            user_id=str(request.user.id),
            name=data['name'],
            avatar=data.get('avatar', 'avatar_1'),
            is_kids=data.get('is_kids', False)
        )
        profile.save()
        return Response(ProfileSerializer(profile).data, status=status.HTTP_201_CREATED)


class ProfileDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_profile(self, profile_id, user_id):
        return Profile.objects(id=profile_id, user_id=str(user_id)).first()

    def get(self, request, pk):
        profile = self.get_profile(pk, request.user.id)
        if not profile:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ProfileSerializer(profile).data)

    def patch(self, request, pk):
        profile = self.get_profile(pk, request.user.id)
        if not profile:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

        if 'name' in request.data:
            profile.name = request.data['name']
        if 'avatar' in request.data:
            profile.avatar = request.data['avatar']
        if 'is_kids' in request.data:
            profile.is_kids = request.data['is_kids']
        profile.save()
        return Response(ProfileSerializer(profile).data)

    def delete(self, request, pk):
        profile = self.get_profile(pk, request.user.id)
        if not profile:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

        count = Profile.objects(user_id=str(request.user.id)).count()
        if count <= 1:
            return Response({'error': 'Cannot delete the primary profile'}, status=status.HTTP_400_BAD_REQUEST)

        profile.delete()
        return Response({'message': 'Profile deleted'}, status=status.HTTP_204_NO_CONTENT)


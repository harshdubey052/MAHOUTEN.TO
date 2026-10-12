from rest_framework import permissions

class IsAdminRole(permissions.BasePermission):
    """
    Allows access only to authenticated users with role='admin'.
    Normal users receive 403 Forbidden.
    """
    message = "Admin privileges required to access this endpoint."

    def has_permission(self, request, view):
        return bool(
            request.user and 
            getattr(request.user, 'is_authenticated', False) and 
            getattr(request.user, 'role', None) == 'admin' and
            not getattr(request.user, 'is_banned', False)
        )


class IsActiveUser(permissions.BasePermission):
    """
    Allows access only to authenticated, non-banned users.
    """
    message = "Your account has been suspended or is inactive."

    def has_permission(self, request, view):
        return bool(
            request.user and 
            getattr(request.user, 'is_authenticated', False) and 
            not getattr(request.user, 'is_banned', False)
        )


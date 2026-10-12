import os
import getpass
from django.core.management.base import BaseCommand, CommandError
from apps.accounts.models import User, Profile

class Command(BaseCommand):
    help = 'Creates or updates an administrator user in the MongoDB database without hardcoded credentials.'

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, default=None, help='Admin username')
        parser.add_argument('--email', type=str, default=None, help='Admin email address')
        parser.add_argument('--password', type=str, default=None, help='Admin password')

    def handle(self, *args, **options):
        username = options.get('username') or os.getenv('ADMIN_USERNAME')
        email = options.get('email') or os.getenv('ADMIN_EMAIL')
        password = options.get('password') or os.getenv('ADMIN_PASSWORD')

        # Interactive prompts if missing in interactive terminal
        try:
            if not username:
                username = input('Enter admin username: ').strip() or 'admin'
            if not email:
                email = input('Enter admin email: ').strip()
            if not password:
                password = getpass.getpass('Enter admin password: ').strip()
        except (EOFError, KeyboardInterrupt):
            raise CommandError("Operation cancelled.")

        if not email or not password:
            raise CommandError(
                "Both email and password are required. Provide them via flags (--email, --password) "
                "or environment variables (ADMIN_EMAIL, ADMIN_PASSWORD)."
            )

        if len(password) < 6:
            raise CommandError("Password must be at least 6 characters long.")

        user = User.objects(email=email).first()
        if user:
            user.role = 'admin'
            user.username = username or user.username
            user.set_password(password)
            user.is_banned = False
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Updated existing user '{email}' to admin role."))
        else:
            user = User(
                username=username or 'admin',
                email=email,
                role='admin',
                is_banned=False
            )
            user.set_password(password)
            user.save()

            Profile(
                user_id=str(user.id),
                name=username or 'Admin',
                avatar='avatar_1'
            ).save()
            self.stdout.write(self.style.SUCCESS(f"Admin account created successfully! Username: {username}, Email: {email}"))

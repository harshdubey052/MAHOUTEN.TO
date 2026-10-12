from django.core.management.base import BaseCommand
from apps.accounts.models import User, Profile

class Command(BaseCommand):
    help = 'Creates an administrator user in the MongoDB database'

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, default='admin', help='Admin username')
        parser.add_argument('--email', type=str, default='admin@mahouten.to', help='Admin email')
        parser.add_argument('--password', type=str, default='admin12345', help='Admin password')

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        password = options['password']

        user = User.objects(email=email).first()
        if user:
            user.role = 'admin'
            user.username = username
            user.set_password(password)
            user.is_banned = False
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Updated existing user '{email}' to admin role."))
        else:
            user = User(
                username=username,
                email=email,
                role='admin',
                is_banned=False
            )
            user.set_password(password)
            user.save()

            # Ensure profile exists
            Profile(
                user_id=str(user.id),
                name='Admin Master',
                avatar='avatar_admin'
            ).save()
            self.stdout.write(self.style.SUCCESS(f"Admin account created successfully! Username: {username}, Email: {email}"))


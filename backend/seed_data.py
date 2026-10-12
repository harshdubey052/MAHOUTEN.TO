#!/usr/bin/env python
import os
import sys

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mahouten.settings')
import django
django.setup()

from mahouten.init_db import init_production_database


def seed():
    """
    Initializes database indexes, collections, genres, and admin user
    with zero demo or hardcoded values.
    """
    print("[Mahouten] Initializing production database...")
    init_production_database()
    print("[Mahouten] Production database ready.")


if __name__ == '__main__':
    seed()

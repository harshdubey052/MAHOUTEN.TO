import datetime
import mongoengine as me

class Genre(me.Document):
    meta = {
        'collection': 'genres',
        'indexes': ['slug', 'name']
    }
    name = me.StringField(required=True, unique=True, max_length=50)
    slug = me.StringField(required=True, unique=True, max_length=60)
    description = me.StringField(default='')

    def __str__(self):
        return self.name


class Anime(me.Document):
    meta = {
        'collection': 'anime',
        'indexes': [
            'slug',
            'genres',
            'featured',
            'publish_status',
            'publish_at',
            'rating',
            'year',
            'type',
            'created_at',
            {'fields': ['$title', '$synopsis'], 'default_language': 'english'}
        ]
    }

    STATUS_CHOICES = ('ongoing', 'completed', 'upcoming')
    TYPE_CHOICES = ('series', 'movie', 'clip')
    PUBLISH_CHOICES = ('draft', 'published', 'scheduled')

    title = me.StringField(required=True, max_length=200)
    slug = me.StringField(required=True, unique=True, max_length=220)
    synopsis = me.StringField(default='')
    genres = me.ListField(me.StringField(), default=list) # stores genre names or slugs
    year = me.IntField(default=datetime.datetime.utcnow().year)
    studio = me.StringField(default='')
    status = me.StringField(choices=STATUS_CHOICES, default='ongoing')
    type = me.StringField(choices=TYPE_CHOICES, default='series')
    rating = me.FloatField(default=0.0) # 0.0 to 10.0
    age_rating = me.StringField(default='')
    poster = me.StringField(default='') # URL or media path
    banner = me.StringField(default='') # Hero banner URL
    trailer_url = me.StringField(default='')
    featured = me.BooleanField(default=False)
    publish_status = me.StringField(choices=PUBLISH_CHOICES, default='published')
    publish_at = me.DateTimeField(default=datetime.datetime.utcnow)
    created_by = me.StringField(default='system')
    created_at = me.DateTimeField(default=datetime.datetime.utcnow)
    updated_at = me.DateTimeField(default=datetime.datetime.utcnow)

    def is_publicly_visible(self):
        if self.publish_status != 'published':
            return False
        if self.publish_at and self.publish_at > datetime.datetime.utcnow():
            return False
        return True

    def __str__(self):
        return f"{self.title} ({self.year})"


class Season(me.Document):
    meta = {
        'collection': 'seasons',
        'indexes': [
            'anime_id',
            ('anime_id', 'number')
        ]
    }
    anime_id = me.StringField(required=True)
    number = me.IntField(required=True, default=1)
    title = me.StringField(required=True, max_length=100)
    episodes_count = me.IntField(default=0)
    order = me.IntField(default=1)

    def __str__(self):
        return f"{self.title} (Season {self.number})"


class Episode(me.Document):
    meta = {
        'collection': 'episodes',
        'indexes': [
            'anime_id',
            'season',
            'number',
            'publish_status',
            'publish_at',
            'created_at'
        ]
    }

    PUBLISH_CHOICES = ('draft', 'published', 'scheduled')
    PROCESSING_CHOICES = ('none', 'uploading', 'processing', 'ready', 'failed')

    anime_id = me.StringField(required=True)
    season = me.IntField(required=True, default=1)
    number = me.IntField(required=True, default=1)
    title = me.StringField(required=True, max_length=200)
    synopsis = me.StringField(default='')
    duration = me.IntField(default=1440) # duration in seconds (24 min default)
    thumbnail = me.StringField(default='')
    video_source_type = me.StringField(choices=('url', 'upload'), default='url')
    hls_url = me.StringField(default='')
    subtitles = me.ListField(me.DictField(), default=list) # [{'lang': 'en', 'label': 'English', 'src': '...'}]
    intro_start = me.FloatField(default=0.0)
    intro_end = me.FloatField(default=0.0)
    publish_status = me.StringField(choices=PUBLISH_CHOICES, default='published')
    publish_at = me.DateTimeField(default=datetime.datetime.utcnow)
    processing_status = me.StringField(choices=PROCESSING_CHOICES, default='ready')
    created_at = me.DateTimeField(default=datetime.datetime.utcnow)
    updated_at = me.DateTimeField(default=datetime.datetime.utcnow)

    def is_publicly_visible(self):
        if self.publish_status != 'published':
            return False
        if self.publish_at and self.publish_at > datetime.datetime.utcnow():
            return False
        return True

    def __str__(self):
        return f"Ep {self.number}: {self.title}"


class HomepageRow(me.Document):
    meta = {
        'collection': 'homepage_rows',
        'indexes': ['order', 'is_active']
    }
    title = me.StringField(required=True, max_length=100)
    row_type = me.StringField(choices=('curated', 'genre', 'top_rated', 'trending', 'new_releases'), default='curated')
    genre_slug = me.StringField(default='')
    anime_ids = me.ListField(me.StringField(), default=list)
    order = me.IntField(default=1)
    is_active = me.BooleanField(default=True)

    def __str__(self):
        return f"Row: {self.title} (#{self.order})"


class Review(me.Document):
    meta = {
        'collection': 'reviews',
        'indexes': [
            'anime_id',
            'user_id',
            ('anime_id', 'user_id')
        ]
    }
    user_id = me.StringField(required=True)
    username = me.StringField(required=True)
    anime_id = me.StringField(required=True)
    rating = me.IntField(min_value=1, max_value=10, required=True)
    comment = me.StringField(default='')
    created_at = me.DateTimeField(default=datetime.datetime.utcnow)


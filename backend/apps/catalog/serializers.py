from rest_framework import serializers

class GenreSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(max_length=50)
    slug = serializers.CharField(max_length=60)
    description = serializers.CharField(required=False, allow_blank=True)


class AnimeListSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    title = serializers.CharField()
    slug = serializers.CharField()
    synopsis = serializers.CharField()
    genres = serializers.ListField(child=serializers.CharField())
    year = serializers.IntegerField()
    studio = serializers.CharField()
    status = serializers.CharField()
    type = serializers.CharField()
    rating = serializers.FloatField()
    age_rating = serializers.CharField()
    poster = serializers.CharField()
    banner = serializers.CharField()
    featured = serializers.BooleanField()


class EpisodeListSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    anime_id = serializers.CharField()
    season = serializers.IntegerField()
    number = serializers.IntegerField()
    title = serializers.CharField()
    synopsis = serializers.CharField()
    duration = serializers.IntegerField()
    thumbnail = serializers.CharField()
    hls_url = serializers.CharField()
    subtitles = serializers.ListField(child=serializers.DictField())
    intro_start = serializers.FloatField()
    intro_end = serializers.FloatField()
    processing_status = serializers.CharField()


class SeasonSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    anime_id = serializers.CharField()
    number = serializers.IntegerField()
    title = serializers.CharField()
    episodes_count = serializers.IntegerField()
    order = serializers.IntegerField()


class AnimeDetailSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    title = serializers.CharField()
    slug = serializers.CharField()
    synopsis = serializers.CharField()
    genres = serializers.ListField(child=serializers.CharField())
    year = serializers.IntegerField()
    studio = serializers.CharField()
    status = serializers.CharField()
    type = serializers.CharField()
    rating = serializers.FloatField()
    age_rating = serializers.CharField()
    poster = serializers.CharField()
    banner = serializers.CharField()
    trailer_url = serializers.CharField()
    featured = serializers.BooleanField()
    seasons = serializers.ListField(child=serializers.DictField(), read_only=True)
    episodes = serializers.ListField(child=serializers.DictField(), read_only=True)
    similar = serializers.ListField(child=serializers.DictField(), read_only=True)


class HomepageRowSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    title = serializers.CharField()
    row_type = serializers.CharField()
    genre_slug = serializers.CharField(required=False)
    order = serializers.IntegerField()
    items = serializers.ListField(child=serializers.DictField(), read_only=True)


class ReviewSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    user_id = serializers.CharField(read_only=True)
    username = serializers.CharField(read_only=True)
    anime_id = serializers.CharField()
    rating = serializers.IntegerField(min_value=1, max_value=10)
    comment = serializers.CharField(required=False, allow_blank=True)
    created_at = serializers.DateTimeField(read_only=True)


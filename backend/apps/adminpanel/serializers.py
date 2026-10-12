from rest_framework import serializers

class AdminShowSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    title = serializers.CharField(max_length=200)
    slug = serializers.CharField(max_length=220, required=False)
    synopsis = serializers.CharField(required=False, allow_blank=True)
    genres = serializers.ListField(child=serializers.CharField(), required=False)
    year = serializers.IntegerField(required=False)
    studio = serializers.CharField(required=False, allow_blank=True, default='')
    status = serializers.ChoiceField(choices=['ongoing', 'completed', 'upcoming'], default='ongoing')
    type = serializers.ChoiceField(choices=['series', 'movie'], default='series')
    rating = serializers.FloatField(required=False, default=0.0)
    age_rating = serializers.CharField(required=False, allow_blank=True, default='')
    poster = serializers.CharField(required=False, allow_blank=True)
    banner = serializers.CharField(required=False, allow_blank=True)
    trailer_url = serializers.CharField(required=False, allow_blank=True)
    featured = serializers.BooleanField(default=False)
    publish_status = serializers.ChoiceField(choices=['draft', 'published', 'scheduled'], default='published')
    publish_at = serializers.DateTimeField(required=False)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class AdminSeasonSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    anime_id = serializers.CharField()
    number = serializers.IntegerField()
    title = serializers.CharField(max_length=100)
    episodes_count = serializers.IntegerField(default=0)
    order = serializers.IntegerField(default=1)


class AdminEpisodeSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    anime_id = serializers.CharField()
    season = serializers.IntegerField()
    number = serializers.IntegerField()
    title = serializers.CharField(max_length=200)
    synopsis = serializers.CharField(required=False, allow_blank=True)
    duration = serializers.IntegerField(default=1440)
    thumbnail = serializers.CharField(required=False, allow_blank=True)
    video_source_type = serializers.ChoiceField(choices=['url', 'upload'], default='url')
    hls_url = serializers.CharField(required=False, allow_blank=True)
    subtitles = serializers.ListField(child=serializers.DictField(), required=False)
    intro_start = serializers.FloatField(default=0.0)
    intro_end = serializers.FloatField(default=0.0)
    publish_status = serializers.ChoiceField(choices=['draft', 'published', 'scheduled'], default='published')
    publish_at = serializers.DateTimeField(required=False)
    processing_status = serializers.ChoiceField(choices=['none', 'uploading', 'processing', 'ready', 'failed'], default='ready')
    created_at = serializers.DateTimeField(read_only=True)


class BulkEpisodeItemSerializer(serializers.Serializer):
    number = serializers.IntegerField()
    title = serializers.CharField()
    hls_url = serializers.CharField()
    duration = serializers.IntegerField(default=1440)
    thumbnail = serializers.CharField(required=False, allow_blank=True)


class BulkEpisodesSerializer(serializers.Serializer):
    anime_id = serializers.CharField(required=False)
    show = serializers.CharField(required=False)
    season = serializers.IntegerField(default=1)
    episodes = serializers.ListField(child=BulkEpisodeItemSerializer())

    def validate(self, attrs):
        if not attrs.get('anime_id') and not attrs.get('show'):
            raise serializers.ValidationError("Either 'anime_id' or 'show' is required.")
        if not attrs.get('anime_id'):
            attrs['anime_id'] = attrs['show']
        return attrs


class AdminUserSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    username = serializers.CharField()
    email = serializers.EmailField()
    role = serializers.CharField()
    is_banned = serializers.BooleanField()
    created_at = serializers.DateTimeField()


class AuditLogSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    admin_id = serializers.CharField()
    admin_username = serializers.CharField()
    action = serializers.CharField()
    entity_type = serializers.CharField()
    entity_id = serializers.CharField()
    details = serializers.CharField()
    created_at = serializers.DateTimeField()


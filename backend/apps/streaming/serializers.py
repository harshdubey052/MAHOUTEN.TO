from rest_framework import serializers

class WatchProgressSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    profile_id = serializers.CharField()
    episode_id = serializers.CharField()
    anime_id = serializers.CharField()
    seconds = serializers.IntegerField(default=0)
    duration = serializers.IntegerField(default=1440)
    completed = serializers.BooleanField(default=False)
    updated_at = serializers.DateTimeField(read_only=True)


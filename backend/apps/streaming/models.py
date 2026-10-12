import datetime
import mongoengine as me

class WatchProgress(me.Document):
    meta = {
        'collection': 'watch_progress',
        'indexes': [
            'profile_id',
            'episode_id',
            'anime_id',
            ('profile_id', 'episode_id'),
            'updated_at'
        ]
    }
    profile_id = me.StringField(required=True)
    episode_id = me.StringField(required=True)
    anime_id = me.StringField(required=True)
    seconds = me.IntField(default=0)
    duration = me.IntField(default=1440)
    completed = me.BooleanField(default=False)
    updated_at = me.DateTimeField(default=datetime.datetime.utcnow)

    def __str__(self):
        return f"Progress Profile:{self.profile_id} Ep:{self.episode_id} ({self.seconds}s)"


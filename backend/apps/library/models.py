import datetime
import mongoengine as me

class MyList(me.Document):
    meta = {
        'collection': 'my_list',
        'indexes': [
            'profile_id',
            'anime_id',
            ('profile_id', 'anime_id'),
            'added_at'
        ]
    }
    profile_id = me.StringField(required=True)
    anime_id = me.StringField(required=True)
    added_at = me.DateTimeField(default=datetime.datetime.utcnow)

    def __str__(self):
        return f"MyList Profile:{self.profile_id} Anime:{self.anime_id}"


class WatchHistory(me.Document):
    meta = {
        'collection': 'watch_history',
        'indexes': [
            'profile_id',
            'anime_id',
            ('profile_id', 'anime_id'),
            'last_watched_at'
        ]
    }
    profile_id = me.StringField(required=True)
    anime_id = me.StringField(required=True)
    last_episode_id = me.StringField(required=True)
    last_watched_at = me.DateTimeField(default=datetime.datetime.utcnow)

    def __str__(self):
        return f"History Profile:{self.profile_id} Anime:{self.anime_id}"


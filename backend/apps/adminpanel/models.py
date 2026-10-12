import datetime
import mongoengine as me

class AuditLog(me.Document):
    meta = {
        'collection': 'audit_logs',
        'indexes': [
            'admin_id',
            'action',
            'entity_type',
            'created_at'
        ]
    }
    ACTION_CHOICES = ('create', 'update', 'delete', 'publish', 'unpublish', 'ban', 'unban', 'role_change')

    admin_id = me.StringField(required=True)
    admin_username = me.StringField(required=True)
    action = me.StringField(choices=ACTION_CHOICES, required=True)
    entity_type = me.StringField(required=True) # 'show', 'season', 'episode', 'user', 'genre'
    entity_id = me.StringField(required=True)
    details = me.StringField(default='')
    created_at = me.DateTimeField(default=datetime.datetime.utcnow)

    def __str__(self):
        return f"[{self.created_at.strftime('%Y-%m-%d %H:%M')}] {self.admin_username} {self.action} {self.entity_type} {self.entity_id}"


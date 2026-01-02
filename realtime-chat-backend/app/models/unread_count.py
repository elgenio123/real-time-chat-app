from app.extensions import db

class UnreadCount(db.Model):
    __tablename__ = "unread_counts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    chat_id = db.Column(db.Integer, db.ForeignKey("private_chats.id"), nullable=False)
    count = db.Column(db.Integer, default=0, nullable=False)

    __table_args__ = (db.UniqueConstraint('user_id', 'chat_id', name='unique_user_chat'),)

    def __repr__(self):
        return f"<UnreadCount user={self.user_id} chat={self.chat_id} count={self.count}>"
from datetime import datetime
from app.extensions import db

class PrivateChat(db.Model):
    __tablename__ = "private_chats"

    id = db.Column(db.Integer, primary_key=True)

    user1_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    user2_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<PrivateChat {self.user1_id}-{self.user2_id}>"

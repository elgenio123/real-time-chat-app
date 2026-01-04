from datetime import datetime
from app.extensions import db

class PrivateMessage(db.Model):
    __tablename__ = "private_messages"

    id = db.Column(db.Integer, primary_key=True)

    content = db.Column(db.Text, nullable=False)

    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    chat_id = db.Column(db.Integer, db.ForeignKey("private_chats.id"), nullable=False)

    sender = db.relationship("User")
    chat = db.relationship("PrivateChat", backref="messages")

    def __repr__(self):
        return f"<PrivateMessage {self.id} in Chat {self.chat_id}>"

    def to_dict(self):
        from app.models.file import File
        
        # Get files associated with this message
        files = File.query.filter_by(private_message_id=self.id).all()
        
        return {
            "id": self.id,
            "content": self.content,
            "timestamp": self.timestamp.isoformat(),
            "sender": {
                "id": self.sender.id,
                "username": self.sender.username,
                "avatar_url": self.sender.avatar_url
            },
            "files": [file.to_dict() for file in files] if files else []
        }
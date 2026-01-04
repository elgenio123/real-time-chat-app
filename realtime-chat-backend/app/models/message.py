from datetime import datetime
from app.extensions import db

class Message(db.Model):
    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True)

    content = db.Column(db.Text, nullable=False)

    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    user = db.relationship("User", back_populates="messages")

    def __repr__(self):
        return f"<Message {self.id} by User {self.user_id}>"
    
    def to_dict(self):
        from app.models.file import File
        
        # Get associated files if any
        files = File.query.filter_by(public_message_id=self.id).all()
        
        return {
            "id": self.id,
            "content": self.content,
            "timestamp": self.timestamp.isoformat(),
            "user": {
                "id": self.user.id,
                "username": self.user.username,
                'avatar_url': self.user.avatar_url
            },
            "files": [file.to_dict() for file in files] if files else []
        }

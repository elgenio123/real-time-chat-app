from datetime import datetime
from app.extensions import db

class File(db.Model):
    __tablename__ = "files"

    id = db.Column(db.Integer, primary_key=True)

    filename = db.Column(db.String(255), nullable=False)
    file_url = db.Column(db.Text, nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    file_type = db.Column(db.String(100), nullable=True)  # e.g., 'image/png', 'application/pdf'

    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    uploader_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    # Optional associations
    public_message_id = db.Column(db.Integer, db.ForeignKey("messages.id"), nullable=True)
    private_message_id = db.Column(db.Integer, db.ForeignKey("private_messages.id"), nullable=True)
    private_chat_id = db.Column(db.Integer, db.ForeignKey("private_chats.id"), nullable=True)

    uploader = db.relationship("User")

    def __repr__(self):
        return f"<File {self.filename}>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "filename": self.filename,
            "file_url": self.file_url,
            "file_size": self.file_size,
            "file_type": self.file_type or 'application/octet-stream',
            "uploaded_at": self.uploaded_at.isoformat(),
            "uploader": {
                "id": self.uploader.id,
                "username": self.uploader.username
            },
            "public_message_id": self.public_message_id,
            "private_message_id": self.private_message_id,
            "private_chat_id": self.private_chat_id
        }

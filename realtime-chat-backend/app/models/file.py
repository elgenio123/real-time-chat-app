from datetime import datetime
from app.extensions import db

class File(db.Model):
    __tablename__ = "files"

    id = db.Column(db.Integer, primary_key=True)

    filename = db.Column(db.String(255), nullable=False)
    file_url = db.Column(db.Text, nullable=False)
    file_size = db.Column(db.Integer, nullable=False)

    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    uploader_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    # Optional associations
    public_message_id = db.Column(db.Integer, db.ForeignKey("messages.id"), nullable=True)
    private_message_id = db.Column(db.Integer, db.ForeignKey("private_messages.id"), nullable=True)

    uploader = db.relationship("User")

    def __repr__(self):
        return f"<File {self.filename}>"

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.file import File
from app.models.message import Message
from app.models.private_message import PrivateMessage
from app.models.private_chat import PrivateChat

files_bp = Blueprint("files", __name__)

@files_bp.route("/", methods=["POST"])
@jwt_required()
def create_file():
    data = request.get_json()
    user_id = int(get_jwt_identity())

    # Validate required fields
    if not all(k in data for k in ["filename", "file_url", "file_size"]):
        return jsonify({"message": "Missing required fields: filename, file_url, file_size"}), 400

    # Validate file size (max 5MB)
    max_size = 5 * 1024 * 1024  # 5MB in bytes
    if data["file_size"] > max_size:
        return jsonify({"message": "File size exceeds 5MB limit"}), 400

    # Validate file type
    allowed_extensions = {'.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'}
    filename = data["filename"].lower()
    if not any(filename.endswith(ext) for ext in allowed_extensions):
        return jsonify({"message": "Invalid file type. Allowed: PDF, DOC, DOCX, and image files"}), 400

    # Validate associations (at least one)
    associations = ["public_message_id", "private_chat_id"]
    provided_associations = [k for k in associations if k in data and data[k] is not None]
    if len(provided_associations) != 1:
        return jsonify({"message": "Exactly one association required: public_message_id, or private_chat_id"}), 400

    # Validate the association belongs to user
    assoc_type = provided_associations[0]
    assoc_id = data[assoc_type]

    if assoc_type == "public_message_id":
        message = db.session.get(Message, assoc_id)
        if not message or message.user_id != user_id:
            return jsonify({"message": "Invalid public message"}), 400
    elif assoc_type == "private_chat_id":
        chat = db.session.get(PrivateChat, assoc_id)
        if not chat or (chat.user1_id != user_id and chat.user2_id != user_id):
            return jsonify({"message": "Invalid private chat"}), 400

    file_record = File(
        filename=data["filename"],
        file_url=data["file_url"],
        file_size=data["file_size"],
        uploader_id=user_id,
        public_message_id=data.get("public_message_id"),
        private_chat_id=data.get("private_chat_id")
    )

    db.session.add(file_record)
    db.session.commit()

    return jsonify(file_record.to_dict()), 201

@files_bp.route("/", methods=["GET"])
@jwt_required()
def get_files():
    user_id = int(get_jwt_identity())

    files = File.query.filter_by(uploader_id=user_id).order_by(File.uploaded_at.desc()).all()

    return jsonify([file.to_dict() for file in files]), 200

@files_bp.route("/private/<int:chat_id>", methods=["GET"])
@jwt_required()
def get_files_private(chat_id):

    files = File.query.filter_by(private_chat_id=chat_id).order_by(File.uploaded_at.desc()).all()

    return jsonify({"files": [file.to_dict() for file in files]}), 200


@files_bp.route("/public/<int:message_id>", methods=["GET"])
@jwt_required()
def get_files_public(message_id):

    files = File.query.filter_by(public_message_id=message_id).order_by(File.uploaded_at.desc()).all()

    return jsonify({"files": [file.to_dict() for file in files]}), 200


@files_bp.route("/<int:file_id>", methods=["GET"])
@jwt_required()
def get_file(file_id):
    user_id = int(get_jwt_identity())
    file_record = db.session.get(File, file_id)

    if not file_record:
        return jsonify({"message": "File not found"}), 404

    if file_record.uploader_id != user_id:
        return jsonify({"message": "Access denied"}), 403

    return jsonify({"file": file_record.to_dict()}), 200


@files_bp.route("/<int:file_id>", methods=["DELETE"])
@jwt_required()
def delete_file(file_id):
    user_id = int(get_jwt_identity())
    file_record = db.session.get(File, file_id)

    if not file_record:
        return jsonify({"message": "File not found"}), 404

    if file_record.uploader_id != user_id:
        return jsonify({"message": "Access denied"}), 403

    db.session.delete(file_record)
    db.session.commit()

    return jsonify({"message": "File deleted"}), 200
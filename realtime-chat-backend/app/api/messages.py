from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.message import Message
from app.models.private_message import PrivateMessage
from app.models.private_chat import PrivateChat
from app.models.user import User
from app.models.unread_count import UnreadCount

messages_bp = Blueprint("messages", __name__)

# Public messages
@messages_bp.route("/messages", methods=["GET"])
@jwt_required()
def get_messages():
    messages = Message.query.order_by(Message.timestamp).all()
    return jsonify({"messages": [message.to_dict() for message in messages]}), 200



@messages_bp.route("/messages", methods=["POST"])
@jwt_required()
def create_message():
    data = request.get_json()
    user_id = int(get_jwt_identity())

    message = Message(
        content=data["content"],
        user_id=user_id
    )
    db.session.add(message)
    db.session.commit()

    return jsonify(message.to_dict()), 201



# Private messages
@messages_bp.route("/messages/private/<int:other_user_id>", methods=["GET"])
@jwt_required()
def get_private_messages(other_user_id):
    user_id = int(get_jwt_identity())

    chat = PrivateChat.get_chat_between_users(user_id, other_user_id)
    if not chat:
        return jsonify({"messages": []}), 200

    messages = PrivateMessage.query.filter_by(chat_id=chat.id).order_by(PrivateMessage.timestamp).all()
    return jsonify({"messages": [message.to_dict() for message in messages]}), 200



@messages_bp.route("/messages/private/<int:other_user_id>", methods=["POST"])
@jwt_required()
def create_private_message(other_user_id):
    data = request.get_json()
    user_id = int(get_jwt_identity())

    if user_id == other_user_id:
        return jsonify({"message": "Cannot send message to yourself"}), 400

    chat = PrivateChat.get_chat_between_users(user_id, other_user_id)
    if not chat:
        chat = PrivateChat(user1_id=user_id, user2_id=other_user_id)
        db.session.add(chat)
        db.session.commit()

    message = PrivateMessage(
        content=data["content"],
        sender_id=user_id,
        chat_id=chat.id
    )
    db.session.add(message)

    # Increment unread count for the other user
    unread = UnreadCount.query.filter_by(user_id=other_user_id, chat_id=chat.id).first()
    if not unread:
        unread = UnreadCount(user_id=other_user_id, chat_id=chat.id, count=1)
        db.session.add(unread)
    else:
        unread.count += 1

    db.session.commit()

    return jsonify(message.to_dict()), 201

@messages_bp.route("/messages/<int:message_id>", methods=["DELETE"])
@jwt_required()
def delete_message(message_id):
    user_id = int(get_jwt_identity())
    message = db.session.get(Message, message_id)

    if not message:
        return jsonify({"message": "Message not found"}), 404

    if message.user_id != user_id:
        return jsonify({"message": "You can only delete your own messages"}), 403

    db.session.delete(message)
    db.session.commit()

    return jsonify({"message": "Message deleted"}), 200



@messages_bp.route("/messages/private/<int:other_user_id>/<int:message_id>", methods=["DELETE"])
@jwt_required()
def delete_private_message(other_user_id, message_id):
    user_id = int(get_jwt_identity())
    message = db.session.get(PrivateMessage, message_id)

    if not message:
        return jsonify({"message": "Message not found"}), 404

    if message.sender_id != user_id:
        return jsonify({"message": "You can only delete your own messages"}), 403

    # Verify the chat is between user and other_user_id
    chat = PrivateChat.get_chat_between_users(user_id, other_user_id)
    if not chat or message.chat_id != chat.id:
        return jsonify({"message": "Invalid chat or message"}), 404

    db.session.delete(message)
    db.session.commit()

    return jsonify({"message": "Message deleted"}), 200

#get all private chats for the logged in user
@messages_bp.route("/chats", methods=["GET"])
@jwt_required()
def get_private_chats():
    user_id = int(get_jwt_identity())
    chats = PrivateChat.query.filter(
        (PrivateChat.user1_id == user_id) | (PrivateChat.user2_id == user_id)
    ).all()

    chat_list = []
    for chat in chats:
        other_user_id = chat.user2_id if chat.user1_id == user_id else chat.user1_id
        other_user = db.session.get(User, other_user_id)
        unread = UnreadCount.query.filter_by(user_id=user_id, chat_id=chat.id).first()
        unread_count = unread.count if unread else 0
        chat_list.append({
            "chat_id": chat.id,
            "other_user": other_user.to_dict() if other_user else None,
            "unread_count": unread_count
        })

    return jsonify({"chats": chat_list}), 200

@messages_bp.route("/chats/<int:chat_id>/read", methods=["POST"])
@jwt_required()
def mark_chat_as_read(chat_id):
    user_id = int(get_jwt_identity())
    chat = db.session.get(PrivateChat, chat_id)
    if not chat or (chat.user1_id != user_id and chat.user2_id != user_id):
        return jsonify({"message": "Chat not found"}), 404

    unread = UnreadCount.query.filter_by(user_id=user_id, chat_id=chat_id).first()
    if unread:
        unread.count = 0
        db.session.commit()

    return jsonify({"message": "Chat marked as read"}), 200
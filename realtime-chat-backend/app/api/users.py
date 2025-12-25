from flask import Blueprint, request, jsonify
from app.models.user import User
from app.extensions import db

user_bp = Blueprint("user", __name__)

@user_bp.route("/", methods=["GET"])
def get_users():

    users = User.query.all()
    return jsonify({"users": [user.to_dict() for user in users]}), 200

@user_bp.route("/<int:user_id>", methods=["GET"])
def get_user(user_id):

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200

@user_bp.route("/<int:user_id>", methods=["PUT"])
def update_user(user_id):

    data = request.get_json()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    if "username" in data:
        user.username = data["username"]
    if "email" in data:
        user.email = data["email"]
    if "password" in data:
        user.set_password(data["password"])

    db.session.commit()

    return jsonify({"message": "User updated successfully",
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email},
                    }), 200

@user_bp.route("/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "User deleted successfully"}), 200
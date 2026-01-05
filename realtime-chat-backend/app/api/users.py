from flask import Blueprint, request, jsonify
from app.models.user import User
from app.extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity

user_bp = Blueprint("user", __name__)

@user_bp.route("/", methods=["GET"])
def get_users():

    users = User.query.all()
    return jsonify({"users": [user.to_dict() for user in users]}), 200

@user_bp.route("/auth-user", methods=["GET"])
@jwt_required()
def get_auth_user():

    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200

@user_bp.route("/auth-user", methods=["PUT"])
@jwt_required()
def update_auth_user():

    data = request.get_json()
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    if "username" in data:
        user.username = data["username"]
    if "email" in data:
        user.email = data["email"]
    if "password" in data:
        user.set_password(data["password"])
    if "avatar_url" in data:
        user.avatar_url = data["avatar_url"]

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

@user_bp.route("/<int:user_id>", methods=["GET"])
def get_user(user_id):

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200
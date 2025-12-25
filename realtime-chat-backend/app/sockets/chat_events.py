from flask import request
from flask_socketio import emit, join_room, leave_room, disconnect
from flask_jwt_extended import decode_token, verify_jwt_in_request
from app.extensions import socketio, db
from app.models.user import User
from app.models.message import Message
from app.models.private_message import PrivateMessage
from app.models.private_chat import PrivateChat

# Store connected users and their rooms
connected_users = {}
public_room = "public_chat"

@socketio.on('connect')
def handle_connect():
    """Handle client connection with JWT authentication"""
    try:
        # Get token from query parameters
        token = request.args.get('token')

        if token:
            # Try to authenticate with token
            try:
                payload = decode_token(token)
                user_id = payload['sub']
            except Exception as e:
                print(f"Token decode error: {e}")
                disconnect()
                return False

            # Verify user exists
            user = db.session.get(User, int(user_id))
            if not user:
                disconnect()
                return False

            # Store user connection info
            connected_users[request.sid] = {
                'user_id': user.id,
                'username': user.username,
                'rooms': set()
            }

            print(f"User {user.username} connected with SID {request.sid}")
            emit('connected', {'message': f'Welcome {user.username}!'})
        else:
            # Allow anonymous connection for testing
            connected_users[request.sid] = {
                'user_id': None,
                'username': 'Anonymous',
                'rooms': set()
            }
            print(f"Anonymous user connected with SID {request.sid}")
            emit('connected', {'message': 'Welcome Anonymous!'})

    except Exception as e:
        print(f"Connection error: {e}")
        disconnect()
        return False

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    if request.sid in connected_users:
        user_info = connected_users[request.sid]

        # Leave all rooms
        for room in user_info['rooms'].copy():
            leave_room(room, sid=request.sid)
            user_info['rooms'].remove(room)

        print(f"User {user_info['username']} disconnected")
        del connected_users[request.sid]

@socketio.on('join_public')
def handle_join_public():
    """Join the public chat room"""
    if request.sid not in connected_users:
        return

    user_info = connected_users[request.sid]
    join_room(public_room, sid=request.sid)
    user_info['rooms'].add(public_room)

    # Notify others in the room
    emit('user_joined', {
        'username': user_info['username'],
        'message': f'{user_info["username"]} joined the chat'
    }, room=public_room, skip_sid=request.sid)

    print(f"User {user_info['username']} joined public chat")

@socketio.on('leave_public')
def handle_leave_public():
    """Leave the public chat room"""
    if request.sid not in connected_users:
        return

    user_info = connected_users[request.sid]
    if public_room in user_info['rooms']:
        leave_room(public_room, sid=request.sid)
        user_info['rooms'].remove(public_room)

        # Notify others in the room
        emit('user_left', {
            'username': user_info['username'],
            'message': f'{user_info["username"]} left the chat'
        }, room=public_room, skip_sid=request.sid)

        print(f"User {user_info['username']} left public chat")

@socketio.on('send_public_message')
def handle_send_public_message(data):
    """Handle sending a public message"""
    if request.sid not in connected_users:
        emit('error', {'message': 'Not authenticated'})
        return

    user_info = connected_users[request.sid]

    if public_room not in user_info['rooms']:
        emit('error', {'message': 'Not in public chat'})
        return

    content = data.get('content', '').strip()
    if not content:
        emit('error', {'message': 'Message content cannot be empty'})
        return

    try:
        # Create message in database
        message = Message(
            content=content,
            user_id=user_info['user_id']
        )
        db.session.add(message)
        db.session.commit()

        # Get message with user info
        message_data = message.to_dict()
        message_data['username'] = user_info['username']

        # Broadcast to all in public room
        emit('new_public_message', message_data, room=public_room)

        print(f"Public message from {user_info['username']}: {content}")

    except Exception as e:
        db.session.rollback()
        emit('error', {'message': 'Failed to send message'})
        print(f"Error sending public message: {e}")

@socketio.on('join_private')
def handle_join_private(data):
    """Join a private chat room"""
    if request.sid not in connected_users:
        emit('error', {'message': 'Not authenticated'})
        return

    user_info = connected_users[request.sid]
    other_user_id = data.get('other_user_id')

    if not other_user_id:
        emit('error', {'message': 'Other user ID required'})
        return

    try:
        other_user_id = int(other_user_id)
    except ValueError:
        emit('error', {'message': 'Invalid user ID'})
        return

    # Verify other user exists
    other_user = db.session.get(User, other_user_id)
    if not other_user:
        emit('error', {'message': 'User not found'})
        return

    # Get or create private chat
    chat = PrivateChat.get_chat_between_users(user_info['user_id'], other_user_id)
    if not chat:
        chat = PrivateChat(user1_id=user_info['user_id'], user2_id=other_user_id)
        db.session.add(chat)
        db.session.commit()

    room_name = f"private_chat_{chat.id}"
    join_room(room_name, sid=request.sid)
    user_info['rooms'].add(room_name)

    emit('joined_private', {
        'chat_id': chat.id,
        'other_user': {
            'id': other_user.id,
            'username': other_user.username
        }
    })

    print(f"User {user_info['username']} joined private chat with {other_user.username}")

@socketio.on('leave_private')
def handle_leave_private(data):
    """Leave a private chat room"""
    if request.sid not in connected_users:
        return

    user_info = connected_users[request.sid]
    other_user_id = data.get('other_user_id')

    if not other_user_id:
        return

    try:
        other_user_id = int(other_user_id)
    except ValueError:
        return

    # Find the chat
    chat = PrivateChat.get_chat_between_users(user_info['user_id'], other_user_id)
    if chat:
        room_name = f"private_chat_{chat.id}"
        if room_name in user_info['rooms']:
            leave_room(room_name, sid=request.sid)
            user_info['rooms'].remove(room_name)
            print(f"User {user_info['username']} left private chat")

@socketio.on('send_private_message')
def handle_send_private_message(data):
    """Handle sending a private message"""
    if request.sid not in connected_users:
        emit('error', {'message': 'Not authenticated'})
        return

    user_info = connected_users[request.sid]
    other_user_id = data.get('other_user_id')
    content = data.get('content', '').strip()

    if not other_user_id or not content:
        emit('error', {'message': 'Other user ID and content required'})
        return

    try:
        other_user_id = int(other_user_id)
    except ValueError:
        emit('error', {'message': 'Invalid user ID'})
        return

    # Get the chat
    chat = PrivateChat.get_chat_between_users(user_info['user_id'], other_user_id)
    if not chat:
        emit('error', {'message': 'Chat not found'})
        return

    room_name = f"private_chat_{chat.id}"
    if room_name not in user_info['rooms']:
        emit('error', {'message': 'Not in this private chat'})
        return

    try:
        # Create private message in database
        message = PrivateMessage(
            content=content,
            sender_id=user_info['user_id'],
            chat_id=chat.id
        )
        db.session.add(message)
        db.session.commit()

        # Get message with sender info
        message_data = message.to_dict()
        message_data['username'] = user_info['username']

        # Send to both users in the chat room
        emit('new_private_message', message_data, room=room_name)

        print(f"Private message from {user_info['username']} to chat {chat.id}: {content}")

    except Exception as e:
        db.session.rollback()
        emit('error', {'message': 'Failed to send message'})
        print(f"Error sending private message: {e}")

@socketio.on('get_online_users')
def handle_get_online_users():
    """Get list of currently online users"""
    if request.sid not in connected_users:
        return

    online_users = []
    for sid, user_info in connected_users.items():
        if public_room in user_info['rooms']:  # Only show users in public chat
            online_users.append({
                'id': user_info['user_id'],
                'username': user_info['username']
            })

    emit('online_users', {'users': online_users})

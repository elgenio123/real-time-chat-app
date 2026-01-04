from flask import request
from flask_socketio import emit, join_room, leave_room, disconnect
from flask_jwt_extended import decode_token, verify_jwt_in_request
from app.extensions import socketio, db
from app.models.user import User
from app.models.message import Message
from app.models.private_message import PrivateMessage
from app.models.private_chat import PrivateChat
from app.models.unread_count import UnreadCount

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

            # Join user to a personal notification room (for notifications not tied to chat rooms)
            user_room = f"user_{user.id}"
            join_room(user_room, sid=request.sid)

            print(f"User {user.username} connected with SID {request.sid}")
            print(f"User {user.username} joined personal room: {user_room}")
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
        message = Message(
            content=content,
            user_id=user_info['user_id']
        )
        db.session.add(message)
        db.session.commit()

        message_data = message.to_dict()
        message_data['username'] = user_info['username']

        # Broadcast to all in public room
        emit('new_public_message', message_data, room=public_room)
        
        # Emit unread count notification only to users NOT in the public room
        for sid, other_user_info in connected_users.items():
            # Only notify users who are NOT in the public room and are not the sender
            if other_user_info['user_id'] != user_info['user_id'] and public_room not in other_user_info['rooms']:
                other_user_room = f"user_{other_user_info['user_id']}"
                emit('public_message_notification', {
                    'sender_id': user_info['user_id'],
                    'sender_username': user_info['username'],
                    'content': content[:50],  # First 50 chars for preview
                    'timestamp': message_data['timestamp']
                }, room=other_user_room)

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
        message = PrivateMessage(
            content=content,
            sender_id=user_info['user_id'],
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

        # Get message with sender info
        message_data = message.to_dict()
        message_data['username'] = user_info['username']
        message_data['chat_id'] = chat.id

        # Send to both users in the chat room
        emit('new_private_message', message_data, room=room_name)
        
        # Emit unread count update to the receiving user's personal room (even if they're not in the chat room yet)
        receiving_user_room = f"user_{other_user_id}"
        emit('unread_count_update', {
            'chat_id': chat.id,
            'unread_count': unread.count,
            'other_user_id': user_info['user_id'],
            'other_username': user_info['username']
        }, room=receiving_user_room)

        print(f"Private message from {user_info['username']} to chat {chat.id}: {content}")
        print(f"Emitted unread_count_update to room {receiving_user_room}")

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

@socketio.on('mark_chat_read')
def handle_mark_chat_read(data):
    """Mark a chat as read and reset unread count"""
    if request.sid not in connected_users:
        emit('error', {'message': 'Not authenticated'})
        return

    user_info = connected_users[request.sid]
    chat_id = data.get('chat_id')

    if not chat_id:
        emit('error', {'message': 'Chat ID required'})
        return

    try:
        chat_id = int(chat_id)
        
        # Reset unread count for this user and chat
        unread = UnreadCount.query.filter_by(user_id=user_info['user_id'], chat_id=chat_id).first()
        had_unread_messages = unread and unread.count > 0
        
        if unread:
            unread.count = 0
            db.session.commit()
            print(f"User {user_info['username']} marked chat {chat_id} as read")
        
        # Only send read receipt if there were unread messages
        if had_unread_messages:
            # Get the chat to find the other user
            chat = db.session.get(PrivateChat, chat_id)
            if chat:
                other_user_id = chat.user1_id if chat.user2_id == user_info['user_id'] else chat.user2_id
                
                # Notify the other user that their message was seen
                other_user_room = f"user_{other_user_id}"
                emit('message_read_receipt', {
                    'chat_id': chat_id,
                    'reader_username': user_info['username'],
                    'reader_id': user_info['user_id']
                }, room=other_user_room)
        
        emit('chat_marked_read', {'chat_id': chat_id})
        
    except Exception as e:
        db.session.rollback()
        emit('error', {'message': 'Failed to mark chat as read'})
        print(f"Error marking chat as read: {e}")

@socketio.on('mark_public_read')
def handle_mark_public_read():
    """Mark public chat as read for the current user"""
    if request.sid not in connected_users:
        return

    user_info = connected_users[request.sid]
    print(f"User {user_info['username']} marked public chat as read")
    emit('public_chat_marked_read')

@socketio.on('send_public_file')
def handle_send_public_file(data):
    if request.sid not in connected_users:
        emit('error', {'message': 'Not authenticated'})
        return

    user_info = connected_users[request.sid]
    filename = data.get('filename', '').strip()
    file_url = data.get('file_url', '').strip()
    file_size = data.get('file_size')
    file_type = data.get('file_type', '').strip()

    if not all([filename, file_url, file_size]):
        emit('error', {'message': 'Filename, file_url, and file_size required'})
        return

    if public_room not in user_info['rooms']:
        emit('error', {'message': 'Not in public chat'})
        return

    try:
        from app.models.file import File
        
        # Create message first (empty content for file messages)
        message = Message(content='', user_id=user_info['user_id'])
        db.session.add(message)
        db.session.flush()  # Get message ID

        # Create file record
        file_record = File(
            filename=filename,
            file_url=file_url,
            file_size=file_size,
            file_type=file_type,
            uploader_id=user_info['user_id'],
            public_message_id=message.id
        )
        db.session.add(file_record)
        db.session.commit()

        # Prepare message data with file info
        message_data = message.to_dict()
        message_data['file'] = file_record.to_dict()

        # Broadcast to all users in public chat
        emit('new_public_file_message', message_data, room=public_room)

        print(f"Public file from {user_info['username']}: {filename}")

    except Exception as e:
        db.session.rollback()
        emit('error', {'message': 'Failed to send file'})
        print(f"Error sending public file: {e}")


@socketio.on('send_private_file')
def handle_send_private_file(data):
    """Handle sending a private file message"""
    if request.sid not in connected_users:
        emit('error', {'message': 'Not authenticated'})
        return

    user_info = connected_users[request.sid]
    other_user_id = data.get('other_user_id')
    filename = data.get('filename', '').strip()
    file_url = data.get('file_url', '').strip()
    file_size = data.get('file_size')
    file_type = data.get('file_type', '').strip()

    if not all([other_user_id, filename, file_url, file_size]):
        emit('error', {'message': 'Other user ID, filename, file_url, and file_size required'})
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
        from app.models.file import File
        
        # Create message (empty content for file messages)
        message = PrivateMessage(
            content='',
            sender_id=user_info['user_id'],
            chat_id=chat.id
        )
        db.session.add(message)
        db.session.flush()  # Get message ID

        # Create file record
        file_record = File(
            filename=filename,
            file_url=file_url,
            file_size=file_size,
            file_type=file_type,
            uploader_id=user_info['user_id'],
            private_message_id=message.id,
            private_chat_id=chat.id
        )
        db.session.add(file_record)
        
        # Increment unread count for the other user
        unread = UnreadCount.query.filter_by(user_id=other_user_id, chat_id=chat.id).first()
        if not unread:
            unread = UnreadCount(user_id=other_user_id, chat_id=chat.id, count=1)
            db.session.add(unread)
        else:
            unread.count += 1
        
        db.session.commit()

        # Get message with sender info and file info
        message_data = message.to_dict()
        message_data['username'] = user_info['username']
        message_data['chat_id'] = chat.id
        message_data['file'] = file_record.to_dict()

        # Send to both users in the chat room
        emit('new_private_file_message', message_data, room=room_name)
        
        # Emit unread count update to the receiving user's personal room
        receiving_user_room = f"user_{other_user_id}"
        emit('unread_count_update', {
            'chat_id': chat.id,
            'unread_count': unread.count,
            'other_user_id': user_info['user_id'],
            'other_username': user_info['username']
        }, room=receiving_user_room)

        print(f"Private file from {user_info['username']} to chat {chat.id}: {filename}")

    except Exception as e:
        db.session.rollback()
        emit('error', {'message': 'Failed to send file'})
        print(f"Error sending private file: {e}")
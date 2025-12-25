#!/usr/bin/env python3
"""
Socket.IO Client Example for Real-Time Chat Backend

This example demonstrates how to connect to the chat server and use real-time features.
Make sure the server is running before executing this script.

Usage:
    python socketio_example.py

Requirements:
    pip install python-socketio requests flask-jwt-extended websocket-client
"""

import socketio
import requests
import json
import sys
import time

# Server configuration
SERVER_URL = 'http://localhost:5000'
API_BASE = f'{SERVER_URL}/api'

# Create Socket.IO client
sio = socketio.Client()

# Global variables
jwt_token = None
current_user = None

# Socket.IO event handlers
@sio.event
def connect():
    print("✅ Connected to chat server!")

@sio.event
def disconnect():
    print("❌ Disconnected from chat server")

@sio.event
def connected(data):
    print(f"🎉 {data['message']}")

@sio.event
def user_joined(data):
    print(f"👋 {data['username']} joined the chat")

@sio.event
def user_left(data):
    print(f"👋 {data['username']} left the chat")

@sio.event
def new_public_message(data):
    timestamp = data['timestamp'][:19]  # Format timestamp
    print(f"💬 [{timestamp}] {data['username']}: {data['content']}")

@sio.event
def new_private_message(data):
    timestamp = data['timestamp'][:19]
    print(f"🔒 [{timestamp}] {data['username']} (private): {data['content']}")

@sio.event
def joined_private(data):
    print(f"🔐 Joined private chat with {data['other_user']['username']}")

@sio.event
def online_users(data):
    users = [user['username'] for user in data['users']]
    print(f"👥 Online users: {', '.join(users)}")

@sio.event
def error(data):
    print(f"❌ Error: {data['message']}")

def login_or_register():
    """Handle user authentication"""
    global jwt_token, current_user

    print("\n=== Authentication ===")
    choice = input("Do you have an account? (y/n): ").lower()

    if choice == 'y':
        # Login
        username = input("Username: ")
        password = input("Password: ")

        response = requests.post(f'{API_BASE}/auth/login', json={
            'username': username,
            'password': password
        })

        if response.status_code == 200:
            data = response.json()
            jwt_token = data['access_token']
            current_user = data['user']
            print(f"✅ Logged in as {current_user['username']}")
        else:
            print("❌ Login failed")
            return False

    else:
        # Register
        username = input("Choose username: ")
        email = input("Email: ")
        password = input("Password: ")

        response = requests.post(f'{API_BASE}/auth/register', json={
            'username': username,
            'email': email,
            'password': password
        })

        if response.status_code == 201:
            print("✅ Registration successful! Please login.")
            return login_or_register()
        else:
            print("❌ Registration failed")
            return False

    return True

def connect_socketio():
    """Connect to Socket.IO server"""
    try:
        # Pass token as query parameter
        sio.connect(f'{SERVER_URL}?token={jwt_token}')
        print("🔌 Connecting to Socket.IO...")
        time.sleep(1)  # Wait for connection
        return True
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        return False

def public_chat_demo():
    """Demonstrate public chat functionality"""
    print("\n=== Public Chat Demo ===")

    # Join public chat
    print("Joining public chat...")
    sio.emit('join_public')
    time.sleep(1)

    # Get online users
    sio.emit('get_online_users')
    time.sleep(1)

    # Send some messages
    messages = [
        "Hello everyone! 👋",
        "This is a real-time chat demo 🚀",
        "Socket.IO is working perfectly! ✨"
    ]

    for msg in messages:
        sio.emit('send_public_message', {'content': msg})
        time.sleep(1)

    # Leave public chat
    input("\nPress Enter to leave public chat...")
    sio.emit('leave_public')
    time.sleep(1)

def private_chat_demo():
    """Demonstrate private chat functionality"""
    print("\n=== Private Chat Demo ===")

    # Get list of users to chat with
    response = requests.get(f'{API_BASE}/users/', headers={
        'Authorization': f'Bearer {jwt_token}'
    })

    if response.status_code == 200:
        users = response.json()['users']
        other_users = [u for u in users if u['id'] != current_user['id']]

        if not other_users:
            print("No other users available for private chat")
            return

        print("Available users:")
        for i, user in enumerate(other_users):
            print(f"{i+1}. {user['username']}")

        try:
            choice = int(input("Choose user to chat with (number): ")) - 1
            if 0 <= choice < len(other_users):
                other_user = other_users[choice]

                # Join private chat
                print(f"Joining private chat with {other_user['username']}...")
                sio.emit('join_private', {'other_user_id': other_user['id']})
                time.sleep(1)

                # Send private message
                message = input("Enter private message: ")
                sio.emit('send_private_message', {
                    'other_user_id': other_user['id'],
                    'content': message
                })
                time.sleep(1)

                # Leave private chat
                input("Press Enter to leave private chat...")
                sio.emit('leave_private', {'other_user_id': other_user['id']})
                time.sleep(1)
            else:
                print("Invalid choice")
        except ValueError:
            print("Invalid input")
    else:
        print("Failed to get users list")

def main():
    """Main demo function"""
    print("🚀 Real-Time Chat Backend - Socket.IO Demo")
    print("=" * 50)

    # Check if server is running
    try:
        response = requests.get(f'{SERVER_URL}/api/users/')
        if response.status_code != 200:
            print("❌ Server doesn't seem to be running. Please start the server first:")
            print("   cd realtime-chat-backend && python run.py")
            return
    except:
        print("❌ Cannot connect to server. Please start the server first:")
        print("   cd realtime-chat-backend && python run.py")
        return

    # Authentication
    if not login_or_register():
        return

    # Connect to Socket.IO
    if not connect_socketio():
        return

    try:
        # Public chat demo
        public_chat_demo()

        # Private chat demo
        private_chat_demo()

    except KeyboardInterrupt:
        print("\n👋 Exiting demo...")

    finally:
        # Cleanup
        sio.disconnect()
        print("✅ Demo completed!")

if __name__ == "__main__":
    main()
import pytest
from app.models.message import Message
from app.models.private_chat import PrivateChat
from app.models.private_message import PrivateMessage
from app.extensions import db

def test_get_messages_public(client, auth_headers):
    # Create a test message
    with client.application.app_context():
        from app.models.user import User
        user = User.query.filter_by(username='testuser').first()
        msg = Message(content='Test message', user_id=user.id)
        db.session.add(msg)
        db.session.commit()
    
    response = client.get('/api/messages', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert "messages" in data
    assert isinstance(data["messages"], list)
    assert len(data["messages"]) >= 1
    assert data["messages"][0]['content'] == 'Test message'

def test_create_message_public(client, auth_headers):
    response = client.post('/api/messages', 
                          json={'content': 'New message'},
                          headers=auth_headers)
    assert response.status_code == 201
    data = response.get_json()
    assert data['content'] == 'New message'
    assert 'user' in data

def test_get_private_messages(client, auth_headers):
    # Create another user and private chat
    client.post('/api/auth/register', json={
        'username': 'otheruser',
        'email': 'other@example.com',
        'password': 'password123'
    })
    
    with client.application.app_context():
        from app.models.user import User
        user1 = User.query.filter_by(username='testuser').first()
        user2 = User.query.filter_by(username='otheruser').first()
        chat = PrivateChat(user1_id=user1.id, user2_id=user2.id)
        db.session.add(chat)
        db.session.commit()
        chat_id = chat.id
        
        # Create private message
        pm = PrivateMessage(content='Private message', sender_id=user1.id, chat_id=chat_id)
        db.session.add(pm)
        db.session.commit()
        
        # Get the user2 id for the API call
        user2_id = user2.id
    
    response = client.get(f'/api/messages/private/{user2_id}', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert 'messages' in data
    assert len(data['messages']) >= 1

def test_create_private_message(client, auth_headers):
    # Create another user
    client.post('/api/auth/register', json={
        'username': 'user2',
        'email': 'user2@example.com',
        'password': 'password123'
    })
    
    with client.application.app_context():
        from app.models.user import User
        user2 = User.query.filter_by(username='user2').first()
        user2_id = user2.id
    
    response = client.post(f'/api/messages/private/{user2_id}',
                          json={'content': 'Private message'},
                          headers=auth_headers)
    assert response.status_code == 201
    data = response.get_json()
    assert data['content'] == 'Private message'

def test_delete_message(client, auth_headers):
    # Create a message first
    response = client.post('/api/messages', 
                          json={'content': 'Message to delete'},
                          headers=auth_headers)
    message_id = response.get_json()['id']
    
    # Delete it
    response = client.delete(f'/api/messages/{message_id}', headers=auth_headers)
    assert response.status_code == 200
    assert 'deleted' in response.get_json()['message']

def test_delete_own_message_only(client, auth_headers):
    # Create message with testuser
    response = client.post('/api/messages', 
                          json={'content': 'Own message'},
                          headers=auth_headers)
    message_id = response.get_json()['id']
    
    # Try to delete with different user
    client.post('/api/auth/register', json={
        'username': 'hacker',
        'email': 'hacker@example.com',
        'password': 'password123'
    })
    hacker_response = client.post('/api/auth/login', json={
        'username': 'hacker',
        'password': 'password123'
    })
    hacker_token = hacker_response.get_json()['access_token']
    hacker_headers = {'Authorization': f'Bearer {hacker_token}'}
    
    response = client.delete(f'/api/messages/{message_id}', headers=hacker_headers)
    assert response.status_code == 403
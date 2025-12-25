import pytest
from app.models.file import File
from app.models.message import Message
from app.models.private_chat import PrivateChat
from app.extensions import db

def test_create_file_valid(client, auth_headers):
    # Create a public message first
    response = client.post('/api/messages', 
                          json={'content': 'Message for file'},
                          headers=auth_headers)
    message_id = response.get_json()['id']
    
    # Create file
    response = client.post('/api/files/',
                          json={
                              'filename': 'test.pdf',
                              'file_url': 'http://example.com/test.pdf',
                              'file_size': 1024000,
                              'public_message_id': message_id
                          },
                          headers=auth_headers)
    assert response.status_code == 201
    data = response.get_json()
    assert data['filename'] == 'test.pdf'
    assert data['file_url'] == 'http://example.com/test.pdf'

def test_create_file_invalid_size(client, auth_headers):
    response = client.post('/api/messages', 
                          json={'content': 'Message'},
                          headers=auth_headers)
    message_id = response.get_json()['id']
    
    response = client.post('/api/files/', 
                          json={
                              'filename': 'large.pdf',
                              'file_url': 'http://example.com/large.pdf',
                              'file_size': 6000000,  # 6MB > 5MB
                              'public_message_id': message_id
                          },
                          headers=auth_headers)
    assert response.status_code == 400
    assert 'exceeds 5MB' in response.get_json()['message']

def test_create_file_invalid_type(client, auth_headers):
    response = client.post('/api/messages', 
                          json={'content': 'Message'},
                          headers=auth_headers)
    message_id = response.get_json()['id']
    
    response = client.post('/api/files/', 
                          json={
                              'filename': 'test.exe',
                              'file_url': 'http://example.com/test.exe',
                              'file_size': 1024,
                              'public_message_id': message_id
                          },
                          headers=auth_headers)
    assert response.status_code == 400
    assert 'Invalid file type' in response.get_json()['message']

def test_create_file_private_chat(client, auth_headers):
    # Create another user and chat
    client.post('/api/auth/register', json={
        'username': 'friend',
        'email': 'friend@example.com',
        'password': 'password123'
    })
    
    with client.application.app_context():
        from app.models.user import User
        user1 = User.query.filter_by(username='testuser').first()
        user2 = User.query.filter_by(username='friend').first()
        chat = PrivateChat(user1_id=user1.id, user2_id=user2.id)
        db.session.add(chat)
        db.session.commit()
        chat_id = chat.id
    
    response = client.post('/api/files/', 
                          json={
                              'filename': 'chat_file.jpg',
                              'file_url': 'http://example.com/chat_file.jpg',
                              'file_size': 204800,
                              'private_chat_id': chat_id
                          },
                          headers=auth_headers)
    assert response.status_code == 201

def test_get_user_files(client, auth_headers):
    # Create a file first
    response = client.post('/api/messages', 
                          json={'content': 'Message'},
                          headers=auth_headers)
    message_id = response.get_json()['id']
    
    client.post('/api/files/', 
               json={
                   'filename': 'myfile.pdf',
                   'file_url': 'http://example.com/myfile.pdf',
                   'file_size': 102400,
                   'public_message_id': message_id
               },
               headers=auth_headers)
    
    response = client.get('/api/files/', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_get_specific_file(client, auth_headers):
    # Create file
    response = client.post('/api/messages', 
                          json={'content': 'Message'},
                          headers=auth_headers)
    message_id = response.get_json()['id']
    
    create_response = client.post('/api/files/', 
                                 json={
                                     'filename': 'specific.pdf',
                                     'file_url': 'http://example.com/specific.pdf',
                                     'file_size': 51200,
                                     'public_message_id': message_id
                                 },
                                 headers=auth_headers)
    file_id = create_response.get_json()['id']
    
    response = client.get(f'/api/files/{file_id}', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert data['file']['filename'] == 'specific.pdf'

def test_delete_file(client, auth_headers):
    # Create file
    response = client.post('/api/messages', 
                          json={'content': 'Message'},
                          headers=auth_headers)
    message_id = response.get_json()['id']
    
    create_response = client.post('/api/files/', 
                                 json={
                                     'filename': 'delete_me.pdf',
                                     'file_url': 'http://example.com/delete_me.pdf',
                                     'file_size': 25600,
                                     'public_message_id': message_id
                                 },
                                 headers=auth_headers)
    file_id = create_response.get_json()['id']
    
    response = client.delete(f'/api/files/{file_id}', headers=auth_headers)
    assert response.status_code == 200
    assert 'deleted' in response.get_json()['message']

def test_get_files_by_message(client, auth_headers):
    # Create message and file
    response = client.post('/api/messages', 
                          json={'content': 'Public message'},
                          headers=auth_headers)
    message_id = response.get_json()['id']
    
    client.post('/api/files/', 
               json={
                   'filename': 'msg_file.jpg',
                   'file_url': 'http://example.com/msg_file.jpg',
                   'file_size': 128000,
                   'public_message_id': message_id
               },
               headers=auth_headers)
    
    response = client.get(f'/api/files/public/{message_id}', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert 'files' in data
    assert len(data['files']) >= 1
import pytest

def test_get_users(client, auth_headers):
    # Create some users
    client.post('/api/auth/register', json={
        'username': 'user1',
        'email': 'user1@example.com',
        'password': 'password123'
    })
    client.post('/api/auth/register', json={
        'username': 'user2',
        'email': 'user2@example.com',
        'password': 'password123'
    })
    
    response = client.get('/api/users/', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert 'users' in data
    assert isinstance(data['users'], list)
    assert len(data['users']) >= 2  # At least the test user and the new ones
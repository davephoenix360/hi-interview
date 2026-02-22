from fastapi.testclient import TestClient

from server.business.auth.password import hash_password
from server.data.models.user import User
from server.shared.databasemanager import DatabaseManager


def test_login(unauthenticated_test_client: TestClient, database: DatabaseManager) -> None:
    with database.create_session() as session:
        user = User(
            email="login@example.com",
            password_hashed=hash_password("testpassword"),
        )
        session.add(user)
        session.commit()

    response = unauthenticated_test_client.post(
        "/token",
        json={"email": "login@example.com", "password": "testpassword"},
    )
    assert response.status_code == 200

    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(
    unauthenticated_test_client: TestClient, database: DatabaseManager
) -> None:
    with database.create_session() as session:
        user = User(
            email="wrongpw@example.com",
            password_hashed=hash_password("correctpassword"),
        )
        session.add(user)
        session.commit()

    response = unauthenticated_test_client.post(
        "/token",
        json={"email": "wrongpw@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_login_nonexistent_user(unauthenticated_test_client: TestClient) -> None:
    response = unauthenticated_test_client.post(
        "/token",
        json={"email": "nonexistent@example.com", "password": "whatever"},
    )
    assert response.status_code == 401


def test_check_auth(test_client: TestClient) -> None:
    response = test_client.get("/check_auth")
    assert response.status_code == 200


def test_check_auth_unauthenticated(unauthenticated_test_client: TestClient) -> None:
    response = unauthenticated_test_client.get("/check_auth")
    assert response.status_code == 401


def test_get_me(test_client: TestClient, user_id: str) -> None:
    response = test_client.get("/me")
    assert response.status_code == 200

    data = response.json()
    assert data["data"]["id"] == user_id
    assert data["data"]["email"] == "testuser@example.com"


def test_get_me_unauthenticated(unauthenticated_test_client: TestClient) -> None:
    response = unauthenticated_test_client.get("/me")
    assert response.status_code == 401

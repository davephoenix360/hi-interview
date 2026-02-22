import uuid
from datetime import datetime

from fastapi import FastAPI
from fastapi.testclient import TestClient

from server.business.auth.token import create_access_token
from server.data.models.client import Client
from server.data.models.client_advisor import ClientAdvisor
from server.data.models.client_notes import ClientNote
from server.data.models.user import User
from server.shared.config import Config
from server.shared.databasemanager import DatabaseManager


def _make_authed_client(app: FastAPI, config: Config, user_id: str) -> TestClient:
    client = TestClient(app)
    client.headers["Authorization"] = f"Bearer {create_access_token(config, user_id)}"
    return client


def _create_client(database: DatabaseManager, email_prefix: str) -> str:
    with database.create_session() as session:
        client = Client(
            email=f"{email_prefix}-{uuid.uuid4().hex[:8]}@example.com",
            first_name="Note",
            last_name="Client",
        )
        session.add(client)
        session.commit()
        return client.id


def _add_advisor(database: DatabaseManager, client_id: str, user_id: str) -> None:
    with database.create_session() as session:
        session.add(ClientAdvisor(client_id=client_id, user_id=user_id))
        session.commit()


def _create_user(database: DatabaseManager, email_prefix: str) -> str:
    with database.create_session() as session:
        user = User(email=f"{email_prefix}-{uuid.uuid4().hex[:8]}@example.com")
        session.add(user)
        session.commit()
        return user.id


def test_list_notes_returns_empty_initially(
    test_client: TestClient, database: DatabaseManager
) -> None:
    client_id = _create_client(database, "notes-empty")

    response = test_client.get(f"/client/{client_id}/notes")

    assert response.status_code == 200
    assert response.json() == {"data": []}


def test_advisor_can_create_blank_note(
    test_client: TestClient, database: DatabaseManager, user_id: str
) -> None:
    client_id = _create_client(database, "notes-create")
    _add_advisor(database, client_id, user_id)

    response = test_client.post(f"/client/{client_id}/notes")

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["client_id"] == client_id
    assert data["body"] == ""
    assert data["author"]["id"] == user_id
    assert data["author"]["email"] == "testuser@example.com"
    assert data["created_at"]
    assert data["updated_at"]
    datetime.fromisoformat(data["created_at"])
    datetime.fromisoformat(data["updated_at"])


def test_author_can_patch_note(
    test_client: TestClient, database: DatabaseManager, user_id: str
) -> None:
    client_id = _create_client(database, "notes-update-author")
    _add_advisor(database, client_id, user_id)

    create_response = test_client.post(f"/client/{client_id}/notes")
    note_id = create_response.json()["data"]["id"]

    patch_response = test_client.patch(
        f"/client/{client_id}/notes/{note_id}",
        json={"body": "Updated note body"},
    )

    assert patch_response.status_code == 200
    data = patch_response.json()["data"]
    assert data["id"] == note_id
    assert data["client_id"] == client_id
    assert data["body"] == "Updated note body"
    assert data["author"]["id"] == user_id


def test_other_advisor_cannot_patch_note(
    app: FastAPI, config: Config, test_client: TestClient, database: DatabaseManager, user_id: str
) -> None:
    client_id = _create_client(database, "notes-update-forbidden")
    _add_advisor(database, client_id, user_id)

    other_user_id = _create_user(database, "other-advisor-note")
    _add_advisor(database, client_id, other_user_id)
    other_client = _make_authed_client(app, config, other_user_id)

    create_response = test_client.post(f"/client/{client_id}/notes")
    note_id = create_response.json()["data"]["id"]

    patch_response = other_client.patch(
        f"/client/{client_id}/notes/{note_id}",
        json={"body": "I should not be allowed"},
    )

    assert patch_response.status_code == 403
    assert patch_response.json()["detail"] == "Forbidden"


def test_non_advisor_cannot_create_blank_note(
    test_client: TestClient, database: DatabaseManager
) -> None:
    client_id = _create_client(database, "notes-create-non-advisor")

    response = test_client.post(f"/client/{client_id}/notes")

    assert response.status_code == 403
    assert response.json()["detail"] == "Forbidden"


def test_patch_rejects_invalid_bodies(
    test_client: TestClient, database: DatabaseManager, user_id: str
) -> None:
    client_id = _create_client(database, "notes-update-invalid")
    _add_advisor(database, client_id, user_id)
    create_response = test_client.post(f"/client/{client_id}/notes")
    note_id = create_response.json()["data"]["id"]

    whitespace_response = test_client.patch(
        f"/client/{client_id}/notes/{note_id}",
        json={"body": "   "},
    )
    assert whitespace_response.status_code in (400, 422)

    too_long_response = test_client.patch(
        f"/client/{client_id}/notes/{note_id}",
        json={"body": "x" * 10001},
    )
    assert too_long_response.status_code in (400, 422)


def test_author_can_delete_note(
    test_client: TestClient, database: DatabaseManager, user_id: str
) -> None:
    client_id = _create_client(database, "notes-delete-author")
    _add_advisor(database, client_id, user_id)

    create_response = test_client.post(f"/client/{client_id}/notes")
    note_id = create_response.json()["data"]["id"]

    delete_response = test_client.delete(f"/client/{client_id}/notes/{note_id}")

    assert delete_response.status_code == 200
    assert delete_response.json() == {"data": {}}

    list_response = test_client.get(f"/client/{client_id}/notes")
    assert list_response.status_code == 200
    assert list_response.json() == {"data": []}

    with database.create_session() as session:
        note = session.get(ClientNote, note_id)
        assert note is None


def test_other_advisor_cannot_delete_note(
    app: FastAPI,
    config: Config,
    test_client: TestClient,
    database: DatabaseManager,
    user_id: str,
) -> None:
    client_id = _create_client(database, "notes-delete-forbidden")
    _add_advisor(database, client_id, user_id)

    other_user_id = _create_user(database, "other-advisor-delete")
    _add_advisor(database, client_id, other_user_id)
    other_client = _make_authed_client(app, config, other_user_id)

    create_response = test_client.post(f"/client/{client_id}/notes")
    note_id = create_response.json()["data"]["id"]

    delete_response = other_client.delete(f"/client/{client_id}/notes/{note_id}")

    assert delete_response.status_code == 403
    assert delete_response.json()["detail"] == "Forbidden"

    with database.create_session() as session:
        note = session.get(ClientNote, note_id)
        assert note is not None

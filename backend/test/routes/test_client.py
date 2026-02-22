from fastapi.testclient import TestClient

from server.data.models.client import Client
from server.data.models.client_advisor import ClientAdvisor
from server.data.models.user import User
from server.shared.databasemanager import DatabaseManager


def test_list_clients(test_client: TestClient, database: DatabaseManager) -> None:
    with database.create_session() as session:
        session.add(Client(email="alice@example.com", first_name="Alice", last_name="Smith"))
        session.add(Client(email="bob@example.com", first_name="Bob", last_name="Jones"))
        session.commit()

    response = test_client.get("/client")
    assert response.status_code == 200

    data = response.json()
    assert len(data["data"]) >= 2

    emails = [c["email"] for c in data["data"]]
    assert "alice@example.com" in emails
    assert "bob@example.com" in emails
    for client in data["data"]:
        assert "advisor_count" in client
        assert "is_my_client" in client


def test_list_clients_unauthenticated(unauthenticated_test_client: TestClient) -> None:
    response = unauthenticated_test_client.get("/client")
    assert response.status_code == 401


def test_list_clients_with_assigned_user(
    test_client: TestClient, database: DatabaseManager, user_id: str
) -> None:
    with database.create_session() as session:
        session.add(
            Client(
                email="assigned@example.com",
                first_name="Charlie",
                last_name="Brown",
                assigned_user_id=user_id,
            )
        )
        session.commit()

    response = test_client.get("/client")
    assert response.status_code == 200

    data = response.json()
    assigned = [c for c in data["data"] if c["email"] == "assigned@example.com"]
    assert len(assigned) == 1
    assert assigned[0]["assigned_user_id"] == user_id


def test_list_clients_with_advisors(
    test_client: TestClient, database: DatabaseManager, user_id: str
) -> None:
    with database.create_session() as session:
        other_user = User(email="other-advisor@example.com", password_hashed=None)
        session.add(other_user)

        client = Client(email="advised@example.com", first_name="Dora", last_name="Ng")
        session.add(client)
        session.flush()

        session.add(ClientAdvisor(client_id=client.id, user_id=user_id))
        session.add(ClientAdvisor(client_id=client.id, user_id=other_user.id))
        session.commit()

    response = test_client.get("/client")
    assert response.status_code == 200

    data = response.json()
    advised = [c for c in data["data"] if c["email"] == "advised@example.com"]
    assert len(advised) == 1
    assert advised[0]["advisor_count"] == 2
    assert advised[0]["is_my_client"] is True


def test_get_nonexistent_client(test_client: TestClient) -> None:
    response = test_client.get("/client/999999")
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Client not found"


def test_get_existing_client(
    test_client: TestClient, database: DatabaseManager, user_id: str
) -> None:
    with database.create_session() as session:
        other_user = User(email="detail-advisor@example.com", password_hashed=None)
        session.add(other_user)

        session.add(
            Client(
                id="12345",
                email="alice-detail@example.com",
                first_name="Alice",
                last_name="Smith",
            )
        )
        session.flush()

        session.add(ClientAdvisor(client_id="12345", user_id=user_id))
        session.add(ClientAdvisor(client_id="12345", user_id=other_user.id))
        session.commit()

    response = test_client.get(f"/client/{12345}")
    assert response.status_code == 200

    data = response.json()
    assert data["data"]["email"] == "alice-detail@example.com"
    assert data["data"]["first_name"] == "Alice"
    assert data["data"]["last_name"] == "Smith"
    assert data["data"]["is_my_client"] is True
    assert len(data["data"]["advisors"]) == 2
    advisor_emails = [advisor["email"] for advisor in data["data"]["advisors"]]
    assert "testuser@example.com" in advisor_emails
    assert "detail-advisor@example.com" in advisor_emails


def test_add_current_user_as_advisor(
    test_client: TestClient, database: DatabaseManager, user_id: str
) -> None:
    with database.create_session() as session:
        client = Client(
            email="post-advisor@example.com",
            first_name="Post",
            last_name="Advisor",
        )
        session.add(client)
        session.commit()
        client_id = client.id

    response = test_client.post(f"/client/{client_id}/advisors/me")
    assert response.status_code == 200

    data = response.json()
    assert data["data"]["id"] == client_id
    assert data["data"]["is_my_client"] is True
    advisor_ids = [advisor["id"] for advisor in data["data"]["advisors"]]
    assert user_id in advisor_ids

    with database.create_session() as session:
        assignments = (
            session.query(ClientAdvisor)
            .filter(
                ClientAdvisor.client_id == client_id,
                ClientAdvisor.user_id == user_id,
            )
            .all()
        )
        assert len(assignments) == 1


def test_add_current_user_as_advisor_is_idempotent(
    test_client: TestClient, database: DatabaseManager, user_id: str
) -> None:
    with database.create_session() as session:
        client = Client(
            email="post-advisor-idempotent@example.com",
            first_name="Idempotent",
            last_name="Advisor",
        )
        session.add(client)
        session.flush()
        session.add(ClientAdvisor(client_id=client.id, user_id=user_id))
        session.commit()
        client_id = client.id

    first_response = test_client.post(f"/client/{client_id}/advisors/me")
    second_response = test_client.post(f"/client/{client_id}/advisors/me")
    assert first_response.status_code == 200
    assert second_response.status_code == 200

    with database.create_session() as session:
        assignments = (
            session.query(ClientAdvisor)
            .filter(
                ClientAdvisor.client_id == client_id,
                ClientAdvisor.user_id == user_id,
            )
            .all()
        )
        assert len(assignments) == 1


def test_add_current_user_as_advisor_nonexistent_client(test_client: TestClient) -> None:
    response = test_client.post("/client/999999/advisors/me")
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Client not found"

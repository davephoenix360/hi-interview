from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from server.data.models.client import Client
from server.data.models.client_advisor import ClientAdvisor


def add_advisor_to_client(session: Session, client_id: str, user_id: str) -> None:
    client_exists = session.execute(
        select(Client.id).where(Client.id == client_id)
    ).scalar_one_or_none()
    if client_exists is None:
        raise HTTPException(status_code=404, detail="Client not found")

    assignment_exists = session.execute(
        select(ClientAdvisor.client_id).where(
            ClientAdvisor.client_id == client_id,
            ClientAdvisor.user_id == user_id,
        )
    ).scalar_one_or_none()
    if assignment_exists is not None:
        return

    session.add(ClientAdvisor(client_id=client_id, user_id=user_id))
    session.commit()

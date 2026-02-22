from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from server.business.client.get import get_client_by_id
from server.business.client.schema import PClientCreate, PClientDetail
from server.data.models.client import Client
from server.data.models.client_advisor import ClientAdvisor


def create_client(session: Session, user_id: str, payload: PClientCreate) -> PClientDetail:
    existing_client_id = session.execute(
        select(Client.id).where(func.lower(Client.email) == str(payload.email))
    ).scalar_one_or_none()
    if existing_client_id is not None:
        raise HTTPException(
            status_code=409,
            detail="Client with this email already exists",
        )

    client = Client(
        email=str(payload.email),
        first_name=payload.first_name,
        last_name=payload.last_name,
    )
    session.add(client)
    session.flush()

    if payload.add_me_as_advisor:
        assignment_exists = session.execute(
            select(ClientAdvisor.client_id).where(
                ClientAdvisor.client_id == client.id,
                ClientAdvisor.user_id == user_id,
            )
        ).scalar_one_or_none()
        if assignment_exists is None:
            session.add(ClientAdvisor(client_id=client.id, user_id=user_id))

    session.commit()
    return get_client_by_id(session, client.id, user_id)

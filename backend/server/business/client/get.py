from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import HTTPException

from server.business.client.schema import PClient
from server.data.models.client import Client

def get_client_by_id(session: Session, client_id: str) -> PClient:
    client = session.execute(
        select(Client).where(Client.id == client_id)
    ).scalars().one_or_none()
    
    if client is None:
        raise HTTPException(status_code=404, detail="Client not found")

    return PClient.model_validate(client)
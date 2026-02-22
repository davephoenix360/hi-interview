from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from server.business.client.schema import PAdvisor, PClient, PClientDetail
from server.data.models.client import Client
from server.data.models.client_advisor import ClientAdvisor
from server.data.models.user import User


def get_client_by_id(session: Session, client_id: str, user_id: str) -> PClientDetail:
    client = session.execute(
        select(Client).where(Client.id == client_id)
    ).scalars().one_or_none()

    if client is None:
        raise HTTPException(status_code=404, detail="Client not found")

    advisor_rows = session.execute(
        select(User.id, User.email)
        .join(ClientAdvisor, ClientAdvisor.user_id == User.id)
        .where(ClientAdvisor.client_id == client_id)
    ).all()

    advisors = [PAdvisor(id=advisor_id, email=email) for advisor_id, email in advisor_rows]
    is_my_client = any(advisor.id == user_id for advisor in advisors)

    base_client = PClient.model_validate(client).model_dump()
    return PClientDetail.model_validate(
        {
            **base_client,
            "advisors": advisors,
            "is_my_client": is_my_client,
        }
    )

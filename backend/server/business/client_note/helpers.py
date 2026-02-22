from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from server.data.models.client_advisor import ClientAdvisor
from server.data.models.client_notes import ClientNote


def require_is_advisor(session: Session, client_id: str, user_id: str) -> None:
    advisor_assignment = session.execute(
        select(ClientAdvisor.client_id).where(
            ClientAdvisor.client_id == client_id,
            ClientAdvisor.user_id == user_id,
        )
    ).scalar_one_or_none()
    if advisor_assignment is None:
        raise HTTPException(status_code=403, detail="Forbidden")


def require_is_author(note: ClientNote, user_id: str) -> None:
    if note.author_user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

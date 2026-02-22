from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from server.business.client_note.helpers import require_is_author
from server.data.models.client_notes import ClientNote


def delete_note(session: Session, client_id: str, note_id: str, user_id: str) -> None:
    note = session.execute(
        select(ClientNote).where(
            ClientNote.id == note_id,
            ClientNote.client_id == client_id,
        )
    ).scalars().one_or_none()
    if note is None:
        raise HTTPException(status_code=404, detail="Client note not found")

    require_is_author(note, user_id)

    session.delete(note)
    session.commit()

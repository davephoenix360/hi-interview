from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from server.business.client_note.helpers import require_is_author
from server.business.client_note.schema import PClientNote, PClientNoteUpdate
from server.data.models.client_notes import ClientNote


def update_note(
    session: Session,
    client_id: str,
    note_id: str,
    user_id: str,
    body: str,
) -> PClientNote:
    note = session.execute(
        select(ClientNote).where(
            ClientNote.id == note_id,
            ClientNote.client_id == client_id,
        )
    ).scalars().one_or_none()
    if note is None:
        raise HTTPException(status_code=404, detail="Client note not found")

    require_is_author(note, user_id)

    validated = PClientNoteUpdate(body=body)
    note.body = validated.body
    session.commit()

    updated_note = session.execute(
        select(ClientNote)
        .options(joinedload(ClientNote.author))
        .where(ClientNote.id == note_id, ClientNote.client_id == client_id)
    ).scalar_one()

    return PClientNote.model_validate(updated_note)

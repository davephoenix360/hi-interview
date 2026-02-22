from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from server.business.client_note.helpers import require_is_advisor
from server.business.client_note.schema import PClientNote
from server.data.models.client_notes import ClientNote


def create_blank_note(session: Session, client_id: str, user_id: str) -> PClientNote:
    require_is_advisor(session, client_id, user_id)

    note = ClientNote(client_id=client_id, author_user_id=user_id, body="")
    session.add(note)
    session.commit()

    note_with_author = session.execute(
        select(ClientNote)
        .options(joinedload(ClientNote.author))
        .where(ClientNote.id == note.id, ClientNote.client_id == client_id)
    ).scalar_one()

    return PClientNote.model_validate(note_with_author)

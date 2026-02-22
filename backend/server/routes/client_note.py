from fastapi import APIRouter

from server.business.auth.auth_verifier import AuthVerifier
from server.business.auth.schema import UserTokenInfo
from server.business.client_note.create import create_blank_note
from server.business.client_note.delete import delete_note
from server.business.client_note.list import list_notes
from server.business.client_note.schema import (
    PClientNote,
    PClientNoteDeleteResponse,
    PClientNoteResponse,
    PClientNoteUpdate,
)
from server.business.client_note.update import update_note
from server.shared.databasemanager import DatabaseManager
from server.shared.pydantic import PEmpty, PList


def get_router(database: DatabaseManager, auth_verifier: AuthVerifier) -> APIRouter:
    router = APIRouter()

    @router.get("/client/{client_id}/notes")
    async def list_client_notes_route(
        client_id: str,
        user_token_info: UserTokenInfo = auth_verifier.UserTokenInfo(),
    ) -> PList[PClientNote]:
        _ = user_token_info
        with database.create_session() as session:
            notes = list_notes(session, client_id)
            return PList(data=notes)

    @router.post("/client/{client_id}/notes")
    async def create_blank_client_note_route(
        client_id: str,
        user_token_info: UserTokenInfo = auth_verifier.UserTokenInfo(),
    ) -> PClientNoteResponse:
        with database.create_session() as session:
            note = create_blank_note(session, client_id, user_token_info.user_id)
            return PClientNoteResponse(data=note)

    @router.patch("/client/{client_id}/notes/{note_id}")
    async def update_client_note_route(
        client_id: str,
        note_id: str,
        note_update: PClientNoteUpdate,
        user_token_info: UserTokenInfo = auth_verifier.UserTokenInfo(),
    ) -> PClientNoteResponse:
        with database.create_session() as session:
            note = update_note(
                session,
                client_id=client_id,
                note_id=note_id,
                user_id=user_token_info.user_id,
                body=note_update.body,
            )
            return PClientNoteResponse(data=note)

    @router.delete("/client/{client_id}/notes/{note_id}")
    async def delete_client_note_route(
        client_id: str,
        note_id: str,
        user_token_info: UserTokenInfo = auth_verifier.UserTokenInfo(),
    ) -> PClientNoteDeleteResponse:
        with database.create_session() as session:
            delete_note(session, client_id, note_id, user_token_info.user_id)
            return PClientNoteDeleteResponse(data=PEmpty())

    return router

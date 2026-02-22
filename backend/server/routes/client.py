from fastapi import APIRouter

from server.business.auth.auth_verifier import AuthVerifier
from server.business.auth.schema import UserTokenInfo
from server.business.client.add_advisor import add_advisor_to_client
from server.business.client.get import get_client_by_id
from server.business.client.list import list_clients
from server.business.client.schema import (
    PClientDetailResponse,
    PClientListItem,
)
from server.shared.databasemanager import DatabaseManager
from server.shared.pydantic import PList


def get_router(database: DatabaseManager, auth_verifier: AuthVerifier) -> APIRouter:
    router = APIRouter()

    @router.get("/client")
    async def list_clients_route(
        user_token_info: UserTokenInfo = auth_verifier.UserTokenInfo(),
    ) -> PList[PClientListItem]:
        with database.create_session() as session:
            clients = list_clients(session, user_token_info.user_id)
            return PList(data=clients)

    @router.get("/client/{client_id}")
    async def get_client_route(
        client_id: str,
        user_token_info: UserTokenInfo = auth_verifier.UserTokenInfo(),
    ) -> PClientDetailResponse:
        with database.create_session() as session:
            client = get_client_by_id(session, client_id, user_token_info.user_id)
            return PClientDetailResponse(data=client)

    @router.post("/client/{client_id}/advisors/me")
    async def add_current_user_as_client_advisor_route(
        client_id: str,
        user_token_info: UserTokenInfo = auth_verifier.UserTokenInfo(),
    ) -> PClientDetailResponse:
        with database.create_session() as session:
            add_advisor_to_client(session, client_id, user_token_info.user_id)
            client = get_client_by_id(session, client_id, user_token_info.user_id)
            return PClientDetailResponse(data=client)

    return router

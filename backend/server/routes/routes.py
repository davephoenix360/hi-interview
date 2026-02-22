from fastapi import APIRouter

from server.business.auth.auth_verifier import AuthVerifier
from server.routes.auth import get_router as get_router_auth
from server.routes.client import get_router as get_router_client
from server.routes.client_note import get_router as get_router_client_note
from server.routes.ping import get_router as get_router_ping
from server.shared.config import Config
from server.shared.databasemanager import DatabaseManager


def get_all_routes(
    config: Config,
    database: DatabaseManager,
    auth_verifier: AuthVerifier,
) -> APIRouter:
    router = APIRouter()

    router.include_router(get_router_ping(config, database))
    router.include_router(get_router_auth(config, database, auth_verifier))
    router.include_router(get_router_client(database, auth_verifier))
    router.include_router(get_router_client_note(database, auth_verifier))

    return router

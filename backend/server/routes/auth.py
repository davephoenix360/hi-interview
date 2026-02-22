from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from server.business.auth.auth_verifier import AuthVerifier
from server.business.auth.password import verify_password
from server.business.auth.schema import (
    LoginRequest,
    MeResponse,
    MeResponseData,
    TokenResponse,
    UserTokenInfo,
)
from server.business.auth.token import create_access_token
from server.business.user.get import get_user_by_id
from server.data.models.user import User
from server.shared.config import Config
from server.shared.databasemanager import DatabaseManager
from server.shared.pydantic import PEmpty


def get_router(
    config: Config, database: DatabaseManager, auth_verifier: AuthVerifier
) -> APIRouter:
    router = APIRouter()

    @router.post("/token")
    async def login(login_data: LoginRequest) -> TokenResponse:
        with database.create_session() as session:
            user = (
                session.execute(
                    select(User).where(User.email == login_data.email.lower())
                )
                .scalars()
                .one_or_none()
            )

            if not user or user.password_hashed is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect email or password",
                )

            if not verify_password(login_data.password, user.password_hashed):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect email or password",
                )

            access_token = create_access_token(config, user.id)
            return TokenResponse(access_token=access_token)

    @router.get("/check_auth")
    async def check_auth(
        _: UserTokenInfo = auth_verifier.UserTokenInfo(),
    ) -> PEmpty:
        return PEmpty()

    @router.get("/me")
    async def me(
        user_token_info: UserTokenInfo = auth_verifier.UserTokenInfo(),
    ) -> MeResponse:
        with database.create_session() as session:
            user = get_user_by_id(session, user_token_info.user_id)
            return MeResponse(data=MeResponseData(id=user.id, email=user.email))

    return router

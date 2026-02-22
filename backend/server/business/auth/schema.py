from server.shared.pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserTokenInfo(BaseModel):
    user_id: str


class MeResponseData(BaseModel):
    id: str
    email: str


class MeResponse(BaseModel):
    data: MeResponseData

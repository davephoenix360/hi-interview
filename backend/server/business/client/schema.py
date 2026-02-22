from datetime import datetime

from server.shared.pydantic import BaseModel


class PClient(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    assigned_user_id: str | None
    created_at: datetime
    updated_at: datetime


class PAdvisor(BaseModel):
    id: str
    email: str


class PClientListItem(PClient):
    is_my_client: bool
    advisor_count: int


class PClientDetail(PClient):
    advisors: list[PAdvisor]
    is_my_client: bool


class PClientDetailResponse(BaseModel):
    data: PClientDetail

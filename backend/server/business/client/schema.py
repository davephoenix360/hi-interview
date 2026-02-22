from datetime import datetime
import re

from pydantic import field_validator

from server.shared.pydantic import BaseModel


EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


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


class PClientCreate(BaseModel):
    email: str
    first_name: str
    last_name: str
    add_me_as_advisor: bool = True

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().lower()
        return value

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, value: str) -> str:
        if not EMAIL_REGEX.match(value):
            raise ValueError("invalid email format")
        return value

    @field_validator("first_name", "last_name")
    @classmethod
    def normalize_required_name(cls, value: str) -> str:
        stripped = value.strip()
        if len(stripped) < 1:
            raise ValueError("must not be blank")
        return stripped

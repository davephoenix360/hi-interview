from datetime import datetime

from pydantic import field_validator

from server.shared.pydantic import BaseModel, PEmpty


class PUserLite(BaseModel):
    id: str
    email: str


class PClientNote(BaseModel):
    id: str
    client_id: str
    body: str
    created_at: datetime
    updated_at: datetime
    author: PUserLite


class PClientNoteResponse(BaseModel):
    data: PClientNote


class PClientNoteDeleteResponse(BaseModel):
    data: PEmpty


class PClientNoteUpdate(BaseModel):
    body: str

    @field_validator("body")
    @classmethod
    def validate_body(cls, value: str) -> str:
        stripped = value.strip()
        if not 1 <= len(stripped) <= 10000:
            raise ValueError("body.strip() must be between 1 and 10000 characters")
        return value

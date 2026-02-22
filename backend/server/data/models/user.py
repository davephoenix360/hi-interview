from typing import TYPE_CHECKING
import uuid
from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from server.data.models.base import Base

if TYPE_CHECKING:
    from server.data.models.client_notes import ClientNote


class User(Base):
    __tablename__ = "user"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    password_hashed: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    authored_client_notes: Mapped[list["ClientNote"]] = relationship(
        "ClientNote", back_populates="author"
    )

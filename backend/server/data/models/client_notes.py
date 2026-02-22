from typing import TYPE_CHECKING
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from server.data.models.base import Base

if TYPE_CHECKING:
    from server.data.models.client import Client
    from server.data.models.user import User


class ClientNote(Base):
    __tablename__ = "client_note"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    client_id: Mapped[str] = mapped_column(
        String, ForeignKey("client.id"), nullable=False, index=True
    )
    author_user_id: Mapped[str] = mapped_column(
        String, ForeignKey("user.id"), nullable=False, index=True
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    client: Mapped["Client"] = relationship("Client", back_populates="notes")
    author: Mapped["User"] = relationship(
        "User", back_populates="authored_client_notes", foreign_keys=[author_user_id]
    )

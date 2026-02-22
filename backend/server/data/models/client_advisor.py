from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from server.data.models.base import Base


class ClientAdvisor(Base):
    __tablename__ = "client_advisor"
    __table_args__ = (UniqueConstraint("client_id", "user_id"),)

    client_id: Mapped[str] = mapped_column(
        String, ForeignKey("client.id"), primary_key=True, nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("user.id"), primary_key=True, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from server.business.user.schema import PUser
from server.data.models.user import User


def get_user_by_id(session: Session, user_id: str) -> PUser:
    user = session.execute(select(User).where(User.id == user_id)).scalars().one_or_none()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return PUser.model_validate(user)

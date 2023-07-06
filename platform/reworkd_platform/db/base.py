import uuid
from datetime import datetime
from typing import Optional, Type, TypeVar

from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy import String, DateTime, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeBase, mapped_column, Mapped

from reworkd_platform.db.meta import meta

T = TypeVar("T", bound="Base")


class Base(DeclarativeBase):
    """Base for all models."""

    metadata = meta
    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda _: str(uuid.uuid4()),
        unique=True,
        nullable=False,
    )

    @classmethod
    async def get(cls: Type[T], session: AsyncSession, id_: str) -> Optional[T]:
        return await session.get(cls, id_)

    @classmethod
    async def get_or_404(cls: Type[T], session: AsyncSession, id_: str) -> T:
        if model := await cls.get(session, id_):
            return model

        raise HTTPException(status_code=404, detail=f"{cls.__name__}[{id_}] not found")

    async def save(self: T, session: AsyncSession) -> T:
        session.add(self)
        await session.flush()
        return self

    async def delete(self: T, session: AsyncSession) -> T:
        await session.delete(self)
        return self


class TrackedModel(Base):
    """Base for all tracked models."""

    __abstract__ = True

    create_date = mapped_column(
        DateTime, name="create_date", server_default=func.now(), nullable=False
    )
    update_date = mapped_column(
        DateTime, name="update_date", onupdate=func.now(), nullable=True
    )
    delete_date = mapped_column(DateTime, name="delete_date", nullable=True)

    def mark_deleted(self) -> "TrackedModel":
        """Marks the model as deleted."""
        self.delete_date = datetime.now()
        return self

    def to_schema(self) -> BaseModel:
        """Converts the model to a schema."""
        raise NotImplementedError


class UserMixin:
    user_id = mapped_column(String, name="user_id", nullable=False)
    organization_id = mapped_column(String, name="organization_id", nullable=True)

from sqlalchemy import create_engine, Column, String, Text, DateTime, Boolean, Integer, ForeignKey
# from sqlalchemy.ext.declarative import declarative_base, relationship
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.orm import sessionmaker
import datetime
import os
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid


DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@db:5432/quickshare")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    short_id = Column(String, unique=True, nullable=False)
    creator_hash = Column(UUID(as_uuid=True), default=uuid.uuid4)
    published = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    expires_at = Column(DateTime, nullable=True)
    latest_version_id = Column(UUID(as_uuid=True), nullable=True)
    view_mode = Column(String, default="latest")

    versions = relationship("DocumentVersion", back_populates="document", cascade="all, delete")


class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"))
    creator_hash = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    content = Column(Text, nullable=False)
    is_full_snapshot = Column(Boolean, default=False)
    change_summary = Column(Text, nullable=True)
    version_number = Column(Integer, nullable=False)

    __table_args__ = (
        # Ensure unique version per document
        {'sqlite_autoincrement': True},
    )

    document = relationship("Document", back_populates="versions")


def init_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

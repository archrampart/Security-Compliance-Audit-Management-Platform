from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

# Association table for many-to-many relationship between projects and users
project_user_association = Table(
    "project_users",
    Base.metadata,
    Column("project_id", Integer, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
)

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    organization = relationship("Organization", back_populates="projects")
    audits = relationship("Audit", back_populates="project", cascade="all, delete-orphan")
    assigned_users = relationship("User", secondary=project_user_association)

# Additional model for project-user relationship with extra fields if needed
class ProjectUser(Base):
    __tablename__ = "project_user_assignments"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project")
    user = relationship("User")


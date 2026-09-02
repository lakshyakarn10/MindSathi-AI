"""
CompanionConversation and CompanionMessage — Phase 1 addition.

A student can have multiple companion conversations (one per session).
Each conversation holds an ordered list of messages with role=student|assistant.

Privacy rules:
- A student can only access their own conversations (enforced in routes via require_student).
- Admins and counselors have no route-level access to these tables.
- Raw conversation content is NEVER included in the Counselor Wellness Report;
  only AI-extracted themes/observations are surfaced (Phase 4).
"""
from enum import Enum
from sqlalchemy import Column, String, ForeignKey, Text, Enum as SQLEnum, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


class MessageRole(str, Enum):
    STUDENT = "student"
    ASSISTANT = "assistant"


class CompanionConversation(Base):
    """One AI companion session for a student."""
    __tablename__ = "companion_conversations"

    student_id = Column(
        String(36),
        ForeignKey("students.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )

    # Relationships
    student = relationship("Student", back_populates="companion_conversations")
    messages = relationship(
        "CompanionMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="CompanionMessage.created_at"
    )


class CompanionMessage(Base):
    """A single turn in a companion conversation."""
    __tablename__ = "companion_messages"

    conversation_id = Column(
        String(36),
        ForeignKey("companion_conversations.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    # 'student' or 'assistant'
    role = Column(SQLEnum(MessageRole), nullable=False)
    # Raw message content — stored as plaintext for now
    content = Column(Text, nullable=False)

    # Relationships
    conversation = relationship("CompanionConversation", back_populates="messages")

    # Composite index for fast retrieval of a conversation's messages in order
    __table_args__ = (
        Index("ix_companion_messages_conv_created", "conversation_id", "created_at"),
    )

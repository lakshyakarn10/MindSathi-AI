"""phase1_db_and_model_fixes

Revision ID: f4e0c5a80aa1
Revises: 
Create Date: 2026-08-31 20:24:00.521689

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f4e0c5a80aa1'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    # 1. Create companion_conversations table if it doesn't exist
    if "companion_conversations" not in existing_tables:
        op.create_table(
            "companion_conversations",
            sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
            sa.Column("student_id", sa.String(length=36), sa.ForeignKey("students.id", ondelete="CASCADE"), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_companion_conversations_student_id", "companion_conversations", ["student_id"])
        op.create_index("ix_companion_conversations_id", "companion_conversations", ["id"])

    # 2. Create companion_messages table if it doesn't exist
    if "companion_messages" not in existing_tables:
        op.create_table(
            "companion_messages",
            sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
            sa.Column("conversation_id", sa.String(length=36), sa.ForeignKey("companion_conversations.id", ondelete="CASCADE"), nullable=False),
            sa.Column("role", sa.Enum("student", "assistant", name="messagerole"), nullable=False),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_companion_messages_conversation_id", "companion_messages", ["conversation_id"])
        op.create_index("ix_companion_messages_id", "companion_messages", ["id"])
        op.create_index("ix_companion_messages_conv_created", "companion_messages", ["conversation_id", "created_at"])

    # 3. Add columns to appointments if they don't exist
    if "appointments" in existing_tables:
        appointment_cols = [c["name"] for c in inspector.get_columns("appointments")]
        if "meet_url" not in appointment_cols:
            op.add_column("appointments", sa.Column("meet_url", sa.String(length=512), nullable=True))
        if "location" not in appointment_cols:
            op.add_column("appointments", sa.Column("location", sa.String(length=255), nullable=True))
        if "rejection_reason" not in appointment_cols:
            op.add_column("appointments", sa.Column("rejection_reason", sa.String(length=255), nullable=True))

    # 4. Add risk_indicator to wellness_checkins if it doesn't exist
    if "wellness_checkins" in existing_tables:
        wellness_cols = [c["name"] for c in inspector.get_columns("wellness_checkins")]
        if "risk_indicator" not in wellness_cols:
            op.add_column("wellness_checkins", sa.Column("risk_indicator", sa.Float(), server_default="3.0", nullable=False))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    if "wellness_checkins" in existing_tables:
        wellness_cols = [c["name"] for c in inspector.get_columns("wellness_checkins")]
        if "risk_indicator" in wellness_cols:
            op.drop_column("wellness_checkins", "risk_indicator")

    if "appointments" in existing_tables:
        appointment_cols = [c["name"] for c in inspector.get_columns("appointments")]
        if "rejection_reason" in appointment_cols:
            op.drop_column("appointments", "rejection_reason")
        if "location" in appointment_cols:
            op.drop_column("appointments", "location")
        if "meet_url" in appointment_cols:
            op.drop_column("appointments", "meet_url")

    if "companion_messages" in existing_tables:
        op.drop_table("companion_messages")

    if "companion_conversations" in existing_tables:
        op.drop_table("companion_conversations")


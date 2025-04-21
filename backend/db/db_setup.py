from sqlalchemy import (
    ForeignKey,
    create_engine,
    DateTime,
    func,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
    sessionmaker,
    declarative_base,
)

import datetime
import os


# Set up DB directory and file
DB_DIR = "db_file"
DB_NAME = "voiceapp.db"
DB_FILE_PATH = os.path.join(DB_DIR, DB_NAME)
DB_PATH = f"sqlite:///{DB_FILE_PATH}"

# Create directory if it doesn't exist
os.makedirs(DB_DIR, exist_ok=True)

# Delete old DB file if it exists
if os.path.exists(DB_FILE_PATH):
    os.remove(DB_FILE_PATH)

# Setup DB engine
engine = create_engine(
    DB_PATH,
    connect_args={"check_same_thread": False},
    # echo=True,  # for debugging
)
SessionLocal = sessionmaker(bind=engine)


Base = declarative_base()


class AudioSession(Base):
    __tablename__ = "audio_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    session_name: Mapped[str] = mapped_column()
    created_time: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    query_lang: Mapped[str] = mapped_column()
    query_file: Mapped[str] = mapped_column()
    query_prompt: Mapped[str] = mapped_column()
    query_audio_kind: Mapped[str] = mapped_column()

    output: Mapped["Output"] = relationship(
        back_populates="audio_session", uselist=False
    )


class Output(Base):
    __tablename__ = "outputs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    created_time: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    transcription_text: Mapped[str] = mapped_column()
    notes_text: Mapped[str] = mapped_column()
    audio_session_id: Mapped[int] = mapped_column(
        ForeignKey("audio_sessions.id"), unique=True
    )

    audio_session: Mapped["AudioSession"] = relationship(back_populates="output")


# Function to setup and create tables
def setup_db():
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")

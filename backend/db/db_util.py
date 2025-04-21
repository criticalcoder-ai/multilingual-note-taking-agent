from db.db_setup import AudioSession, Output, SessionLocal

from datetime import datetime, timedelta
import random
from tabulate import tabulate


def add_dummy_data(num_sessions=5):
    db = SessionLocal()

    try:
        # Sample data for variety
        languages = ["English", "Spanish", "French", "German", "Mandarin", "Japanese"]
        audio_kinds = ["voice", "music", "ambient", "interview", "lecture", "podcast"]

        # Create dummy AudioSession objects
        for i in range(1, num_sessions + 1):
            # Create an AudioSession
            created_time = datetime.now() - timedelta(days=random.randint(0, 30))
            audio_session = AudioSession(
                session_name=f"Session {i}",
                created_time=created_time,
                query_lang=random.choice(languages),
                query_file=f"audio_file_{i}.mp3",
                query_prompt=f"This is a prompt for session {i}",
                query_audio_kind=random.choice(audio_kinds),
            )
            db.add(audio_session)
            db.flush()  # Flush to get the ID

            # Create an Output for about 70% of the sessions to demonstrate optional relationship
            if random.random() < 0.7:
                output = Output(
                    audio_session_id=audio_session.id,
                    created_time=created_time
                    + timedelta(minutes=random.randint(5, 60)),
                    transcription_text=f"This is a transcription for session {i}. It contains some dummy text that would typically be the result of transcribing audio content.",
                    notes_text=f"Notes for session {i}: Audio quality was {'good' if random.random() > 0.3 else 'poor'}, duration was {random.randint(2, 120)} minutes.",
                )
                db.add(output)

        # Commit the changes
        db.commit()
        print(
            f"Successfully added {num_sessions} AudioSession records with corresponding Output records."
        )

    except Exception as e:
        db.rollback()
        print(f"An error occurred: {e}")

    finally:
        db.close()


def view_db():
    db = SessionLocal()

    try:
        # Get all AudioSession records
        audio_sessions = db.query(AudioSession).order_by(AudioSession.id).all()

        # Display AudioSessions
        print("\n=== AUDIO SESSIONS ===\n")
        sessions_data = []
        for session in audio_sessions:
            sessions_data.append(
                [
                    session.id,
                    session.session_name,
                    session.created_time,
                    session.query_lang,
                    session.query_audio_kind,
                    # Check if this session has an output
                    "Yes" if session.output else "No",
                ]
            )

        print(
            tabulate(
                sessions_data,
                headers=[
                    "ID",
                    "Name",
                    "Created",
                    "Language",
                    "Audio Kind",
                    "Has Output",
                ],
                tablefmt="grid",
            )
        )

        # Get all Output records
        outputs = db.query(Output).order_by(Output.id).all()

        # Display Outputs
        print("\n=== OUTPUTS ===\n")
        outputs_data = []
        for output in outputs:
            # Get a truncated version of the text fields - handle as strings
            transcription_text = (
                str(output.transcription_text)
                if output.transcription_text is not None
                else ""
            )
            notes_text = str(output.notes_text) if output.notes_text is not None else ""

            transcription_truncated = (
                transcription_text[:50] + "..."
                if len(transcription_text) > 50
                else transcription_text
            )
            notes_truncated = (
                notes_text[:50] + "..." if len(notes_text) > 50 else notes_text
            )

            outputs_data.append(
                [
                    output.id,
                    output.audio_session_id,
                    output.created_time,
                    transcription_truncated,
                    notes_truncated,
                ]
            )

        print(
            tabulate(
                outputs_data,
                headers=[
                    "ID",
                    "Session ID",
                    "Created",
                    "Transcription (truncated)",
                    "Notes (truncated)",
                ],
                tablefmt="grid",
            )
        )

        # Print detailed relationships
        print("\n=== DETAILED RELATIONSHIPS ===\n")
        for session in audio_sessions:
            print(f"Session ID: {session.id}, Name: {session.session_name}")
            if session.output:
                print(f"  └── Has Output ID: {session.output.id}")
                print(f"      ├── Created: {session.output.created_time}")
                print(
                    f"      ├── Transcription: {session.output.transcription_text[:30]}..."
                    if session.output.transcription_text
                    else "      ├── Transcription: None"
                )
                print(
                    f"      └── Notes: {session.output.notes_text[:30]}..."
                    if session.output.notes_text
                    else "      └── Notes: None"
                )
            else:
                print("  └── No output associated")
            print()

    except Exception as e:
        print(f"An error occurred: {e}")

    finally:
        db.close()

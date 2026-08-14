import sqlite3
from pathlib import Path


# Adjust this only if your database file has a different name/location.
DB_PATH = Path(__file__).resolve().parent / "disastershield.db"


def migrate():
    if not DB_PATH.exists():
        print(f"Database not found: {DB_PATH}")
        print("Start the backend once first so the database is created.")
        return

    connection = sqlite3.connect(DB_PATH)

    try:
        cursor = connection.cursor()

        cursor.execute("PRAGMA table_info(users)")
        columns = [row[1] for row in cursor.fetchall()]

        if "role" in columns:
            print("✅ role column already exists.")
            return

        cursor.execute(
            """
            ALTER TABLE users
            ADD COLUMN role VARCHAR NOT NULL DEFAULT 'USER'
            """
        )

        connection.commit()

        print("✅ Successfully added users.role")
        print("✅ Existing users have been assigned role: USER")

    except Exception as error:
        connection.rollback()
        print("❌ Migration failed:")
        print(error)

    finally:
        connection.close()


if __name__ == "__main__":
    migrate()
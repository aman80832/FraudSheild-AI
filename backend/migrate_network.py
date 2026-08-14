import sqlite3

DATABASE = "fraudshield.db"

conn = sqlite3.connect(DATABASE)
cursor = conn.cursor()

columns = {
    "device_id": "TEXT",
    "beneficiary_id": "TEXT",
    "location": "TEXT",
}

for column, column_type in columns.items():

    cursor.execute("PRAGMA table_info(transactions)")
    existing_columns = {
        row[1]
        for row in cursor.fetchall()
    }

    if column not in existing_columns:

        cursor.execute(
            f"""
            ALTER TABLE transactions
            ADD COLUMN {column} {column_type}
            """
        )

        print(f"Added column: {column}")

    else:
        print(f"Already exists: {column}")

conn.commit()
conn.close()

print()
print("Fraud Network database migration completed.")
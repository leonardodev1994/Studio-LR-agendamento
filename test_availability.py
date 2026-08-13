import datetime as dt
import os
import tempfile
import unittest
from pathlib import Path

os.environ["APP_ENV"] = "development"
os.environ["DATABASE_URL"] = ""

import server


class AvailabilityTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.original_path = server.DB_PATH
        self.original_database = server.database
        server.DB_PATH = Path(self.temp_dir.name) / "test.sqlite3"
        server.database = server.Database("")
        server.init_db()

    def tearDown(self):
        server.DB_PATH = self.original_path
        server.database = self.original_database
        self.temp_dir.cleanup()

    def weekday(self):
        candidate = dt.date.today() + dt.timedelta(days=1)
        while candidate.weekday() >= 6:
            candidate += dt.timedelta(days=1)
        return candidate.isoformat()

    def test_default_schedule_has_only_the_three_configured_hours(self):
        self.assertEqual(server.slots_for(self.weekday()), ["08:00", "14:00", "20:00"])

    def test_legacy_hourly_ranges_cannot_appear_on_the_booking_form(self):
        date_value = self.weekday()
        weekday = dt.date.fromisoformat(date_value).weekday()
        conn = server.db()
        server.execute(conn, "DELETE FROM weekly_hours WHERE weekday = ?", (weekday,))
        server.execute(
            conn,
            """INSERT INTO weekly_hours
               (weekday, start_time, end_time, slot_minutes, active)
               VALUES (?, '09:00', '18:00', 60, 1)""",
            (weekday,),
        )
        conn.commit()
        conn.close()

        self.assertEqual(server.slots_for(date_value), ["08:00", "14:00", "20:00"])

    def test_an_extra_available_time_is_added_for_the_selected_date(self):
        date_value = self.weekday()
        conn = server.db()
        server.execute(
            conn,
            "INSERT INTO extra_slots (slot_date, slot_time, note) VALUES (?, ?, ?)",
            (date_value, "14:30", "Encaixe"),
        )
        conn.commit()
        conn.close()

        self.assertEqual(server.slots_for(date_value), ["08:00", "14:00", "14:30", "20:00"])


if __name__ == "__main__":
    unittest.main()

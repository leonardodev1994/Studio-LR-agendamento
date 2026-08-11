import datetime as dt
import json
import unittest

from server import json_default


class JsonSerializationTests(unittest.TestCase):
    def test_serializes_postgres_datetime_values(self):
        payload = {
            "created_at": dt.datetime(2026, 8, 10, 21, 29, 27),
            "appointment_date": dt.date(2026, 8, 11),
            "appointment_time": dt.time(14, 30),
        }

        encoded = json.dumps(payload, default=json_default)
        decoded = json.loads(encoded)

        self.assertEqual(decoded["created_at"], "2026-08-10T21:29:27")
        self.assertEqual(decoded["appointment_date"], "2026-08-11")
        self.assertEqual(decoded["appointment_time"], "14:30:00")


if __name__ == "__main__":
    unittest.main()

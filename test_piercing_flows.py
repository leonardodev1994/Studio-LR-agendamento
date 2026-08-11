import datetime as dt
import json
import os
import tempfile
import threading
import unittest
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

os.environ["APP_ENV"] = "development"
os.environ["DATABASE_URL"] = ""

import server


class PiercingFlowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp_dir = tempfile.TemporaryDirectory()
        cls.original_path = server.DB_PATH
        cls.original_database = server.database
        server.DB_PATH = Path(cls.temp_dir.name) / "test.sqlite3"
        server.database = server.Database("")
        server.init_db()
        cls.httpd = server.ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        cls.thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f"http://127.0.0.1:{cls.httpd.server_address[1]}"
        cls.services = {
            row["catalog_key"]: row["id"]
            for row in cls.query("SELECT id, catalog_key FROM services")
        }

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()
        cls.thread.join(timeout=2)
        server.DB_PATH = cls.original_path
        server.database = cls.original_database
        cls.temp_dir.cleanup()

    @classmethod
    def query(cls, statement, params=()):
        conn = server.db()
        try:
            return [dict(row) for row in server.execute(conn, statement, params).fetchall()]
        finally:
            conn.close()

    @classmethod
    def request(cls, method, path, body=None):
        data = json.dumps(body).encode() if body is not None else None
        request = urllib.request.Request(
            cls.base + path,
            data=data,
            method=method,
            headers={"Content-Type": "application/json", "User-Agent": "StudioLR-Test"},
        )
        try:
            with urllib.request.urlopen(request, timeout=5) as response:
                return response.status, json.loads(response.read())
        except urllib.error.HTTPError as error:
            try:
                return error.code, json.loads(error.read())
            finally:
                error.close()

    @classmethod
    def bookable_date(cls, offset=0):
        candidate = dt.date.today() + dt.timedelta(days=1 + offset)
        while candidate.weekday() >= 6:
            candidate += dt.timedelta(days=1)
        return candidate.isoformat()

    @classmethod
    def slot(cls, service_key, date_value):
        status, payload = cls.request(
            "GET",
            "/api/public/availability?" + urllib.parse.urlencode({
                "date": date_value,
                "service_id": cls.services[service_key],
            }),
        )
        assert status == 200 and payload["slots"]
        return payload["slots"][0]

    def booking_payload(self, service_key, phone, date_value):
        return {
            "service_id": self.services[service_key],
            "date": date_value,
            "time": self.slot(service_key, date_value),
            "name": "Cliente Teste",
            "phone": phone,
            "neighborhood": "Centro",
        }

    def test_a_nail_design_keeps_original_flow(self):
        date_value = self.bookable_date(0)
        payload = self.booking_payload("manicure-simples", "21999000001", date_value)
        status, response = self.request("POST", "/api/public/appointments", payload)
        self.assertEqual(status, 201)
        consent = self.query("SELECT id FROM piercing_consents WHERE appointment_id = ?", (response["appointment"]["id"],))
        self.assertEqual(consent, [])

    def test_b_adult_piercing_records_immutable_consent(self):
        date_value = self.bookable_date(1)
        payload = self.booking_payload("piercing-nostril", "21999000002", date_value)
        payload.update({
            "birth_date": "1990-05-20",
            "term_accepted": True,
            "truth_confirmed": True,
            "anatomy_confirmed": True,
        })
        status, response = self.request("POST", "/api/public/appointments", payload)
        self.assertEqual(status, 201)
        appointment_id = response["appointment"]["id"]
        saved = self.query("SELECT term_version, term_content, term_hash FROM piercing_consents WHERE appointment_id = ?", (appointment_id,))[0]
        conn = server.db()
        server.set_setting_value(conn, "piercing_term_version", "future-v2")
        server.set_setting_value(conn, "piercing_term_content", "Novo texto futuro")
        conn.commit()
        conn.close()
        status, consent = self.request("POST", "/api/public/client-consent", {"appointment_id": appointment_id, "phone": payload["phone"]})
        self.assertEqual(status, 200)
        self.assertEqual(consent["consent"]["term_version"], saved["term_version"])
        self.assertEqual(consent["consent"]["term_content"], saved["term_content"])
        self.assertEqual(len(saved["term_hash"]), 64)
        denied, _ = self.request("POST", "/api/public/client-consent", {"appointment_id": appointment_id, "phone": "21999999999"})
        self.assertEqual(denied, 404)

    def test_c_minor_requires_guardian_and_records_both(self):
        date_value = self.bookable_date(2)
        payload = self.booking_payload("piercing-lobulo", "21999000003", date_value)
        payload.update({
            "birth_date": "2012-02-10",
            "term_accepted": True,
            "truth_confirmed": True,
            "anatomy_confirmed": True,
            "guardian_authorization": True,
            "guardian_name": "Responsável Teste",
            "guardian_cpf": "52998224725",
            "guardian_birth_date": "1980-04-12",
            "guardian_phone": "21988000003",
            "guardian_relationship": "Mãe",
        })
        status, response = self.request("POST", "/api/public/appointments", payload)
        self.assertEqual(status, 201)
        saved = self.query("SELECT is_minor, guardian_name FROM piercing_consents WHERE appointment_id = ?", (response["appointment"]["id"],))[0]
        self.assertEqual(saved["is_minor"], 1)
        self.assertEqual(saved["guardian_name"], "Responsável Teste")

    def test_d_minor_is_blocked_from_adult_only_service(self):
        date_value = self.bookable_date(3)
        payload = self.booking_payload("piercing-mamilo", "21999000004", date_value)
        payload.update({
            "birth_date": "2012-02-10",
            "term_accepted": True,
            "truth_confirmed": True,
            "anatomy_confirmed": True,
        })
        status, response = self.request("POST", "/api/public/appointments", payload)
        self.assertEqual(status, 403)
        self.assertIn("somente para maiores", response["error"])

    def test_e_unaccepted_term_is_rejected(self):
        date_value = self.bookable_date(4)
        payload = self.booking_payload("piercing-industrial", "21999000005", date_value)
        payload.update({"birth_date": "1991-01-01"})
        status, _ = self.request("POST", "/api/public/appointments", payload)
        self.assertEqual(status, 400)

    def test_f_completed_agenda_and_industrial_aftercare(self):
        appointment = self.query("""
            SELECT a.id FROM appointments a JOIN clients c ON c.id = a.client_id
            WHERE c.phone = ?
        """, ("21999000002",))[0]
        conn = server.db()
        server.execute(conn, "UPDATE appointments SET status = 'Concluído' WHERE id = ?", (appointment["id"],))
        conn.commit()
        conn.close()
        status, agenda = self.request("GET", "/api/public/client-appointments?phone=21999000002")
        self.assertEqual(status, 200)
        self.assertEqual(agenda["appointments"][0]["status"], "Concluído")
        status, care = self.request("GET", "/api/public/aftercare?service_key=piercing-industrial")
        self.assertEqual(status, 200)
        self.assertEqual(care["aftercare"]["category"], "industrial")
        self.assertEqual(len(care["aftercare"]["specific"]), 2)


if __name__ == "__main__":
    unittest.main()

import unittest
from types import SimpleNamespace

import server
from server import persistent_database_required


class FakeSchemaConnection:
    def __init__(self, columns, consent_table):
        self.columns = columns
        self.consent_table = consent_table

    def execute(self, statement, params=()):
        if "information_schema.columns" in statement:
            rows = [
                {"table_name": table, "column_name": column}
                for table, columns in self.columns.items()
                for column in columns
            ]
            return SimpleNamespace(fetchall=lambda: rows)
        if "to_regclass" in statement:
            return SimpleNamespace(
                fetchone=lambda: {"table_name": self.consent_table}
            )
        raise AssertionError(f"Consulta inesperada: {statement}")


class PersistentDatabaseConfigTests(unittest.TestCase):
    def test_local_development_allows_sqlite(self):
        self.assertFalse(persistent_database_required({"APP_ENV": "development"}))

    def test_explicit_production_requires_postgres(self):
        self.assertTrue(persistent_database_required({"APP_ENV": "production"}))

    def test_railway_requires_postgres_even_if_app_env_was_forgotten(self):
        self.assertTrue(
            persistent_database_required(
                {"APP_ENV": "development", "RAILWAY_ENVIRONMENT_ID": "production"}
            )
        )

    def test_render_requires_postgres_even_if_app_env_was_forgotten(self):
        self.assertTrue(
            persistent_database_required({"APP_ENV": "development", "RENDER": "true"})
        )

    def test_postgres_requires_reviewed_body_piercing_migration(self):
        original_database = server.database
        server.database = SimpleNamespace(kind="postgres", sql=lambda statement: statement)
        try:
            connection = FakeSchemaConnection(
                {"services": {"minor_policy"}, "clients": set()},
                consent_table=None,
            )
            with self.assertRaisesRegex(
                RuntimeError, "migrations/20260811_body_piercing.sql"
            ):
                server.validate_body_piercing_schema(connection)
        finally:
            server.database = original_database

    def test_postgres_accepts_complete_body_piercing_schema(self):
        original_database = server.database
        server.database = SimpleNamespace(kind="postgres", sql=lambda statement: statement)
        try:
            connection = FakeSchemaConnection(
                {
                    "services": {"minor_policy", "aftercare_category"},
                    "clients": {"birth_date"},
                },
                consent_table="piercing_consents",
            )
            server.validate_body_piercing_schema(connection)
        finally:
            server.database = original_database


if __name__ == "__main__":
    unittest.main()

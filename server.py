from http import cookies
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, quote, urlparse
import base64
import datetime as dt
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3


ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / "public"
DB_PATH = ROOT / "studio_lr.sqlite3"
GALLERY_DIR = PUBLIC / "assets" / "galeria"
SERVICES_DIR = PUBLIC / "assets" / "servicos"
GALLERY_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"]
MAX_GALLERY_UPLOAD_BYTES = 8 * 1024 * 1024
CATALOG_DEFAULTS = [
    {
        "key": "manicure-simples",
        "category": "Natural",
        "name": "Manicure simples",
        "price_cents": 2500,
        "duration_minutes": 45,
        "description": "Cuidado essencial para unhas naturais, com acabamento limpo e delicado.",
        "icon": "◇",
    },
    {
        "key": "pedicure-simples",
        "category": "Natural",
        "name": "Pedicure simples",
        "price_cents": 2500,
        "duration_minutes": 45,
        "description": "Cuidado dos pés com acabamento confortável, bonito e bem feito.",
        "icon": "◇",
    },
    {
        "key": "manicure-pedicure",
        "category": "Natural",
        "name": "Manicure + Pedicure",
        "price_cents": 4500,
        "duration_minutes": 90,
        "description": "Combo completo para mãos e pés com praticidade e cuidado.",
        "icon": "◇",
    },
    {
        "key": "francesinha",
        "category": "Natural",
        "name": "Francesinha",
        "price_cents": 3000,
        "duration_minutes": 60,
        "description": "Acabamento clássico e elegante para unhas naturais.",
        "icon": "◇",
    },
    {
        "key": "esmaltacao-simples-mao",
        "category": "Natural",
        "name": "Esmaltação simples (mão)",
        "price_cents": 1500,
        "duration_minutes": 30,
        "description": "Esmaltação prática para renovar o visual das mãos.",
        "icon": "◇",
    },
    {
        "key": "esmaltacao-gel-mao",
        "category": "Natural",
        "name": "Esmaltação em gel (mão)",
        "price_cents": 3000,
        "duration_minutes": 45,
        "description": "Brilho intenso e maior durabilidade para as unhas das mãos.",
        "icon": "◇",
    },
    {
        "key": "esmaltacao-gel-pe",
        "category": "Natural",
        "name": "Esmaltação em gel (pé)",
        "price_cents": 4000,
        "duration_minutes": 45,
        "description": "Acabamento em gel nos pés com brilho e durabilidade.",
        "icon": "◇",
    },
    {
        "key": "gel-tips",
        "category": "Alongamento",
        "name": "Gel na Tips",
        "price_cents": 10000,
        "duration_minutes": 120,
        "description": "Alongamento elegante com acabamento resistente e natural.",
        "image": "/assets/servicos/gel-tips.jpg",
    },
    {
        "key": "fibra-vidro",
        "category": "Alongamento",
        "name": "Fibra de Vidro",
        "price_cents": 15000,
        "duration_minutes": 150,
        "description": "Alongamento sofisticado com leveza, resistência e acabamento natural.",
        "image": "/assets/servicos/fibra-vidro.jpg",
    },
    {
        "key": "postica-soft-gel",
        "category": "Alongamento",
        "name": "Postiça soft gel",
        "price_cents": 6000,
        "duration_minutes": 90,
        "description": "Aplicação prática com acabamento bonito e confortável.",
        "icon": "✦",
    },
    {
        "key": "postica",
        "category": "Alongamento",
        "name": "Postiça",
        "price_cents": 3500,
        "duration_minutes": 60,
        "description": "Opção rápida para unhas alongadas com visual delicado.",
        "icon": "✦",
    },
    {
        "key": "gel-tips-extra-longa",
        "category": "Alongamento",
        "name": "Gel na tips extra longa",
        "price_cents": 12000,
        "duration_minutes": 150,
        "description": "Alongamento extra longo com estrutura reforçada e acabamento premium.",
        "image": "/assets/servicos/gel-tips.jpg",
    },
    {
        "key": "manutencao-gel-tips",
        "category": "Manutenção",
        "name": "Manutenção Gel na tips",
        "price_cents": 8500,
        "duration_minutes": 90,
        "description": "Manutenção para clientes que já fizeram Gel na Tips no Studio LR.",
        "existing_client_only": True,
        "icon": "✦",
    },
    {
        "key": "manutencao-fibra",
        "category": "Manutenção",
        "name": "Manutenção Fibra",
        "price_cents": 11000,
        "duration_minutes": 120,
        "description": "Manutenção para clientes que já fizeram Fibra de Vidro no Studio LR.",
        "existing_client_only": True,
        "icon": "✦",
    },
    {
        "key": "nail-art-elaborada",
        "category": "Extras",
        "name": "Nail art elaborada",
        "price_label": "a partir de R$ 10,00",
        "duration_label": "conforme desenho",
        "description": "Adicional cobrado conforme a dificuldade do desenho escolhido.",
        "bookable": False,
        "addon": True,
        "image": "/assets/servicos/nail-art.jpg",
    },
    {
        "key": "banho-gel",
        "category": "Extras",
        "name": "Banho de Gel",
        "price_cents": 6500,
        "duration_minutes": 75,
        "description": "Camada de gel para brilho, resistência e aspecto impecável.",
        "image": "/assets/servicos/banho-gel.jpg",
    },
    {
        "key": "blindagem",
        "category": "Extras",
        "name": "Blindagem",
        "price_cents": 4500,
        "duration_minutes": 60,
        "description": "Proteção para unhas naturais com acabamento delicado e resistente.",
        "icon": "◇",
    },
    {
        "key": "reconstrucao-unha-pe",
        "category": "Extras",
        "name": "Reconstrução unha (Pé)",
        "price_cents": 6500,
        "duration_minutes": 60,
        "description": "Reconstrução cuidadosa para recuperar a estrutura da unha do pé.",
        "icon": "◇",
    },
    {
        "key": "spa-pes",
        "category": "Extras",
        "name": "Spa dos pés",
        "price_cents": 6000,
        "duration_minutes": 60,
        "description": "Tratamento relaxante para pés mais macios, cuidados e bonitos.",
        "icon": "✦",
    },
    {
        "key": "remocao",
        "category": "Extras",
        "name": "Remoção",
        "price_cents": 3000,
        "duration_minutes": 45,
        "description": "Remoção técnica e cuidadosa para preservar a saúde das unhas.",
        "icon": "◇",
    },
]
PUBLIC_REVIEWS = [
    {
        "name": "Naysa Pereira",
        "rating": 5,
        "source": "Avaliação Google",
        "text": "Excelente atendimento! Super indico. A Letícia foi super atenciosa, simpática e deixou minhas unhas lindas.",
    },
    {
        "name": "Daniela Reis",
        "rating": 5,
        "source": "Avaliação Google",
        "text": "Amei! Lugar aconchegante. Sempre tive dificuldade com o motor usado na unha em gel e a Letícia foi excelente.",
    },
    {
        "name": "Anna Ruffino",
        "rating": 5,
        "source": "Avaliação Google",
        "text": "Profissional excelente! O espaço é muito agradável, confortável e refrigerado. Com certeza voltarei.",
    },
    {
        "name": "Roberta Mendes",
        "rating": 5,
        "source": "Avaliação Google",
        "text": "Letícia é muito simpática e acolhedora. Foi minha primeira vez com ela e tenho certeza que vou voltar.",
    },
    {
        "name": "Juliana Diogo",
        "rating": 5,
        "source": "Avaliação Google",
        "text": "Experiência única! Espaço aconchegante, muito educada e gente fina.",
    },
    {
        "name": "Yasmin Azevedo",
        "rating": 5,
        "source": "Avaliação Google",
        "text": "Minhas unhas ficaram lindas! A profissional foi super atenciosa e cuidadosa durante todo o atendimento. Recomendo para todas.",
    },
]
CATALOG_SEED_VERSION = "2026-06-tabela-valores-v1"


def load_env():
    env_path = ROOT / ".env"
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key.strip(), value)


load_env()

APP_ENV = os.environ.get("APP_ENV", "development")
DATABASE_URL = os.environ.get("DATABASE_URL", "")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
SECRET_KEY = os.environ.get("SECRET_KEY", "")
if not SECRET_KEY:
    if APP_ENV == "production":
        raise RuntimeError("Configure SECRET_KEY no ambiente de produção.")
    SECRET_KEY = secrets.token_urlsafe(32)
WHATSAPP_NUMBER = os.environ.get("LETICIA_WHATSAPP", "")
INSTAGRAM_URL = os.environ.get("INSTAGRAM_URL", "")
HOST = os.environ.get("HOST", "0.0.0.0" if APP_ENV == "production" else "127.0.0.1")
PORT = int(os.environ.get("PORT", "8000"))


def validate_config():
    if APP_ENV != "production":
        return
    required = {
        "ADMIN_PASSWORD": ADMIN_PASSWORD,
        "LETICIA_WHATSAPP": WHATSAPP_NUMBER,
        "INSTAGRAM_URL": INSTAGRAM_URL,
        "SECRET_KEY": SECRET_KEY,
    }
    missing = [key for key, value in required.items() if not value]
    if missing:
        raise RuntimeError(f"Configure as variáveis de produção: {', '.join(missing)}")


class Database:
    def __init__(self, url=""):
        self.url = url
        self.kind = "postgres" if url.startswith(("postgres://", "postgresql://")) else "sqlite"
        self.driver = None
        if self.kind == "postgres":
            try:
                import psycopg

                self.driver = "psycopg"
                self.module = psycopg
            except ImportError:
                try:
                    import psycopg2
                    import psycopg2.extras

                    self.driver = "psycopg2"
                    self.module = psycopg2
                    self.extras = psycopg2.extras
                except ImportError as exc:
                    raise RuntimeError(
                        "DATABASE_URL foi definido, mas nenhum driver PostgreSQL está instalado. "
                        "Instale psycopg/psycopg2 para usar Supabase/PostgreSQL."
                    ) from exc

    def connect(self):
        if self.kind == "sqlite":
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA foreign_keys = ON")
            return conn
        if self.driver == "psycopg":
            return self.module.connect(self.url, row_factory=self.module.rows.dict_row)
        return self.module.connect(self.url, cursor_factory=self.extras.RealDictCursor)

    def sql(self, statement):
        if self.kind == "postgres":
            return statement.replace("?", "%s")
        return statement

    def schema(self):
        if self.kind == "postgres":
            return """
        CREATE TABLE IF NOT EXISTS services (
            id SERIAL PRIMARY KEY,
            catalog_key TEXT UNIQUE,
            name TEXT NOT NULL UNIQUE,
            price_cents INTEGER NOT NULL,
            duration_minutes INTEGER NOT NULL DEFAULT 90,
            description TEXT NOT NULL DEFAULT '',
            active INTEGER NOT NULL DEFAULT 1
            );
            CREATE TABLE IF NOT EXISTS clients (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT NOT NULL UNIQUE,
                neighborhood TEXT NOT NULL DEFAULT '',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS appointments (
                id SERIAL PRIMARY KEY,
                service_id INTEGER NOT NULL REFERENCES services(id),
                client_id INTEGER NOT NULL REFERENCES clients(id),
                appointment_date TEXT NOT NULL,
                appointment_time TEXT NOT NULL,
                notes TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT 'Pendente'
                    CHECK(status IN ('Pendente', 'Confirmado', 'Cancelado', 'Concluído')),
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(appointment_date, appointment_time)
            );
            CREATE TABLE IF NOT EXISTS weekly_hours (
                id SERIAL PRIMARY KEY,
                weekday INTEGER NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                slot_minutes INTEGER NOT NULL DEFAULT 90,
                active INTEGER NOT NULL DEFAULT 1
            );
            CREATE TABLE IF NOT EXISTS blocked_days (
                id SERIAL PRIMARY KEY,
                block_date TEXT NOT NULL UNIQUE,
                reason TEXT NOT NULL DEFAULT ''
            );
            CREATE TABLE IF NOT EXISTS extra_slots (
                id SERIAL PRIMARY KEY,
                slot_date TEXT NOT NULL,
                slot_time TEXT NOT NULL,
                note TEXT NOT NULL DEFAULT '',
                UNIQUE(slot_date, slot_time)
            );
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL DEFAULT '',
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS reschedule_requests (
                id SERIAL PRIMARY KEY,
                appointment_id INTEGER NOT NULL REFERENCES appointments(id),
                client_id INTEGER NOT NULL REFERENCES clients(id),
                requested_date TEXT NOT NULL DEFAULT '',
                requested_time TEXT NOT NULL DEFAULT '',
                message TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT 'Pendente'
                    CHECK(status IN ('Pendente', 'Resolvida', 'Cancelada')),
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            """
        return """
        CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            catalog_key TEXT UNIQUE,
            name TEXT NOT NULL UNIQUE,
            price_cents INTEGER NOT NULL,
            duration_minutes INTEGER NOT NULL DEFAULT 90,
            description TEXT NOT NULL DEFAULT '',
            active INTEGER NOT NULL DEFAULT 1
        );
        CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            neighborhood TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(phone)
        );
        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            service_id INTEGER NOT NULL REFERENCES services(id),
            client_id INTEGER NOT NULL REFERENCES clients(id),
            appointment_date TEXT NOT NULL,
            appointment_time TEXT NOT NULL,
            notes TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'Pendente'
                CHECK(status IN ('Pendente', 'Confirmado', 'Cancelado', 'Concluído')),
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(appointment_date, appointment_time)
        );
        CREATE TABLE IF NOT EXISTS weekly_hours (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            weekday INTEGER NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            slot_minutes INTEGER NOT NULL DEFAULT 90,
            active INTEGER NOT NULL DEFAULT 1
        );
        CREATE TABLE IF NOT EXISTS blocked_days (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            block_date TEXT NOT NULL UNIQUE,
            reason TEXT NOT NULL DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS extra_slots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slot_date TEXT NOT NULL,
            slot_time TEXT NOT NULL,
            note TEXT NOT NULL DEFAULT '',
            UNIQUE(slot_date, slot_time)
        );
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL DEFAULT '',
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS reschedule_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            appointment_id INTEGER NOT NULL REFERENCES appointments(id),
            client_id INTEGER NOT NULL REFERENCES clients(id),
            requested_date TEXT NOT NULL DEFAULT '',
            requested_time TEXT NOT NULL DEFAULT '',
            message TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'Pendente'
                CHECK(status IN ('Pendente', 'Resolvida', 'Cancelada')),
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        """


database = Database(DATABASE_URL)


def db():
    return database.connect()


def execute(conn, statement, params=()):
    sql = database.sql(statement)
    if hasattr(conn, "execute"):
        return conn.execute(sql, params)
    cursor = conn.cursor()
    cursor.execute(sql, params)
    return cursor


def row_dict(row):
    return dict(row) if row else None


def rows_dict(rows):
    return [dict(row) for row in rows]


def gallery_path(index):
    for extension in GALLERY_EXTENSIONS:
        candidate = GALLERY_DIR / f"galeria-{index:02d}{extension}"
        if candidate.exists():
            return candidate
    return GALLERY_DIR / f"galeria-{index:02d}.jpg"


def gallery_url(path):
    relative = path.relative_to(PUBLIC)
    version = int(path.stat().st_mtime) if path.exists() else 0
    return f"/{relative.as_posix()}?v={version}"


def asset_url(path):
    relative = path.relative_to(PUBLIC)
    version = int(path.stat().st_mtime) if path.exists() else 0
    return f"/{relative.as_posix()}?v={version}"


def public_gallery():
    items = []
    for index in range(1, 19):
        path = gallery_path(index)
        items.append(
            {
                "index": index,
                "src": gallery_url(path),
                "alt": f"Trabalho Studio LR {index:02d}",
                "caption": f"Studio LR {index:02d}",
            }
        )
    return items


def schema_statements(script):
    return [statement.strip() for statement in script.split(";") if statement.strip()]


def run_migrations(conn):
    if database.kind == "sqlite":
        service_columns = {
            row["name"]
            for row in execute(conn, "PRAGMA table_info(services)").fetchall()
        }
        if "catalog_key" not in service_columns:
            execute(conn, "ALTER TABLE services ADD COLUMN catalog_key TEXT")
        execute(conn, "CREATE UNIQUE INDEX IF NOT EXISTS idx_services_catalog_key ON services(catalog_key)")
        client_columns = {
            row["name"]
            for row in execute(conn, "PRAGMA table_info(clients)").fetchall()
        }
        if "neighborhood" not in client_columns:
            execute(conn, "ALTER TABLE clients ADD COLUMN neighborhood TEXT NOT NULL DEFAULT ''")
        return

    with conn.cursor() as cursor:
        cursor.execute("ALTER TABLE services ADD COLUMN IF NOT EXISTS catalog_key TEXT")
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_services_catalog_key ON services(catalog_key)")
        cursor.execute("ALTER TABLE clients ADD COLUMN IF NOT EXISTS neighborhood TEXT NOT NULL DEFAULT ''")


def bookable_catalog_items():
    return [item for item in CATALOG_DEFAULTS if item.get("bookable", True)]


def sync_catalog_services(conn):
    current_seed = setting_value(conn, "catalog_seed_version", "")
    force_update = current_seed != CATALOG_SEED_VERSION
    legacy_names = {
        "gel-tips": ["Gel na Tips"],
        "manutencao-gel-tips": ["Manutenção"],
        "banho-gel": ["Banho de Gel"],
        "blindagem": ["Blindagem"],
    }

    for item in bookable_catalog_items():
        existing = execute(
            conn,
            "SELECT id FROM services WHERE catalog_key = ?",
            (item["key"],),
        ).fetchone()
        if not existing and force_update:
            for legacy_name in legacy_names.get(item["key"], [item["name"]]):
                existing = execute(
                    conn,
                    "SELECT id FROM services WHERE name = ?",
                    (legacy_name,),
                ).fetchone()
                if existing:
                    break

        if existing:
            if force_update:
                execute(
                    conn,
                    """
                    UPDATE services
                    SET catalog_key = ?, name = ?, price_cents = ?, duration_minutes = ?, description = ?, active = 1
                    WHERE id = ?
                    """,
                    (
                        item["key"],
                        item["name"],
                        item["price_cents"],
                        item["duration_minutes"],
                        item["description"],
                        existing["id"],
                    ),
                )
            continue

        execute(
            conn,
            """
            INSERT INTO services (catalog_key, name, price_cents, duration_minutes, description, active)
            VALUES (?, ?, ?, ?, ?, 1)
            ON CONFLICT(name) DO NOTHING
            """,
            (
                item["key"],
                item["name"],
                item["price_cents"],
                item["duration_minutes"],
                item["description"],
            ),
        )

    if force_update:
        set_setting_value(conn, "catalog_seed_version", CATALOG_SEED_VERSION)


def init_db():
    conn = db()
    if database.kind == "sqlite":
        conn.executescript(database.schema())
    else:
        with conn.cursor() as cursor:
            for statement in schema_statements(database.schema()):
                cursor.execute(statement)
    run_migrations(conn)

    current_hours = execute(conn, "SELECT COUNT(*) AS total FROM weekly_hours").fetchone()["total"]
    if current_hours == 0:
        hours = [(day, "09:00", "18:00", 90, 1) for day in range(0, 6)]
        for hour in hours:
            execute(
                conn,
                """
                INSERT INTO weekly_hours (weekday, start_time, end_time, slot_minutes, active)
                VALUES (?, ?, ?, ?, ?)
                """,
                hour,
            )
    settings = [
        ("studio_name", "Studio LR"),
        ("instagram_url", INSTAGRAM_URL),
        ("whatsapp_number", WHATSAPP_NUMBER),
    ]
    for setting in settings:
        execute(
            conn,
            """
            INSERT INTO settings (key, value)
            VALUES (?, ?)
            ON CONFLICT(key) DO NOTHING
            """,
            setting,
        )
    sync_catalog_services(conn)
    conn.commit()
    conn.close()


def public_services():
    conn = db()
    rows = execute(conn, "SELECT * FROM services WHERE active = 1 ORDER BY id").fetchall()
    conn.close()
    services = rows_dict(rows)
    for service in services:
        service["price_label"] = price_label(service["price_cents"])
    return services


def setting_value(conn, key, default=""):
    row = execute(conn, "SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
    return row["value"] if row else default


def set_setting_value(conn, key, value):
    execute(
        conn,
        """
        INSERT INTO settings (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        """,
        (key, value),
    )


def catalog_overrides(conn):
    raw_value = setting_value(conn, "catalog_overrides", "{}")
    try:
        value = json.loads(raw_value)
    except json.JSONDecodeError:
        return {}
    return value if isinstance(value, dict) else {}


def price_cents_from_label(value):
    text = str(value or "")
    normalized = re.sub(r"[^\d,\.]", "", text).replace(".", "").replace(",", ".")
    if not normalized:
        return None
    try:
        return int(round(float(normalized) * 100))
    except ValueError:
        return None


def public_catalog():
    conn = db()
    services = {
        row["catalog_key"]: dict(row)
        for row in execute(
            conn,
            "SELECT * FROM services WHERE active = 1 AND catalog_key IS NOT NULL ORDER BY id",
        ).fetchall()
    }
    overrides = catalog_overrides(conn)
    conn.close()

    catalog = []
    for default in CATALOG_DEFAULTS:
        item = dict(default)
        service = services.get(item["key"]) if item.get("bookable", True) else None
        if service:
            item.update(
                {
                    "service_id": service["id"],
                    "name": service["name"],
                    "price_label": price_label(service["price_cents"]),
                    "duration_label": f"{service['duration_minutes']} min",
                    "description": service["description"],
                    "price_cents": service["price_cents"],
                }
            )
        custom = overrides.get(item["key"], {})
        if isinstance(custom, dict):
            item.update(
                {
                    key: value
                    for key, value in custom.items()
                    if key in ["name", "price_label", "duration_label", "image", "icon"]
                }
            )
        item.setdefault("bookable", True)
        catalog.append(item)
    return catalog


def admin_services():
    conn = db()
    rows = execute(conn, "SELECT * FROM services ORDER BY id").fetchall()
    conn.close()
    services = rows_dict(rows)
    for service in services:
        service["price_label"] = price_label(service["price_cents"])
    return services


def clients_summary():
    conn = db()
    rows = execute(
        conn,
        """
        SELECT
            c.id, c.name, c.phone, c.neighborhood, c.created_at,
            COUNT(a.id) AS visits,
            MAX(a.appointment_date) AS last_visit
        FROM clients c
        LEFT JOIN appointments a ON a.client_id = c.id
        GROUP BY c.id, c.name, c.phone, c.neighborhood, c.created_at
        ORDER BY c.name
        """,
    ).fetchall()
    conn.close()
    return rows_dict(rows)


def dashboard_summary():
    today = dt.date.today().isoformat()
    week_end = (dt.date.today() + dt.timedelta(days=7)).isoformat()
    conn = db()
    today_total = execute(
        conn,
        "SELECT COUNT(*) AS total FROM appointments WHERE appointment_date = ? AND status != 'Cancelado'",
        (today,),
    ).fetchone()["total"]
    week_total = execute(
        conn,
        """
        SELECT COUNT(*) AS total FROM appointments
        WHERE appointment_date >= ? AND appointment_date <= ? AND status != 'Cancelado'
        """,
        (today, week_end),
    ).fetchone()["total"]
    next_row = execute(
        conn,
        """
        SELECT a.appointment_date, a.appointment_time, c.name AS client_name, s.name AS service_name
        FROM appointments a
        JOIN clients c ON c.id = a.client_id
        JOIN services s ON s.id = a.service_id
        WHERE a.status != 'Cancelado'
          AND (a.appointment_date > ? OR (a.appointment_date = ? AND a.appointment_time >= ?))
        ORDER BY a.appointment_date, a.appointment_time
        LIMIT 1
        """,
        (today, today, dt.datetime.now().strftime("%H:%M")),
    ).fetchone()
    forecast = execute(
        conn,
        """
        SELECT COALESCE(SUM(s.price_cents), 0) AS total
        FROM appointments a
        JOIN services s ON s.id = a.service_id
        WHERE a.appointment_date >= ? AND a.appointment_date <= ? AND a.status != 'Cancelado'
        """,
        (today, week_end),
    ).fetchone()["total"]
    conn.close()
    return {
        "appointments_today": today_total,
        "appointments_week": week_total,
        "forecast_week_cents": forecast,
        "forecast_week_label": price_label(forecast),
        "next_appointment": row_dict(next_row),
    }


def parse_json(handler):
    length = int(handler.headers.get("content-length", 0))
    if length == 0:
        return {}
    return json.loads(handler.rfile.read(length).decode("utf-8"))


def parse_multipart_upload(handler):
    content_type = handler.headers.get("Content-Type", "")
    if "multipart/form-data" not in content_type or "boundary=" not in content_type:
        raise ValueError("Envie uma imagem válida.")

    length = int(handler.headers.get("content-length", 0))
    if length <= 0 or length > MAX_GALLERY_UPLOAD_BYTES:
        raise ValueError("A imagem deve ter até 8 MB.")

    boundary = content_type.split("boundary=", 1)[1].strip().strip('"')
    delimiter = f"--{boundary}".encode("utf-8")
    body = handler.rfile.read(length)
    fields = {}
    files = {}

    for part in body.split(delimiter):
        part = part.strip(b"\r\n")
        if not part or part == b"--" or b"\r\n\r\n" not in part:
            continue
        raw_headers, content = part.split(b"\r\n\r\n", 1)
        content = content.rstrip(b"\r\n")
        headers = raw_headers.decode("utf-8", errors="ignore").split("\r\n")
        disposition = next((header for header in headers if header.lower().startswith("content-disposition:")), "")
        content_type_header = next((header for header in headers if header.lower().startswith("content-type:")), "")
        name_match = re.search(r'name="([^"]+)"', disposition)
        if not name_match:
            continue
        name = name_match.group(1)
        filename_match = re.search(r'filename="([^"]*)"', disposition)
        if filename_match:
            files[name] = {
                "filename": filename_match.group(1),
                "content_type": content_type_header.split(":", 1)[1].strip().lower() if ":" in content_type_header else "",
                "content": content,
            }
        else:
            fields[name] = content.decode("utf-8", errors="ignore")
    return fields, files


def image_extension(upload):
    content = upload["content"]
    content_type = upload["content_type"]
    if content_type == "image/jpeg" or content.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if content_type == "image/png" or content.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if content_type == "image/webp" or content.startswith(b"RIFF") and content[8:12] == b"WEBP":
        return ".webp"
    return ""


def image_data_url(upload, extension):
    mime_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }
    encoded = base64.b64encode(upload["content"]).decode("ascii")
    return f"data:{mime_types[extension]};base64,{encoded}"


def service_image_path(item_key, extension):
    safe_key = re.sub(r"[^a-z0-9-]", "", item_key.lower())
    return SERVICES_DIR / f"{safe_key}{extension}"


def phone_digits(value):
    return re.sub(r"\D", "", str(value or ""))


def valid_phone(value):
    digits = phone_digits(value)
    return 10 <= len(digits) <= 13


def parse_date(value):
    try:
        return dt.date.fromisoformat(str(value))
    except ValueError:
        return None


def is_past_date(value):
    parsed = parse_date(value)
    return parsed is not None and parsed < dt.date.today()


def sign(value):
    digest = hmac.new(SECRET_KEY.encode(), value.encode(), hashlib.sha256).hexdigest()
    return f"{value}.{digest}"


def verify(signed):
    if not signed or "." not in signed:
        return False
    value, digest = signed.rsplit(".", 1)
    expected = hmac.new(SECRET_KEY.encode(), value.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(digest, expected)


def price_label(cents):
    formatted = f"{cents / 100:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"R$ {formatted}"


def to_minutes(value):
    hour, minute = [int(part) for part in value.split(":")]
    return hour * 60 + minute


def to_time(value):
    return f"{value // 60:02d}:{value % 60:02d}"


def weekday_for(date_value):
    return dt.date.fromisoformat(date_value).weekday()


def slots_for(date_value, service_id=None):
    if not parse_date(date_value):
        return []

    conn = db()
    blocked = execute(
        conn,
        "SELECT 1 FROM blocked_days WHERE block_date = ?", (date_value,)
    ).fetchone()
    if blocked:
        conn.close()
        return []

    service = None
    if service_id:
        service = execute(
            conn,
            "SELECT duration_minutes FROM services WHERE id = ? AND active = 1", (service_id,)
        ).fetchone()
    duration = service["duration_minutes"] if service else 90

    ranges = execute(
        conn,
        """
        SELECT start_time, end_time, slot_minutes
        FROM weekly_hours
        WHERE weekday = ? AND active = 1
        ORDER BY start_time
        """,
        (weekday_for(date_value),),
    ).fetchall()

    slots = []
    for range_row in ranges:
        start = to_minutes(range_row["start_time"])
        end = to_minutes(range_row["end_time"])
        step = range_row["slot_minutes"]
        current = start
        while current + duration <= end:
            slots.append(to_time(current))
            current += step

    extra = execute(
        conn,
        "SELECT slot_time FROM extra_slots WHERE slot_date = ?", (date_value,)
    ).fetchall()
    slots.extend([row["slot_time"] for row in extra])

    taken = execute(
        conn,
        """
        SELECT appointment_time FROM appointments
        WHERE appointment_date = ? AND status != 'Cancelado'
        """,
        (date_value,),
    ).fetchall()
    taken_values = {row["appointment_time"] for row in taken}
    conn.close()
    return sorted(slot for slot in set(slots) if slot not in taken_values)


def appointment_payload(appointment_id):
    conn = db()
    row = execute(
        conn,
        """
        SELECT
            a.id, a.appointment_date, a.appointment_time, a.notes, a.status,
            c.name AS client_name, c.phone AS client_phone, c.neighborhood AS client_neighborhood,
            s.name AS service_name, s.price_cents, s.duration_minutes
        FROM appointments a
        JOIN clients c ON c.id = a.client_id
        JOIN services s ON s.id = a.service_id
        WHERE a.id = ?
        """,
        (appointment_id,),
    ).fetchone()
    conn.close()
    data = row_dict(row)
    if not data:
        return None
    message = (
        "Olá, Letícia! Acabei de solicitar um agendamento.\n\n"
        f"Serviço: {data['service_name']}\n"
        f"Data: {data['appointment_date']}\n"
        f"Horário: {data['appointment_time']}\n"
        f"Nome: {data['client_name']}\n"
        f"Telefone: {data['client_phone']}\n\n"
        "Aguardo confirmação. 💅✨"
    )
    data["whatsapp_url"] = f"https://wa.me/{WHATSAPP_NUMBER}?text={quote(message)}"
    data["price_label"] = price_label(data["price_cents"])
    return data


def client_appointments(phone):
    conn = db()
    rows = execute(
        conn,
        """
        SELECT
            a.id, a.appointment_date, a.appointment_time, a.notes, a.status,
            c.name AS client_name, c.phone AS client_phone, c.neighborhood AS client_neighborhood,
            s.name AS service_name,
            rr.id AS reschedule_request_id,
            rr.requested_date,
            rr.requested_time,
            rr.message AS reschedule_message,
            rr.status AS reschedule_status
        FROM appointments a
        JOIN clients c ON c.id = a.client_id
        JOIN services s ON s.id = a.service_id
        LEFT JOIN reschedule_requests rr ON rr.id = (
            SELECT id FROM reschedule_requests
            WHERE appointment_id = a.id
            ORDER BY created_at DESC
            LIMIT 1
        )
        WHERE c.phone = ?
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
        """,
        (phone,),
    ).fetchall()
    conn.close()
    return rows_dict(rows)


class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        parsed = urlparse(path)
        clean_path = parsed.path
        if clean_path == "/admin":
            clean_path = "/admin.html"
        if clean_path == "/":
            clean_path = "/index.html"
        resolved = (PUBLIC / clean_path.lstrip("/")).resolve()
        if PUBLIC.resolve() not in [resolved, *resolved.parents]:
            return str(PUBLIC / "404")
        return str(resolved)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/"):
            return self.route_get(parsed)
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/"):
            return self.route_post(parsed)
        self.send_error(404)

    def do_PATCH(self):
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/"):
            return self.route_patch(parsed)
        self.send_error(404)

    def do_DELETE(self):
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/"):
            return self.route_delete(parsed)
        self.send_error(404)

    def json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def bad(self, message, status=400):
        self.json({"error": message}, status)

    def authed(self):
        jar = cookies.SimpleCookie(self.headers.get("Cookie", ""))
        morsel = jar.get("studio_lr_session")
        return verify(morsel.value if morsel else "")

    def require_auth(self):
        if self.authed():
            return True
        self.bad("Login necessário.", 401)
        return False

    def route_get(self, parsed):
        if parsed.path.startswith("/api/public/") or parsed.path in [
            "/api/health",
            "/api/config",
            "/api/services",
            "/api/availability",
            "/api/gallery",
            "/api/reviews",
            "/api/catalog",
            "/api/client-appointments",
        ]:
            return self.route_public_get(parsed)
        if parsed.path.startswith("/api/admin/"):
            return self.route_admin_get(parsed)
        self.send_error(404)

    def route_public_get(self, parsed):
        query = parse_qs(parsed.query)
        if parsed.path == "/api/health":
            return self.json({"ok": True, "app_env": APP_ENV, "database": database.kind})
        if parsed.path in ["/api/config", "/api/public/config"]:
            return self.json(
                    {
                        "whatsapp_number": WHATSAPP_NUMBER,
                        "instagram_url": INSTAGRAM_URL,
                    }
                )
        if parsed.path in ["/api/services", "/api/public/services"]:
            return self.json({"services": public_services()})
        if parsed.path in ["/api/catalog", "/api/public/catalog"]:
            return self.json({"catalog": public_catalog()})
        if parsed.path in ["/api/client-appointments", "/api/public/client-appointments"]:
            phone = phone_digits(query.get("phone", [""])[0])
            if not valid_phone(phone):
                return self.bad("Informe um WhatsApp válido com DDD.")
            return self.json({"appointments": client_appointments(phone)})
        if parsed.path in ["/api/availability", "/api/public/availability"]:
            date_value = query.get("date", [""])[0]
            service_id = query.get("service_id", [""])[0] or None
            if not date_value:
                return self.bad("Informe a data.")
            if not parse_date(date_value):
                return self.bad("Informe uma data válida.")
            if is_past_date(date_value):
                return self.json({"slots": []})
            return self.json({"slots": slots_for(date_value, service_id)})
        if parsed.path in ["/api/gallery", "/api/public/gallery"]:
            return self.json({"gallery": public_gallery()})
        if parsed.path in ["/api/reviews", "/api/public/reviews"]:
            return self.json(
                {
                    "summary": {
                        "rating": 5.0,
                        "label": "5.0 no Google",
                        "note": "Mais de 15 avaliações 5 estrelas de clientes reais.",
                    },
                    "reviews": PUBLIC_REVIEWS,
                }
            )
        self.send_error(404)

    def route_admin_get(self, parsed):
        query = parse_qs(parsed.query)
        if parsed.path == "/api/admin/session":
            return self.json({"authenticated": self.authed()})
        if not self.require_auth():
            return
        conn = db()
        try:
            if parsed.path == "/api/admin/dashboard":
                return self.json({"dashboard": dashboard_summary()})
            if parsed.path == "/api/admin/services":
                return self.json({"services": admin_services()})
            if parsed.path == "/api/admin/catalog":
                return self.json({"catalog": public_catalog()})
            if parsed.path == "/api/admin/clients":
                return self.json({"clients": clients_summary()})
            if parsed.path == "/api/admin/finance":
                return self.json(
                    {
                        "finance": {
                            "daily_revenue_cents": 0,
                            "weekly_revenue_cents": dashboard_summary()["forecast_week_cents"],
                            "monthly_revenue_cents": 0,
                            "expenses_cents": 0,
                            "estimated_profit_cents": 0,
                            "status": "prepared",
                        }
                    }
                )
            if parsed.path == "/api/admin/gallery":
                return self.json({"gallery": [{**item, "featured": item["index"] == 1} for item in public_gallery()]})
            if parsed.path == "/api/admin/appointments":
                date_value = query.get("date", [dt.date.today().isoformat()])[0]
                rows = execute(
                    conn,
                    """
                    SELECT
                        a.id, a.appointment_date, a.appointment_time, a.notes, a.status,
                        c.name AS client_name, c.phone AS client_phone, c.neighborhood AS client_neighborhood,
                        s.name AS service_name,
                        rr.id AS reschedule_request_id,
                        rr.requested_date,
                        rr.requested_time,
                        rr.message AS reschedule_message,
                        rr.status AS reschedule_status
                    FROM appointments a
                    JOIN clients c ON c.id = a.client_id
                    JOIN services s ON s.id = a.service_id
                    LEFT JOIN reschedule_requests rr ON rr.id = (
                        SELECT id FROM reschedule_requests
                        WHERE appointment_id = a.id
                        ORDER BY created_at DESC
                        LIMIT 1
                    )
                    WHERE a.appointment_date = ?
                    ORDER BY a.appointment_time
                    """,
                    (date_value,),
                ).fetchall()
                return self.json({"appointments": rows_dict(rows)})
            if parsed.path == "/api/admin/settings":
                hours = rows_dict(
                    execute(
                        conn,
                        "SELECT * FROM weekly_hours ORDER BY weekday, start_time",
                    ).fetchall()
                )
                blocked = rows_dict(
                    execute(conn, "SELECT * FROM blocked_days ORDER BY block_date").fetchall()
                )
                extras = rows_dict(
                    execute(conn, "SELECT * FROM extra_slots ORDER BY slot_date, slot_time").fetchall()
                )
                return self.json({"hours": hours, "blocked_days": blocked, "extra_slots": extras})
            if parsed.path == "/api/admin/config":
                return self.json(
                    {
                        "config": {
                            "app_env": APP_ENV,
                            "database": database.kind,
                            "whatsapp_configured": bool(WHATSAPP_NUMBER),
                            "admin_password_configured": bool(ADMIN_PASSWORD),
                        }
                    }
                )
            self.send_error(404)
        finally:
            conn.close()

    def route_post(self, parsed):
        if parsed.path in ["/api/appointments", "/api/public/appointments"]:
            return self.route_public_post(parsed)
        if parsed.path in ["/api/reschedule-requests", "/api/public/reschedule-requests"]:
            return self.route_public_post(parsed)
        if parsed.path.startswith("/api/admin/"):
            return self.route_admin_post(parsed)
        self.send_error(404)

    def route_public_post(self, parsed):
        try:
            payload = parse_json(self)
        except json.JSONDecodeError:
            return self.bad("JSON inválido.")

        if parsed.path in ["/api/appointments", "/api/public/appointments"]:
            required = ["service_id", "date", "time", "name", "phone"]
            if any(not str(payload.get(field, "")).strip() for field in required):
                return self.bad("Preencha serviço, data, horário, nome e telefone.")

            try:
                service_id = int(payload["service_id"])
            except (TypeError, ValueError):
                return self.bad("Serviço inválido.")

            client_name = str(payload["name"]).strip()
            phone = phone_digits(payload["phone"])
            neighborhood = str(payload.get("neighborhood", "")).strip()
            date_value = str(payload["date"]).strip()
            time_value = str(payload["time"]).strip()
            notes = str(payload.get("notes", "")).strip()

            if not client_name:
                return self.bad("Informe seu nome.")
            if not valid_phone(phone):
                return self.bad("Informe um WhatsApp válido com DDD.")
            if not neighborhood:
                return self.bad("Informe seu bairro.")
            if not parse_date(date_value):
                return self.bad("Informe uma data válida.")
            if is_past_date(date_value):
                return self.bad("Escolha uma data atual ou futura.")

            service_check = None
            conn = db()
            try:
                service_check = execute(
                    conn,
                    "SELECT id FROM services WHERE id = ? AND active = 1",
                    (service_id,),
                ).fetchone()
            finally:
                conn.close()
            if not service_check:
                return self.bad("Serviço inválido.")

            if time_value not in slots_for(date_value, service_id):
                return self.bad("Esse horário não está mais disponível.", 409)

            conn = db()
            try:
                execute(
                    conn,
                    """
                    INSERT INTO clients (name, phone)
                    VALUES (?, ?)
                    ON CONFLICT(phone) DO UPDATE SET name = excluded.name
                    """,
                    (client_name, phone),
                )
                execute(
                    conn,
                    "UPDATE clients SET neighborhood = ? WHERE phone = ?",
                    (neighborhood, phone),
                )
                client_id = execute(
                    conn,
                    "SELECT id FROM clients WHERE phone = ?", (phone,)
                ).fetchone()["id"]
                appointment_params = (
                    service_id,
                    client_id,
                    date_value,
                    time_value,
                    notes,
                )
                if database.kind == "postgres":
                    cursor = execute(
                        conn,
                        """
                        INSERT INTO appointments
                            (service_id, client_id, appointment_date, appointment_time, notes)
                        VALUES (?, ?, ?, ?, ?)
                        RETURNING id
                        """,
                        appointment_params,
                    )
                    appointment_id = cursor.fetchone()["id"]
                else:
                    cursor = execute(
                        conn,
                        """
                        INSERT INTO appointments
                            (service_id, client_id, appointment_date, appointment_time, notes)
                        VALUES (?, ?, ?, ?, ?)
                        """,
                        appointment_params,
                    )
                    appointment_id = cursor.lastrowid
                conn.commit()
                return self.json({"appointment": appointment_payload(appointment_id)}, 201)
            except Exception as exc:
                if exc.__class__.__name__ not in ["IntegrityError", "UniqueViolation"]:
                    raise
                return self.bad("Esse horário acabou de ser reservado.", 409)
            finally:
                conn.close()

        if parsed.path in ["/api/reschedule-requests", "/api/public/reschedule-requests"]:
            try:
                appointment_id = int(payload.get("appointment_id", "0"))
            except (TypeError, ValueError):
                return self.bad("Agendamento inválido.")
            phone = phone_digits(payload.get("phone", ""))
            requested_date = str(payload.get("requested_date", "")).strip()
            requested_time = str(payload.get("requested_time", "")).strip()
            message = str(payload.get("message", "")).strip()

            if not valid_phone(phone):
                return self.bad("Informe um WhatsApp válido com DDD.")
            if not requested_date and not requested_time and not message:
                return self.bad("Informe uma sugestão de data, horário ou observação.")
            if requested_date and not parse_date(requested_date):
                return self.bad("Informe uma data válida.")

            conn = db()
            try:
                current = execute(
                    conn,
                    """
                    SELECT a.id, a.client_id
                    FROM appointments a
                    JOIN clients c ON c.id = a.client_id
                    WHERE a.id = ? AND c.phone = ? AND a.status IN ('Pendente', 'Confirmado')
                    """,
                    (appointment_id, phone),
                ).fetchone()
                if not current:
                    return self.bad("Agendamento não encontrado para esse WhatsApp.", 404)
                execute(
                    conn,
                    """
                    INSERT INTO reschedule_requests
                        (appointment_id, client_id, requested_date, requested_time, message)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (appointment_id, current["client_id"], requested_date, requested_time, message),
                )
                conn.commit()
                return self.json({"ok": True}, 201)
            finally:
                conn.close()

        self.send_error(404)

    def route_admin_post(self, parsed):
        parts = parsed.path.strip("/").split("/")
        if len(parts) == 5 and parts[:4] == ["api", "admin", "catalog", "photo"]:
            if not self.require_auth():
                return
            item_key = parts[4]
            default = next((item for item in CATALOG_DEFAULTS if item["key"] == item_key), None)
            if not default:
                return self.bad("Item do catálogo não encontrado.", 404)
            try:
                fields, files = parse_multipart_upload(self)
            except ValueError:
                return self.bad("Não foi possível ler a imagem enviada.")

            upload = files.get("photo")
            if not upload or not upload["content"]:
                return self.bad("Escolha uma imagem para enviar.")
            extension = image_extension(upload)
            if extension not in GALLERY_EXTENSIONS:
                return self.bad("Use uma imagem JPG, PNG ou WebP.")
            if len(upload["content"]) > MAX_GALLERY_UPLOAD_BYTES:
                return self.bad("A imagem deve ter até 8 MB.")

            if database.kind == "postgres" or APP_ENV == "production":
                image_value = image_data_url(upload, extension)
            else:
                SERVICES_DIR.mkdir(parents=True, exist_ok=True)
                for old_extension in GALLERY_EXTENSIONS:
                    old_path = service_image_path(item_key, old_extension)
                    if old_path.exists():
                        old_path.unlink()
                target = service_image_path(item_key, extension)
                target.write_bytes(upload["content"])
                image_value = asset_url(target)

            conn = db()
            try:
                overrides = catalog_overrides(conn)
                current = overrides.get(item_key, {}) if isinstance(overrides.get(item_key), dict) else {}
                current.update({"image": image_value, "icon": ""})
                overrides[item_key] = current
                set_setting_value(conn, "catalog_overrides", json.dumps(overrides, ensure_ascii=False))
                conn.commit()
                updated = next((item for item in public_catalog() if item["key"] == item_key), None)
                return self.json({"ok": True, "item": updated})
            finally:
                conn.close()

        if parsed.path == "/api/admin/gallery":
            if not self.require_auth():
                return
            try:
                fields, files = parse_multipart_upload(self)
                index = int(fields.get("index", "0"))
            except (ValueError, TypeError):
                return self.bad("Não foi possível ler a imagem enviada.")

            if index < 1 or index > 18:
                return self.bad("Foto inválida.")
            upload = files.get("photo")
            if not upload or not upload["content"]:
                return self.bad("Escolha uma imagem para enviar.")
            extension = image_extension(upload)
            if extension not in GALLERY_EXTENSIONS:
                return self.bad("Use uma imagem JPG, PNG ou WebP.")
            if len(upload["content"]) > MAX_GALLERY_UPLOAD_BYTES:
                return self.bad("A imagem deve ter até 8 MB.")

            GALLERY_DIR.mkdir(parents=True, exist_ok=True)
            for old_extension in GALLERY_EXTENSIONS:
                old_path = GALLERY_DIR / f"galeria-{index:02d}{old_extension}"
                if old_path.exists():
                    old_path.unlink()
            target = GALLERY_DIR / f"galeria-{index:02d}{extension}"
            target.write_bytes(upload["content"])
            item = public_gallery()[index - 1]
            return self.json({"ok": True, "photo": item})

        try:
            payload = parse_json(self)
        except json.JSONDecodeError:
            return self.bad("JSON inválido.")
        if parsed.path == "/api/admin/login":
            password = str(payload.get("password", ""))
            if not hmac.compare_digest(password, ADMIN_PASSWORD):
                return self.bad("Senha incorreta.", 401)
            session_value = sign(secrets.token_urlsafe(24))
            body = json.dumps({"ok": True}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Set-Cookie", f"studio_lr_session={session_value}; HttpOnly; Path=/; SameSite=Lax")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if parsed.path == "/api/admin/logout":
            body = json.dumps({"ok": True}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Set-Cookie", "studio_lr_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if parsed.path == "/api/admin/blocked-days":
            if not self.require_auth():
                return
            date_value = payload.get("date", "")
            if not date_value:
                return self.bad("Informe a data.")
            conn = db()
            execute(
                conn,
                """
                INSERT INTO blocked_days (block_date, reason)
                VALUES (?, ?)
                ON CONFLICT(block_date) DO NOTHING
                """,
                (date_value, payload.get("reason", "").strip()),
            )
            conn.commit()
            conn.close()
            return self.json({"ok": True}, 201)

        if parsed.path == "/api/admin/extra-slots":
            if not self.require_auth():
                return
            date_value = payload.get("date", "")
            time_value = payload.get("time", "")
            if not date_value or not time_value:
                return self.bad("Informe data e horário.")
            conn = db()
            execute(
                conn,
                """
                INSERT INTO extra_slots (slot_date, slot_time, note)
                VALUES (?, ?, ?)
                ON CONFLICT(slot_date, slot_time) DO NOTHING
                """,
                (date_value, time_value, payload.get("note", "").strip()),
            )
            conn.commit()
            conn.close()
            return self.json({"ok": True}, 201)

        self.send_error(404)

    def route_patch(self, parsed):
        if not self.require_auth():
            return
        try:
            payload = parse_json(self)
        except json.JSONDecodeError:
            return self.bad("JSON inválido.")
        parts = parsed.path.strip("/").split("/")
        if len(parts) == 4 and parts[:3] == ["api", "admin", "catalog"]:
            item_key = parts[3]
            default = next((item for item in CATALOG_DEFAULTS if item["key"] == item_key), None)
            if not default:
                return self.bad("Item do catálogo não encontrado.", 404)

            name = str(payload.get("name", "")).strip()
            price_label_value = str(payload.get("price_label", "")).strip()
            duration_label_value = str(payload.get("duration_label", "")).strip()
            if not name:
                return self.bad("Informe o nome do serviço.")
            if not price_label_value:
                return self.bad("Informe o valor do serviço.")
            if not duration_label_value:
                return self.bad("Informe o tempo de duração.")

            conn = db()
            try:
                if default.get("bookable", True):
                    price_cents = price_cents_from_label(price_label_value)
                    if price_cents is None:
                        return self.bad("Informe um valor válido. Exemplo: R$ 90.")
                    duration_match = re.search(r"\d+", duration_label_value)
                    if not duration_match:
                        return self.bad("Informe a duração em minutos. Exemplo: 90 min.")
                    duration_minutes = int(duration_match.group(0))
                    if duration_minutes < 15 or duration_minutes > 480:
                        return self.bad("Informe uma duração entre 15 e 480 minutos.")
                    execute(
                        conn,
                        """
                        UPDATE services
                        SET name = ?, price_cents = ?, duration_minutes = ?
                        WHERE catalog_key = ?
                        """,
                        (name, price_cents, duration_minutes, item_key),
                    )
                else:
                    overrides = catalog_overrides(conn)
                    current = overrides.get(item_key, {}) if isinstance(overrides.get(item_key), dict) else {}
                    current.update(
                        {
                            "name": name,
                            "price_label": price_label_value,
                            "duration_label": duration_label_value,
                        }
                    )
                    overrides[item_key] = current
                    set_setting_value(conn, "catalog_overrides", json.dumps(overrides, ensure_ascii=False))
                conn.commit()
                updated = next((item for item in public_catalog() if item["key"] == item_key), None)
                return self.json({"item": updated})
            except Exception as exc:
                if exc.__class__.__name__ not in ["IntegrityError", "UniqueViolation"]:
                    raise
                return self.bad("Já existe um serviço com esse nome.", 409)
            finally:
                conn.close()

        if len(parts) == 4 and parts[:3] == ["api", "admin", "services"]:
            try:
                service_id = int(parts[3])
                name = str(payload.get("name", "")).strip()
                price_cents = int(payload.get("price_cents", -1))
            except (TypeError, ValueError):
                return self.bad("Dados do serviço inválidos.")

            if not name:
                return self.bad("Informe o nome do serviço.")
            if price_cents < 0:
                return self.bad("Informe um valor válido.")

            conn = db()
            try:
                current = execute(
                    conn,
                    "SELECT id FROM services WHERE id = ?",
                    (service_id,),
                ).fetchone()
                if not current:
                    return self.bad("Serviço não encontrado.", 404)
                execute(
                    conn,
                    """
                    UPDATE services
                    SET name = ?, price_cents = ?
                    WHERE id = ?
                    """,
                    (name, price_cents, service_id),
                )
                conn.commit()
                updated = execute(
                    conn,
                    "SELECT * FROM services WHERE id = ?",
                    (service_id,),
                ).fetchone()
                service = row_dict(updated)
                service["price_label"] = price_label(service["price_cents"])
                return self.json({"service": service})
            except Exception as exc:
                if exc.__class__.__name__ not in ["IntegrityError", "UniqueViolation"]:
                    raise
                return self.bad("Já existe um serviço com esse nome.", 409)
            finally:
                conn.close()

        if len(parts) == 4 and parts[:3] == ["api", "admin", "appointments"]:
            appointment_id = int(parts[3])
            conn = db()
            try:
                if "status" in payload:
                    status = payload["status"]
                    if status not in ["Pendente", "Confirmado", "Cancelado", "Concluído"]:
                        return self.bad("Status inválido.")
                    execute(
                        conn,
                        "UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                        (status, appointment_id),
                    )
                if "date" in payload and "time" in payload:
                    date_value = payload["date"]
                    time_value = payload["time"]
                    current = execute(
                        conn,
                        "SELECT service_id FROM appointments WHERE id = ?", (appointment_id,)
                    ).fetchone()
                    if not current:
                        return self.bad("Agendamento não encontrado.", 404)
                    available = slots_for(date_value, current["service_id"])
                    original = execute(
                        conn,
                        "SELECT appointment_date, appointment_time FROM appointments WHERE id = ?",
                        (appointment_id,),
                    ).fetchone()
                    same_slot = (
                        original["appointment_date"] == date_value
                        and original["appointment_time"] == time_value
                    )
                    if not same_slot and time_value not in available:
                        return self.bad("Novo horário indisponível.", 409)
                    execute(
                        conn,
                        """
                        UPDATE appointments
                        SET appointment_date = ?, appointment_time = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                        """,
                        (date_value, time_value, appointment_id),
                    )
                conn.commit()
                return self.json({"appointment": appointment_payload(appointment_id)})
            except Exception as exc:
                if exc.__class__.__name__ not in ["IntegrityError", "UniqueViolation"]:
                    raise
                return self.bad("Horário já ocupado.", 409)
            finally:
                conn.close()
        self.send_error(404)

    def route_delete(self, parsed):
        if not self.require_auth():
            return
        parts = parsed.path.strip("/").split("/")
        conn = db()
        try:
            if len(parts) == 4 and parts[:3] == ["api", "admin", "blocked-days"]:
                execute(conn, "DELETE FROM blocked_days WHERE id = ?", (int(parts[3]),))
                conn.commit()
                return self.json({"ok": True})
            if len(parts) == 4 and parts[:3] == ["api", "admin", "extra-slots"]:
                execute(conn, "DELETE FROM extra_slots WHERE id = ?", (int(parts[3]),))
                conn.commit()
                return self.json({"ok": True})
            self.send_error(404)
        finally:
            conn.close()


if __name__ == "__main__":
    validate_config()
    init_db()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Studio LR rodando em http://{HOST}:{PORT}")
    server.serve_forever()

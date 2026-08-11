-- Studio LR — Body Piercing
-- Migração PostgreSQL/Supabase aditiva e não destrutiva.
-- Revisar e executar manualmente no ambiente de produção antes do deploy.

BEGIN;

ALTER TABLE services
    ADD COLUMN IF NOT EXISTS minor_policy TEXT NOT NULL DEFAULT 'not_applicable',
    ADD COLUMN IF NOT EXISTS aftercare_category TEXT NOT NULL DEFAULT '';

ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS birth_date TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS piercing_consents (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER NOT NULL UNIQUE REFERENCES appointments(id),
    client_id INTEGER NOT NULL REFERENCES clients(id),
    client_name TEXT NOT NULL,
    client_birth_date TEXT NOT NULL,
    client_age INTEGER NOT NULL,
    is_minor INTEGER NOT NULL DEFAULT 0,
    service_id INTEGER NOT NULL REFERENCES services(id),
    service_name TEXT NOT NULL,
    service_key TEXT NOT NULL,
    term_version TEXT NOT NULL,
    term_content TEXT NOT NULL,
    term_hash TEXT NOT NULL,
    minor_policy_version TEXT NOT NULL DEFAULT '',
    minor_policy_content TEXT NOT NULL DEFAULT '',
    guardian_name TEXT NOT NULL DEFAULT '',
    guardian_cpf TEXT NOT NULL DEFAULT '',
    guardian_birth_date TEXT NOT NULL DEFAULT '',
    guardian_phone TEXT NOT NULL DEFAULT '',
    guardian_relationship TEXT NOT NULL DEFAULT '',
    accepted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'Aceito',
    ip_address TEXT NOT NULL DEFAULT '',
    user_agent TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_piercing_consents_client_id
    ON piercing_consents(client_id);

CREATE INDEX IF NOT EXISTS idx_piercing_consents_service_id
    ON piercing_consents(service_id);

CREATE INDEX IF NOT EXISTS idx_piercing_consents_accepted_at
    ON piercing_consents(accepted_at);

COMMIT;

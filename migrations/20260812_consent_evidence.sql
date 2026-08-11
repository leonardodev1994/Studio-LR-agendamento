-- Studio LR — comprovante de consentimento e acesso simples da cliente.
-- Migração PostgreSQL/Supabase aditiva e não destrutiva.
-- Revisar e executar manualmente no ambiente de produção antes do deploy.

BEGIN;

ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS portal_token_hash TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS portal_token_created_at TIMESTAMP;

ALTER TABLE piercing_consents
    ADD COLUMN IF NOT EXISTS receipt_code TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS term_accepted BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS truth_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS anatomy_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS guardian_authorization BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS acceptance_method TEXT NOT NULL DEFAULT 'web_checkbox',
    ADD COLUMN IF NOT EXISTS evidence_payload TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS evidence_hash TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS evidence_signature TEXT NOT NULL DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_piercing_consents_receipt_code
    ON piercing_consents(receipt_code)
    WHERE receipt_code <> '';

COMMIT;

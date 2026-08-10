#!/usr/bin/env python3
"""
Migra dados de SQLite3 local para Supabase PostgreSQL.
Execute com: python3 migrate_to_supabase.py
"""
import os
import sys
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
os.chdir(ROOT)

from server import load_env, DATABASE_URL, database, db, execute, DB_PATH

load_env()

if not DATABASE_URL:
    print("❌ DATABASE_URL não configurada!")
    sys.exit(1)

if not DB_PATH.exists():
    print("⚠️  Nenhum banco SQLite local encontrado. Nada para migrar.")
    sys.exit(0)

print("=" * 60)
print("MIGRAÇÃO: SQLite → Supabase")
print("=" * 60)

# Conecta ao SQLite local
sqlite_conn = sqlite3.connect(DB_PATH)
sqlite_conn.row_factory = sqlite3.Row
sqlite_cursor = sqlite_conn.cursor()

# Conecta ao Supabase
pg_conn = db()

# Tabelas a migrar (ordem importa: clientes antes de agendamentos)
tables_to_migrate = [
    "clients",
    "appointments", 
    "reschedule_requests"
]

print("\n📊 Contando registros no SQLite:")
for table in tables_to_migrate:
    sqlite_cursor.execute(f"SELECT COUNT(*) as cnt FROM {table}")
    count = sqlite_cursor.fetchone()["cnt"]
    if count > 0:
        print(f"  {table}: {count} registros")

print("\n🔄 Iniciando migração...")

for table in tables_to_migrate:
    sqlite_cursor.execute(f"SELECT COUNT(*) as cnt FROM {table}")
    count = sqlite_cursor.fetchone()["cnt"]
    
    if count == 0:
        print(f"  ⏭️  {table}: vazio, pulando...")
        continue
    
    print(f"  📤 {table}: copiando {count} registros...", end=" ", flush=True)
    
    # Busca dados do SQLite
    sqlite_cursor.execute(f"SELECT * FROM {table}")
    rows = sqlite_cursor.fetchall()
    
    # Insere no PostgreSQL
    if rows:
        columns = [desc[0] for desc in sqlite_cursor.description]
        placeholders = ", ".join(["%s"] * len(columns))
        col_names = ", ".join(columns)
        
        for row in rows:
            values = tuple(row)
            query = f"INSERT INTO {table} ({col_names}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"
            try:
                pg_cursor = pg_conn.cursor()
                pg_cursor.execute(query, values)
            except Exception as e:
                print(f"\n    ⚠️  Erro ao inserir: {e}")
                continue
        
        pg_conn.commit()
        print(f"✅")
    else:
        print("⏭️  vazio")

sqlite_conn.close()
pg_conn.close()

print("\n✅ Migração concluída!")
print("\n⚠️  Próximas ações:")
print("  1. Faça backup do banco SQLite (ou delete se não precisar)")
print("  2. Faça deploy no Render com DATABASE_URL configurada")
print("  3. Teste se agendamentos persistem após restarts")

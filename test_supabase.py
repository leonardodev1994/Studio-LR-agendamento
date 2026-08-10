#!/usr/bin/env python3
"""
Script para testar conexão com Supabase e migrar dados SQLite para PostgreSQL.
Execute com: python3 test_supabase.py
"""
import os
import sys
from pathlib import Path

# Importa o server.py
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
os.chdir(ROOT)

from server import load_env, DATABASE_URL, database, db, execute, rows_dict

load_env()

print("=" * 60)
print("TESTE DE CONEXÃO - SUPABASE")
print("=" * 60)

if not DATABASE_URL:
    print("❌ DATABASE_URL não configurada!")
    print("   Configure no .env:")
    print("   DATABASE_URL=postgresql://user:pass@host/dbname")
    sys.exit(1)

print(f"✓ DATABASE_URL encontrada")
print(f"  Tipo: {database.kind}")
print(f"  Host: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'local'}")

# Testa conexão
try:
    conn = db()
    result = execute(conn, "SELECT 1 as ok").fetchone()
    print(f"✓ Conexão bem-sucedida!")
    print(f"  Resposta: {dict(result)}")
    
    # Verifica tabelas
    tables = execute(
        conn, 
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
    ).fetchall()
    print(f"\n✓ Tabelas encontradas: {len(tables)}")
    for table in tables:
        print(f"  - {table['table_name']}")
    
    # Conta registros
    print("\n📊 Registros por tabela:")
    for table in tables:
        count = execute(conn, f"SELECT COUNT(*) as cnt FROM {table['table_name']}").fetchone()
        print(f"  {table['table_name']}: {count['cnt']} registros")
    
    conn.close()
    print("\n✅ Tudo funcionando!")
    
except Exception as e:
    print(f"❌ Erro na conexão: {e}")
    sys.exit(1)

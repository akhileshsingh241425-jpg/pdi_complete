#!/usr/bin/env python3
"""
Fix Schema Mismatch - Drop and Recreate Tables
WARNING: This will delete all existing data!
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import Config
import mysql.connector

def fix_schema():
    """Drop old tables and recreate with correct schema"""
    
    connection = mysql.connector.connect(
        host=Config.MYSQL_HOST,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        database=Config.MYSQL_DB
    )
    
    cursor = connection.cursor()
    
    print("⚠️  WARNING: This will drop existing tables and recreate them!")
    print("All existing production data will be LOST!")
    print("")
    
    # Disable foreign key checks
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
    
    # Drop tables in correct order (child tables first)
    tables_to_drop = [
        'production_material_usage',
        'material_consumption',
        'bom_materials',
        'rejected_modules',
        'production_records',
        'companies',
        'raw_material_stock',
        'coc_documents'
    ]
    
    print("🗑️  Dropping old tables...")
    for table in tables_to_drop:
        try:
            cursor.execute(f"DROP TABLE IF EXISTS {table}")
            print(f"  ✅ Dropped: {table}")
        except Exception as e:
            print(f"  ⚠️  {table}: {e}")
    
    # Re-enable foreign key checks
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
    
    connection.commit()
    connection.close()
    
    print("\n✅ Old tables dropped successfully")
    print("\nNow run: python init_all_tables.py")

if __name__ == '__main__':
    print("=" * 60)
    print("Schema Fix - Drop & Recreate Tables")
    print("=" * 60)
    print()
    
    response = input("Are you sure you want to drop all tables? (yes/no): ")
    if response.lower() != 'yes':
        print("❌ Aborted")
        sys.exit(0)
    
    try:
        fix_schema()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

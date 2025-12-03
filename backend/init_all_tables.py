#!/usr/bin/env python3
"""
Complete Database Initialization Script
Creates ALL tables: base tables + COC tables
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.models.database import db
from config import Config
import mysql.connector

def create_base_tables():
    """Create base tables using Flask-SQLAlchemy"""
    print("📊 Creating base tables (companies, production_records, etc.)...")
    
    app = create_app()
    with app.app_context():
        db.create_all()
        print("✅ Base tables created/verified")
        
        # List all tables
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print(f"✅ Found {len(tables)} tables:")
        for table in tables:
            print(f"  - {table}")

def create_coc_tables():
    """Create COC tracking tables"""
    print("\n📋 Creating COC tracking tables...")
    
    connection = mysql.connector.connect(
        host=Config.MYSQL_HOST,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        database=Config.MYSQL_DB
    )
    
    cursor = connection.cursor()
    
    # 1. COC Documents Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS coc_documents (
            id INT PRIMARY KEY AUTO_INCREMENT,
            external_id VARCHAR(50) COMMENT 'ID from external API',
            company_name VARCHAR(100) NOT NULL COMMENT 'Store name from API (e.g., Bhiwani)',
            material_name VARCHAR(100) NOT NULL COMMENT 'Material name from API',
            brand VARCHAR(100) COMMENT 'Material brand/supplier',
            product_type TEXT COMMENT 'Product specifications (JSON array)',
            lot_batch_no VARCHAR(100) NOT NULL COMMENT 'Lot/Batch number = COC number',
            coc_qty DECIMAL(12,2) NOT NULL COMMENT 'COC quantity',
            invoice_no VARCHAR(100) NOT NULL COMMENT 'Invoice number',
            invoice_qty DECIMAL(12,2) NOT NULL COMMENT 'Invoice quantity',
            invoice_date DATE NOT NULL COMMENT 'Invoice date',
            entry_date DATE COMMENT 'Entry date in external system',
            username VARCHAR(50) COMMENT 'User who entered in external system',
            coc_document_url TEXT COMMENT 'URL to COC PDF document',
            iqc_document_url TEXT COMMENT 'URL to IQC report PDF',
            consumed_qty DECIMAL(12,2) DEFAULT 0 COMMENT 'Total consumed quantity',
            available_qty DECIMAL(12,2) GENERATED ALWAYS AS (coc_qty - consumed_qty) STORED COMMENT 'Available = COC - Consumed',
            is_active BOOLEAN DEFAULT TRUE COMMENT 'Soft delete flag',
            last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_coc_per_company (company_name, material_name, lot_batch_no, invoice_no),
            INDEX idx_company (company_name),
            INDEX idx_material (material_name),
            INDEX idx_lot_batch (lot_batch_no),
            INDEX idx_invoice (invoice_no),
            INDEX idx_invoice_date (invoice_date),
            INDEX idx_available (available_qty),
            INDEX idx_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='COC documents synced from external API'
    """)
    print("✅ Created: coc_documents")
    
    # 2. Raw Material Stock
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS raw_material_stock (
            id INT PRIMARY KEY AUTO_INCREMENT,
            company_name VARCHAR(100) NOT NULL,
            material_type VARCHAR(50) NOT NULL,
            total_received DECIMAL(12,2) DEFAULT 0,
            total_consumed DECIMAL(12,2) DEFAULT 0,
            available DECIMAL(12,2) DEFAULT 0,
            unit VARCHAR(20) DEFAULT 'pcs',
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_material (company_name, material_type),
            INDEX idx_company (company_name),
            INDEX idx_available (available)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    print("✅ Created: raw_material_stock")
    
    # 3. Material Consumption
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS material_consumption (
            id INT PRIMARY KEY AUTO_INCREMENT,
            production_date DATE NOT NULL,
            company_name VARCHAR(100) NOT NULL,
            material_type VARCHAR(50) NOT NULL,
            coc_id INT COMMENT 'Reference to coc_documents',
            lot_number VARCHAR(100),
            consumed_quantity DECIMAL(12,2) NOT NULL,
            unit VARCHAR(20) DEFAULT 'pcs',
            production_record_id INT,
            remarks TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (coc_id) REFERENCES coc_documents(id) ON DELETE SET NULL,
            INDEX idx_date (production_date),
            INDEX idx_company (company_name),
            INDEX idx_coc (coc_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    print("✅ Created: material_consumption")
    
    # 4. Production Material Usage
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS production_material_usage (
            id INT PRIMARY KEY AUTO_INCREMENT,
            production_record_id INT NOT NULL,
            material_type VARCHAR(50) NOT NULL,
            coc_id INT NOT NULL,
            quantity_used DECIMAL(12,2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (coc_id) REFERENCES coc_documents(id) ON DELETE CASCADE,
            INDEX idx_production (production_record_id),
            INDEX idx_coc (coc_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    print("✅ Created: production_material_usage")
    
    connection.commit()
    connection.close()
    print("✅ All COC tables created successfully")

if __name__ == '__main__':
    print("=" * 60)
    print("PDI Complete - Database Initialization")
    print("=" * 60)
    print()
    
    try:
        # Step 1: Create base tables
        create_base_tables()
        
        # Step 2: Create COC tables
        create_coc_tables()
        
        print()
        print("=" * 60)
        print("✅ DATABASE INITIALIZATION COMPLETE!")
        print("=" * 60)
        print()
        print("All tables created successfully. You can now:")
        print("  1. Restart backend: python run.py")
        print("  2. Test API: curl http://localhost:5002/api/companies")
        print()
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

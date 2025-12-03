"""
Add BOM Image, Lot Number, and Is Closed fields to Production Records
"""
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def migrate():
    """Add new columns to production_records table"""
    
    # Database connection
    conn = mysql.connector.connect(
        host=os.getenv('MYSQL_HOST', 'localhost'),
        user=os.getenv('MYSQL_USER', 'rohit'),
        password=os.getenv('MYSQL_PASSWORD', 'rohit0101'),
        database=os.getenv('MYSQL_DB', 'pdi_database')
    )
    
    cursor = conn.cursor()
    
    try:
        print("🔄 Adding new columns to production_records table...")
        
        # Add bom_image column
        cursor.execute("""
            ALTER TABLE production_records 
            ADD COLUMN IF NOT EXISTS bom_image VARCHAR(500) NULL 
            COMMENT 'BOM documentation image path'
        """)
        print("✓ Added bom_image column")
        
        # Add lot_number column
        cursor.execute("""
            ALTER TABLE production_records 
            ADD COLUMN IF NOT EXISTS lot_number VARCHAR(200) NULL 
            COMMENT 'Lot number for materials'
        """)
        print("✓ Added lot_number column")
        
        # Add is_closed column
        cursor.execute("""
            ALTER TABLE production_records 
            ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT FALSE 
            COMMENT 'Piece sheet closed/locked status'
        """)
        print("✓ Added is_closed column")
        
        conn.commit()
        print("\n✅ Migration completed successfully!")
        
        # Verify columns
        cursor.execute("DESCRIBE production_records")
        columns = cursor.fetchall()
        print("\n📋 Current table structure:")
        for col in columns:
            print(f"  - {col[0]}: {col[1]}")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    migrate()

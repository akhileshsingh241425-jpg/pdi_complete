#!/usr/bin/env python3
"""
Update database schema to add new fields to production_records table.
This will create the columns if they don't exist.
"""

from app import create_app
from app.models.database import db
from sqlalchemy import text

def update_schema():
    app = create_app()
    
    with app.app_context():
        print("Updating database schema...")
        
        # Check if columns exist and add if missing
        try:
            with db.engine.connect() as conn:
                # Check for bom_image column
                result = conn.execute(text("""
                    SELECT COUNT(*) 
                    FROM information_schema.columns 
                    WHERE table_schema = DATABASE() 
                    AND table_name = 'production_records' 
                    AND column_name = 'bom_image'
                """))
                
                if result.scalar() == 0:
                    print("Adding bom_image column...")
                    conn.execute(text("""
                        ALTER TABLE production_records 
                        ADD COLUMN bom_image VARCHAR(500) NULL
                    """))
                    conn.commit()
                    print("✓ bom_image column added")
                else:
                    print("✓ bom_image column already exists")
                
                # Check for lot_number column
                result = conn.execute(text("""
                    SELECT COUNT(*) 
                    FROM information_schema.columns 
                    WHERE table_schema = DATABASE() 
                    AND table_name = 'production_records' 
                    AND column_name = 'lot_number'
                """))
                
                if result.scalar() == 0:
                    print("Adding lot_number column...")
                    conn.execute(text("""
                        ALTER TABLE production_records 
                        ADD COLUMN lot_number VARCHAR(200) NULL
                    """))
                    conn.commit()
                    print("✓ lot_number column added")
                else:
                    print("✓ lot_number column already exists")
                
                # Check for is_closed column
                result = conn.execute(text("""
                    SELECT COUNT(*) 
                    FROM information_schema.columns 
                    WHERE table_schema = DATABASE() 
                    AND table_name = 'production_records' 
                    AND column_name = 'is_closed'
                """))
                
                if result.scalar() == 0:
                    print("Adding is_closed column...")
                    conn.execute(text("""
                        ALTER TABLE production_records 
                        ADD COLUMN is_closed TINYINT(1) DEFAULT 0
                    """))
                    conn.commit()
                    print("✓ is_closed column added")
                else:
                    print("✓ is_closed column already exists")
                
            print("\n✓✓✓ Schema update completed successfully! ✓✓✓")
            
        except Exception as e:
            print(f"Error updating schema: {e}")
            raise

if __name__ == '__main__':
    update_schema()

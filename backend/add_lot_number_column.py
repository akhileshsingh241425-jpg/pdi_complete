#!/usr/bin/env python3
"""
Add lot_number column to production_records table (mandatory and unique)
"""

from app import create_app
from app.models.database import db
from sqlalchemy import text

def update_schema():
    app = create_app()
    
    with app.app_context():
        print("=" * 60)
        print("Adding lot_number column to production_records")
        print("=" * 60)
        
        try:
            with db.engine.connect() as conn:
                # Check if lot_number column exists
                result = conn.execute(text("""
                    SELECT COUNT(*) 
                    FROM information_schema.columns 
                    WHERE table_schema = DATABASE() 
                    AND table_name = 'production_records' 
                    AND column_name = 'lot_number'
                """))
                
                if result.scalar() == 0:
                    print("\nAdding lot_number column...")
                    conn.execute(text("""
                        ALTER TABLE production_records 
                        ADD COLUMN lot_number VARCHAR(200) NOT NULL UNIQUE AFTER date
                    """))
                    conn.commit()
                    print("✓ lot_number column added (mandatory and unique)")
                else:
                    print("✓ lot_number column already exists")
                    # Make it unique if not already
                    try:
                        conn.execute(text("""
                            ALTER TABLE production_records 
                            ADD UNIQUE INDEX idx_lot_number (lot_number)
                        """))
                        conn.commit()
                        print("✓ Added unique constraint on lot_number")
                    except Exception as e:
                        print(f"Note: {e}")
                
            print("\n" + "=" * 60)
            print("✓✓✓ Schema update completed successfully! ✓✓✓")
            print("=" * 60)
            
        except Exception as e:
            print(f"\n❌ Error updating schema: {e}")
            raise

if __name__ == '__main__':
    update_schema()

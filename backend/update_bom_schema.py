#!/usr/bin/env python3
"""
Database schema update for BOM materials tracking
- Remove old single bom_image and lot_number columns
- Add ipqc_pdf and ftr_document columns to production_records
- Create new bom_materials table for tracking each material separately
"""

from app import create_app
from app.models.database import db
from sqlalchemy import text

def update_schema():
    app = create_app()
    
    with app.app_context():
        print("=" * 60)
        print("Updating database schema for BOM materials tracking")
        print("=" * 60)
        
        try:
            with db.engine.connect() as conn:
                # Step 1: Drop old columns if they exist
                print("\n[1/4] Removing old single BOM columns...")
                try:
                    conn.execute(text("""
                        ALTER TABLE production_records 
                        DROP COLUMN IF EXISTS bom_image,
                        DROP COLUMN IF EXISTS lot_number
                    """))
                    conn.commit()
                    print("✓ Old columns removed")
                except Exception as e:
                    print(f"Note: {e}")
                
                # Step 2: Add new document columns to production_records
                print("\n[2/4] Adding IPQC PDF and FTR document columns...")
                
                # Check for ipqc_pdf column
                result = conn.execute(text("""
                    SELECT COUNT(*) 
                    FROM information_schema.columns 
                    WHERE table_schema = DATABASE() 
                    AND table_name = 'production_records' 
                    AND column_name = 'ipqc_pdf'
                """))
                
                if result.scalar() == 0:
                    conn.execute(text("""
                        ALTER TABLE production_records 
                        ADD COLUMN ipqc_pdf VARCHAR(500) NULL
                    """))
                    conn.commit()
                    print("✓ ipqc_pdf column added")
                else:
                    print("✓ ipqc_pdf column already exists")
                
                # Check for ftr_document column
                result = conn.execute(text("""
                    SELECT COUNT(*) 
                    FROM information_schema.columns 
                    WHERE table_schema = DATABASE() 
                    AND table_name = 'production_records' 
                    AND column_name = 'ftr_document'
                """))
                
                if result.scalar() == 0:
                    conn.execute(text("""
                        ALTER TABLE production_records 
                        ADD COLUMN ftr_document VARCHAR(500) NULL
                    """))
                    conn.commit()
                    print("✓ ftr_document column added")
                else:
                    print("✓ ftr_document column already exists")
                
                # Step 3: Create bom_materials table
                print("\n[3/4] Creating BOM materials table...")
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS bom_materials (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        production_record_id INT NOT NULL,
                        material_name VARCHAR(100) NOT NULL,
                        image_path VARCHAR(500) NULL,
                        lot_number VARCHAR(200) NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (production_record_id) REFERENCES production_records(id) ON DELETE CASCADE,
                        INDEX idx_production_record (production_record_id),
                        INDEX idx_material_name (material_name)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                """))
                conn.commit()
                print("✓ bom_materials table created")
                
                # Step 4: Verify is_closed column exists
                print("\n[4/4] Verifying is_closed column...")
                result = conn.execute(text("""
                    SELECT COUNT(*) 
                    FROM information_schema.columns 
                    WHERE table_schema = DATABASE() 
                    AND table_name = 'production_records' 
                    AND column_name = 'is_closed'
                """))
                
                if result.scalar() == 0:
                    conn.execute(text("""
                        ALTER TABLE production_records 
                        ADD COLUMN is_closed TINYINT(1) DEFAULT 0
                    """))
                    conn.commit()
                    print("✓ is_closed column added")
                else:
                    print("✓ is_closed column already exists")
                
            print("\n" + "=" * 60)
            print("✓✓✓ Schema update completed successfully! ✓✓✓")
            print("=" * 60)
            print("\nBOM Materials supported:")
            materials = [
                "Cell", "EVA Front", "EVA Back", "Glass Front", "Glass Back",
                "Ribbon", "Frame Long", "Frame Short", "JB", "Flux",
                "Potting Material", "Bus Bar 6mm", "Bus Bar 4mm",
                "Silicone 2kg", "Silicone 10kg", "Silicone 270kg"
            ]
            for i, mat in enumerate(materials, 1):
                print(f"  {i:2d}. {mat}")
            print("=" * 60)
            
        except Exception as e:
            print(f"\n❌ Error updating schema: {e}")
            raise

if __name__ == '__main__':
    update_schema()

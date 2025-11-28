"""
Add is_delivered and delivered_date fields to master_modules table
Run this script to update the database schema
"""

from app import create_app
from app.models.database import db
from sqlalchemy import text

def add_delivered_fields():
    app = create_app()
    
    with app.app_context():
        try:
            # Check if columns already exist
            result = db.session.execute(text("""
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'master_modules' 
                AND COLUMN_NAME IN ('is_delivered', 'delivered_date')
            """))
            existing_columns = [row[0] for row in result]
            
            if 'is_delivered' in existing_columns and 'delivered_date' in existing_columns:
                print("✅ Columns already exist! No migration needed.")
                return
            
            # Add is_delivered column
            if 'is_delivered' not in existing_columns:
                print("Adding is_delivered column...")
                db.session.execute(text("""
                    ALTER TABLE master_modules 
                    ADD COLUMN is_delivered BOOLEAN DEFAULT FALSE
                """))
                print("✅ is_delivered column added")
            
            # Add delivered_date column
            if 'delivered_date' not in existing_columns:
                print("Adding delivered_date column...")
                db.session.execute(text("""
                    ALTER TABLE master_modules 
                    ADD COLUMN delivered_date DATE NULL
                """))
                print("✅ delivered_date column added")
            
            db.session.commit()
            print("\n🎉 Migration completed successfully!")
            print("\n📋 Summary:")
            print("   - is_delivered: Boolean field to track if FTR is delivered")
            print("   - delivered_date: Date field to track when FTR was delivered")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error during migration: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    add_delivered_fields()

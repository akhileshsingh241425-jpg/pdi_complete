"""
Add COC tracking to production records
"""
import mysql.connector
from mysql.connector import Error

def add_coc_tracking_fields():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            database='pdi_database',
            user='root',
            password='Ashu@620930'
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            print("Adding COC tracking fields to production_records...")
            
            # Add columns for COC tracking
            alter_queries = [
                """
                ALTER TABLE production_records 
                ADD COLUMN coc_warning_shown BOOLEAN DEFAULT FALSE AFTER bom_image
                """,
                """
                ALTER TABLE production_records 
                ADD COLUMN coc_materials_used TEXT AFTER coc_warning_shown
                COMMENT 'JSON string of COC materials consumed'
                """
            ]
            
            for query in alter_queries:
                try:
                    cursor.execute(query)
                    print(f"✓ Executed: {query[:80]}...")
                except Error as e:
                    if e.errno == 1060:  # Duplicate column
                        print(f"⊘ Column already exists, skipping")
                    else:
                        print(f"✗ Error: {e}")
            
            # Create index
            try:
                cursor.execute("""
                    CREATE INDEX idx_production_date 
                    ON production_records(date)
                """)
                print("✓ Created index on production date")
            except Error as e:
                if e.errno == 1061:  # Duplicate key
                    print("⊘ Index already exists")
                else:
                    print(f"✗ Error creating index: {e}")
            
            connection.commit()
            print("\n✅ COC tracking fields added successfully!")
            
    except Error as e:
        print(f"❌ Database error: {e}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("Database connection closed.")

if __name__ == "__main__":
    add_coc_tracking_fields()

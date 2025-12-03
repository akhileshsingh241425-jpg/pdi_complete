# COC Feature Database Setup Guide

## New Features Added
- Certificate of Conformance (COC) tracking
- Raw material stock management
- Material consumption logging
- Production material usage tracking

## New Database Tables Required

### 1. coc_documents
Stores COC certificates synced from external API
- Material details (company, material, brand, lot/batch)
- Invoice information
- Document URLs (COC PDF, IQC PDF)
- Quantity tracking (received, consumed, available)

### 2. raw_material_stock
Current stock summary for each material type
- Total received, consumed, and available quantities
- Per company and material type
- Auto-updated from COC consumption

### 3. material_consumption
Daily material usage log
- Links to COC documents
- Production lot tracking
- Quantity consumed per material

### 4. production_material_usage
Material requirements per production record
- Links production records to specific COCs
- Tracks which COC was used for which production

## Setup Instructions

### Method 1: Run Setup Script (RECOMMENDED)

```bash
cd ~/pdi_complete/backend
source venv/bin/activate
chmod +x setup_coc_database.sh
./setup_coc_database.sh
```

### Method 2: Run Python Script Manually

```bash
cd ~/pdi_complete/backend
source venv/bin/activate
python create_coc_tables.py
```

### Method 3: Manual SQL Execution

If above methods fail, run SQL directly:

```bash
cd ~/pdi_complete/backend
source venv/bin/activate
python -c "
from config import Config
import mysql.connector

conn = mysql.connector.connect(
    host=Config.MYSQL_HOST,
    user=Config.MYSQL_USER,
    password=Config.MYSQL_PASSWORD,
    database=Config.MYSQL_DB
)
cursor = conn.cursor()

# Read and execute create_coc_tables.py SQL commands
import sys
sys.path.append('.')
from create_coc_tables import create_coc_tables
create_coc_tables()

print('✅ COC tables created successfully!')
"
```

## Verification

After running setup, verify tables exist:

```bash
cd ~/pdi_complete/backend
source venv/bin/activate
python -c "
from config import Config
import mysql.connector

conn = mysql.connector.connect(
    host=Config.MYSQL_HOST,
    user=Config.MYSQL_USER,
    password=Config.MYSQL_PASSWORD,
    database=Config.MYSQL_DB
)
cursor = conn.cursor()

cursor.execute('SHOW TABLES LIKE \"%coc%\"')
tables = cursor.fetchall()
print('COC Tables found:')
for table in tables:
    print(f'  ✅ {table[0]}')
"
```

Expected output:
```
COC Tables found:
  ✅ coc_documents
  ✅ material_consumption
  ✅ raw_material_stock
  ✅ production_material_usage
```

## Testing Endpoints

After database setup, test COC endpoints:

```bash
# Test companies endpoint
curl http://localhost:5002/api/coc/companies

# Test COC list endpoint
curl http://localhost:5002/api/coc/list

# Test stock endpoint
curl http://localhost:5002/api/coc/stock
```

All should return JSON responses without 500 errors.

## Troubleshooting

### Error: "Table 'coc_documents' doesn't exist"
**Solution:** Run `create_coc_tables.py` script

### Error: "Unknown column 'is_active'"
**Solution:** Table exists but wrong schema. Drop and recreate:
```sql
DROP TABLE IF EXISTS material_consumption;
DROP TABLE IF EXISTS production_material_usage;
DROP TABLE IF EXISTS raw_material_stock;
DROP TABLE IF EXISTS coc_documents;
```
Then run create script again.

### Error: Database connection refused
**Solution:** Check MySQL credentials in `config.py`

## Complete Deployment Checklist

- [ ] Pull latest code: `git pull origin main`
- [ ] Create COC tables: `./backend/setup_coc_database.sh`
- [ ] Rebuild frontend: `cd frontend && npm run build`
- [ ] Restart backend: `pkill python && cd backend && source venv/bin/activate && nohup python run.py &`
- [ ] Test COC endpoints: `curl http://localhost:5002/api/coc/companies`
- [ ] Open site: `http://pdi.gspl.cloud:4000`
- [ ] Test password: `241425`
- [ ] Verify COC Dashboard loads without errors

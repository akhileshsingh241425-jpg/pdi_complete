# PDI Complete - Local Testing Guide

## 🔍 Complete Testing Checklist

### Prerequisites
- Python 3.8+ installed
- Node.js 16+ and npm installed
- MySQL 8.0+ installed and running
- Git installed

---

## 📋 Step-by-Step Local Testing

### Step 1: Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE pdi_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create user (optional, for security)
CREATE USER 'pdi_user'@'localhost' IDENTIFIED BY 'pdi_password';
GRANT ALL PRIVILEGES ON pdi_database.* TO 'pdi_user'@'localhost';
FLUSH PRIVILEGES;

# Exit MySQL
EXIT;
```

### Step 2: Backend Setup

```bash
# Navigate to backend folder
cd ~/pid/pdi_complete/backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << 'EOF'
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_DB=pdi_database
SECRET_KEY=your-secret-key-for-testing
FLASK_ENV=development
DEBUG=True
FRONTEND_URL=http://localhost:3000
MAX_CONTENT_LENGTH=524288000
UPLOAD_FOLDER=uploads
GENERATED_PDF_FOLDER=generated_pdfs
EOF

# Initialize database tables
python init_db.py

# Create master tables (optional, for reference data)
python create_master_tables.py
```

### Step 3: Test Backend

```bash
# Still in backend folder with venv activated
# Start development server
python run.py

# Server should start on http://localhost:5000
# You should see: "Running on http://0.0.0.0:5000"
```

**Test Backend Endpoints:**

Open a new terminal and test:

```bash
# Health Check
curl http://localhost:5000/api/health

# Expected: {"status":"healthy","message":"IPQC Automation API is running",...}

# Test Company Routes
curl http://localhost:5000/api/companies

# Test Master Data
curl http://localhost:5000/api/master/bom-data
```

### Step 4: Frontend Setup

Open a **NEW terminal** (keep backend running):

```bash
# Navigate to frontend folder
cd ~/pid/pdi_complete/frontend

# Install dependencies
npm install

# Create .env file for frontend
cat > .env << 'EOF'
REACT_APP_API_URL=http://localhost:5000/api
EOF

# Start development server
npm start

# Frontend should open at http://localhost:3000
```

---

## ✅ Features to Test

### 1. Login
- Default credentials: Check `Login.js` component
- Test login/logout functionality

### 2. IPQC Form
- ✅ Generate IPQC form with serial numbers
- ✅ Download PDF
- ✅ Download Excel
- ✅ Download ZIP (PDF + Excel)
- ✅ Test different shifts (A, B, General)
- ✅ Test different module counts

### 3. Daily Production Report
- ✅ Add new company
- ✅ View company list
- ✅ Add production data
- ✅ Generate daily report PDF
- ✅ Edit production records

### 4. Rejection Analysis
- ✅ Upload rejection data (Excel)
- ✅ View rejection statistics
- ✅ Generate rejection report
- ✅ Filter by date range

### 5. Peel Test Report
- ✅ Create peel test entry
- ✅ Add test data
- ✅ Generate peel test PDF
- ✅ Download peel test Excel

### 6. Master Data Upload
- ✅ Upload BOM data (Excel)
- ✅ Upload rejection reasons (Excel)
- ✅ View uploaded master data
- ✅ Update master data

### 7. FTR Download
- ✅ Download FTR templates
- ✅ Generate FTR reports

### 8. Master Data Viewer
- ✅ View all BOM data
- ✅ View rejection categories
- ✅ Search and filter data

### 9. Rejection Upload
- ✅ Bulk upload rejection data
- ✅ Validate Excel format
- ✅ View upload history

### 10. FTR Delivered Upload
- ✅ Upload delivered FTR data
- ✅ Track deliveries
- ✅ Generate delivery reports

---

## 🔍 Common Issues and Fixes

### Issue 1: Database Connection Error
```
Error: Can't connect to MySQL server
```
**Fix:**
```bash
# Check MySQL is running
sudo systemctl status mysql
# or
brew services list | grep mysql

# Start MySQL if needed
sudo systemctl start mysql
```

### Issue 2: Module Not Found Error
```
ModuleNotFoundError: No module named 'flask'
```
**Fix:**
```bash
# Make sure virtual environment is activated
source venv/bin/activate
# Reinstall dependencies
pip install -r requirements.txt
```

### Issue 3: Port Already in Use
```
Error: Address already in use
```
**Fix:**
```bash
# Find process using port 5000
lsof -i :5000
# Kill the process
kill -9 <PID>

# Or use different port
python run.py --port 5001
```

### Issue 4: CORS Error in Frontend
```
Access to fetch blocked by CORS policy
```
**Fix:**
- Check backend `.env` has correct `FRONTEND_URL=http://localhost:3000`
- Check `backend/app/__init__.py` CORS configuration
- Restart backend server

### Issue 5: API Connection Failed
```
Network Error or 404 Not Found
```
**Fix:**
- Check backend is running on port 5000
- Check frontend `.env` has `REACT_APP_API_URL=http://localhost:5000/api`
- Test backend health: `curl http://localhost:5000/api/health`

### Issue 6: Excel Upload Not Working
```
Error parsing Excel file
```
**Fix:**
- Check Excel format matches expected structure
- Ensure openpyxl is installed: `pip install openpyxl`
- Check file size is within limits (500MB)

---

## 🧪 API Testing with Postman/cURL

### Test IPQC Generation
```bash
curl -X POST http://localhost:5000/api/generate-ipqc \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-15",
    "shift": "A",
    "customer_id": "GSPL/IPQC/IPC/003",
    "po_number": "PO12345",
    "serial_start": 10001,
    "module_count": 5
  }'
```

### Test Company Creation
```bash
curl -X POST http://localhost:5000/api/companies \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Test Company",
    "module_wattage": 625,
    "module_type": "Topcon",
    "cells_per_module": 132
  }'
```

### Test Production Record
```bash
curl -X POST http://localhost:5000/api/production/companies/1/records \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-15",
    "day_production": 1000,
    "night_production": 800,
    "pdi": "PDI-001"
  }'
```

---

## 📊 Database Verification

```bash
# Check all tables created
mysql -u root -p pdi_database -e "SHOW TABLES;"

# Expected tables:
# - companies
# - production_records
# - rejected_modules
# - ipqc_data
# - peel_test_data
# - master_bom_data
# - master_rejection_reasons

# Check company data
mysql -u root -p pdi_database -e "SELECT * FROM companies;"

# Check production records
mysql -u root -p pdi_database -e "SELECT * FROM production_records;"
```

---

## 🚀 Performance Testing

### Test Large Data Upload
```bash
# Create test Excel with 10,000 rows
# Upload through UI
# Check response time and memory usage
```

### Test Concurrent Requests
```bash
# Use Apache Bench
ab -n 100 -c 10 http://localhost:5000/api/health

# Expected: All requests should succeed
```

---

## ✅ Testing Checklist

- [ ] Backend starts without errors
- [ ] Database connection successful
- [ ] All API endpoints respond
- [ ] Frontend builds successfully
- [ ] Frontend connects to backend
- [ ] Login works
- [ ] IPQC form generates correctly
- [ ] PDF generation works
- [ ] Excel generation works
- [ ] Company CRUD operations work
- [ ] Production records CRUD works
- [ ] Rejection analysis works
- [ ] Peel test works
- [ ] Master data upload works
- [ ] File uploads work
- [ ] File downloads work
- [ ] All reports generate correctly
- [ ] No console errors in browser
- [ ] No errors in backend logs

---

## 📝 Test Data

### Sample Company
```json
{
  "company_name": "Gautam Solar",
  "module_wattage": 625,
  "module_type": "Topcon",
  "cells_per_module": 132,
  "cells_received_qty": 100000,
  "cells_received_mw": 2.57
}
```

### Sample Production Record
```json
{
  "date": "2024-01-15",
  "day_production": 2000,
  "night_production": 1500,
  "pdi": "PDI-2024-001",
  "cell_rejection_percent": 0.5,
  "module_rejection_percent": 0.3
}
```

---

## 🔧 Environment Variables Summary

### Backend .env
```env
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_DB=pdi_database
SECRET_KEY=your-secret-key
FLASK_ENV=development
DEBUG=True
FRONTEND_URL=http://localhost:3000
```

### Frontend .env
```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 📞 Need Help?

If you encounter any issues:
1. Check backend logs: `tail -f backend/backend.log`
2. Check browser console for frontend errors
3. Verify all dependencies are installed
4. Ensure MySQL is running
5. Check firewall/antivirus settings

**Happy Testing! 🎉**

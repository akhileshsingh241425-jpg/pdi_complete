# 🚀 Production Deployment Guide - PDI Complete System

## System Overview
- **Frontend**: React 18 (Port 3000 in dev)
- **Backend**: Flask (Port 5000)
- **Database**: MySQL (pdi_database)
- **Server**: Windows Server (IIS recommended for production)

---

## 📋 Pre-Deployment Checklist

### 1. Database Setup (Already Done ✅)
```sql
Database: pdi_database
Tables:
  - company_details
  - daily_production
  - ipqc_data
  - peel_test_data
  - master_orders
  - master_modules
```

### 2. Files Cleaned (Already Done ✅)
- Removed test files
- Removed backup files
- Removed unused scripts

---

## 🔧 Production Configuration

### Backend (Flask)

**1. Update `config.py` for Production:**
```python
class ProductionConfig:
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:YOUR_STRONG_PASSWORD@localhost/pdi_database'
    SECRET_KEY = 'GENERATE_STRONG_SECRET_KEY_HERE'
    DEBUG = False
    TESTING = False
```

**2. Update `run.py`:**
Change debug mode to False:
```python
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
```

**3. Install Production Server (Waitress):**
```bash
pip install waitress
```

**4. Create `production_server.py`:**
```python
from waitress import serve
from app import create_app

app = create_app()

if __name__ == '__main__':
    print("🚀 Starting Production Server on port 5000...")
    serve(app, host='0.0.0.0', port=5000, threads=4)
```

### Frontend (React)

**1. Update API URL in all components:**
Replace `http://localhost:5000` with your production server IP:
```javascript
// Example: http://192.168.1.100:5000
const API_URL = 'http://YOUR_SERVER_IP:5000';
```

**2. Build for Production:**
```bash
cd frontend
npm run build
```
This creates optimized `build/` folder.

---

## 🌐 Deployment Options

### Option 1: Single Windows Machine (Recommended for Local Network)

**Backend:**
1. Install Python dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   pip install waitress
   ```

2. Start backend server:
   ```bash
   python production_server.py
   ```

3. **Run as Windows Service (Optional):**
   Use `NSSM` (Non-Sucking Service Manager):
   ```bash
   nssm install PDI_Backend "C:\Users\hp\AppData\Local\Programs\Python\Python310\python.exe" "C:\Users\hp\Desktop\pdi\pdi_complete\backend\production_server.py"
   nssm start PDI_Backend
   ```

**Frontend:**
1. Install `serve` globally:
   ```bash
   npm install -g serve
   ```

2. Serve the build folder:
   ```bash
   cd frontend
   serve -s build -l 3000
   ```

3. **Or use IIS:**
   - Copy `build/` folder to `C:\inetpub\wwwroot\pdi`
   - Create new website in IIS Manager
   - Point to the folder
   - Access via http://localhost or http://YOUR_SERVER_IP

### Option 2: IIS (Internet Information Services)

**Backend (Flask on IIS):**
1. Install `wfastcgi`:
   ```bash
   pip install wfastcgi
   wfastcgi-enable
   ```

2. Create `web.config` in backend folder (file will be created separately)

3. Add site in IIS pointing to backend folder

**Frontend on IIS:**
1. Copy `frontend/build/` to `C:\inetpub\wwwroot\pdi`
2. Create new website in IIS
3. Set binding to port 80 or 443 (with SSL)

---

## 🔒 Security Checklist

### Database
- [ ] Change MySQL root password
- [ ] Create dedicated database user with limited privileges:
  ```sql
  CREATE USER 'pdi_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD';
  GRANT ALL PRIVILEGES ON pdi_database.* TO 'pdi_user'@'localhost';
  FLUSH PRIVILEGES;
  ```

### Backend
- [ ] Set DEBUG = False in production
- [ ] Generate strong SECRET_KEY (use `secrets.token_hex(32)`)
- [ ] Enable HTTPS (SSL certificate)
- [ ] Configure CORS properly (only allow your frontend domain)
- [ ] Set file upload limits (already 500MB, adjust if needed)

### Frontend
- [ ] Update API URLs to production server
- [ ] Build with production optimizations (`npm run build`)
- [ ] Configure CSP headers in IIS/web server

### Firewall
- [ ] Open port 5000 for backend (or use reverse proxy)
- [ ] Open port 3000/80/443 for frontend
- [ ] Restrict access to local network only if not public

---

## 📁 Folder Structure (Production)

```
C:\PDI_Production\
├── backend\
│   ├── app\
│   ├── generated_pdfs\
│   ├── uploads\
│   ├── config.py
│   ├── production_server.py
│   ├── requirements.txt
│   └── run.py
│
└── frontend\
    └── build\  (after npm run build)
        ├── static\
        ├── index.html
        └── ...
```

---

## 🚀 Quick Start Commands

### Development (Current Setup)
```bash
# Terminal 1 - Backend
cd backend
python run.py

# Terminal 2 - Frontend
cd frontend
npm start
```

### Production
```bash
# Terminal 1 - Backend
cd backend
python production_server.py

# Terminal 2 - Frontend (if not using IIS)
cd frontend
npm run build
serve -s build -l 80
```

---

## 🔄 Backup & Maintenance

### Database Backup (Daily Recommended)
```bash
mysqldump -u root -p pdi_database > backup_$(date +%Y%m%d).sql
```

### Backup Important Folders
- `backend/generated_pdfs/`
- `backend/uploads/`
- Database dump

### Log Monitoring
- Backend logs: Check console output or redirect to file
- IIS logs: `C:\inetpub\logs\LogFiles\`

---

## 📞 Access URLs

### Development
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Production (Local Network)
- Frontend: http://YOUR_SERVER_IP:80
- Backend: http://YOUR_SERVER_IP:5000
- Full URL example: http://192.168.1.100

---

## ⚡ Performance Tips

1. **Database Indexing** (Already done ✅)
2. **Batch Processing** (Already implemented for 340k rows ✅)
3. **Enable gzip compression in IIS**
4. **Use CDN for static assets (optional)**
5. **Regular database optimization:**
   ```sql
   OPTIMIZE TABLE master_modules;
   OPTIMIZE TABLE master_orders;
   ```

---

## 🐛 Troubleshooting

### Backend won't start
- Check MySQL is running: `services.msc` → MySQL80
- Verify Python path in NSSM/config
- Check port 5000 not already in use

### Frontend can't connect to Backend
- Update API URLs in all components
- Check CORS configuration in backend
- Verify firewall allows connections

### Database connection failed
- Verify MySQL credentials in `config.py`
- Check MySQL user has proper permissions
- Test connection: `mysql -u root -p`

---

## 📝 Next Steps

1. ✅ Clean unused files (DONE)
2. Create `production_server.py`
3. Update `config.py` with production settings
4. Build frontend (`npm run build`)
5. Deploy to Windows Server
6. Configure as Windows Services
7. Test all features
8. Setup daily database backups

---

## 🎯 System Features (Live Ready)

✅ IPQC Form & PDF Generation
✅ Daily Production Report
✅ Rejection Analysis
✅ Peel Test Report (12-sheet Excel)
✅ Master Data Upload (340k+ rows)
✅ Master Data Viewer (CRUD)
✅ Rejection Upload (Simple Excel)
✅ FTR Download (3 methods: Quantity, Range, Excel)
✅ Real-time Progress Tracking
✅ Pagination & Search
✅ Auto-rejection filtering

---

**System is ready for production deployment! 🚀**

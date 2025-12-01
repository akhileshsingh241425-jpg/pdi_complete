# 🚀 PDI Complete - Testing & Deployment Guide

## 📖 Overview

Yeh complete guide hai PDI (Production Data Intelligence) application ko local testing aur production deployment ke liye.

## 📦 Package Contents

```
pdi_complete/
├── backend/              # Flask backend
├── frontend/             # React frontend
├── quick_start.sh        # 🚀 Local development quick setup
├── test_local.sh         # 🧪 Automated testing script
├── deploy_production.sh  # 🌐 Production deployment script
└── LOCAL_TESTING_GUIDE.md # 📚 Detailed testing guide
```

---

## 🎯 Quick Links

- **Local Development:** Run `./quick_start.sh`
- **Complete Testing:** Run `./test_local.sh`
- **Production Deploy:** Run `./deploy_production.sh`
- **Detailed Guide:** Read `LOCAL_TESTING_GUIDE.md`

---

## 🚀 Quick Start (Local Development)

### Option 1: Automated Setup (Recommended)

```bash
# Make script executable (if not already)
chmod +x quick_start.sh

# Run quick start
./quick_start.sh

# Follow the instructions to start backend and frontend
```

### Option 2: Manual Setup

#### Backend:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file with your database credentials
cp .env.example .env  # Edit with your settings

# Initialize database
python init_db.py

# Start server
python run.py
```

#### Frontend:
```bash
cd frontend
npm install

# Create .env file
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env

# Start development server
npm start
```

---

## 🧪 Testing

### Automated Testing

Run complete automated test suite:

```bash
chmod +x test_local.sh
./test_local.sh
```

Yeh script check karega:
- ✅ All prerequisites (Python, Node, MySQL)
- ✅ Project structure
- ✅ Backend configuration
- ✅ Frontend configuration
- ✅ Database connectivity
- ✅ All API endpoints
- ✅ Frontend build
- ✅ Code quality

### Manual Testing

Check `LOCAL_TESTING_GUIDE.md` for detailed manual testing procedures.

---

## 🌐 Production Deployment

### Prerequisites

- Ubuntu/Debian server (VPS/Hostinger)
- Root or sudo access
- MySQL installed or accessible
- Domain name (optional)

### Automated Deployment

```bash
# Upload project to server
git clone https://github.com/akhileshsingh241425-jpg/pdi_complete.git
cd pdi_complete

# Make script executable
chmod +x deploy_production.sh

# Run deployment (will ask for database credentials)
./deploy_production.sh
```

### What the Script Does

1. ✅ Installs system dependencies (Python, Node, Nginx, MySQL)
2. ✅ Creates and configures database
3. ✅ Sets up backend with virtualenv
4. ✅ Installs all Python dependencies
5. ✅ Builds frontend React app
6. ✅ Configures Nginx as reverse proxy
7. ✅ Creates systemd service for backend
8. ✅ Starts all services
9. ✅ Verifies deployment

---

## 🔧 Configuration

### Backend (.env)

```env
MYSQL_HOST=localhost
MYSQL_USER=your_db_user
MYSQL_PASSWORD=your_db_password
MYSQL_DB=pdi_database
SECRET_KEY=your-super-secret-key
FLASK_ENV=production
DEBUG=False
FRONTEND_URL=http://your-domain.com
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://your-domain.com/api
```

---

## 📋 Features

### 1. IPQC Form Generation
- Generate IPQC forms with serial numbers
- Download as PDF, Excel, or ZIP
- Support for different shifts and module types

### 2. Daily Production Report
- Add companies and production data
- Track day/night production
- Generate production reports
- Monitor rejection rates

### 3. Rejection Analysis
- Upload rejection data from Excel
- View rejection statistics
- Generate analysis reports
- Filter by date range

### 4. Peel Test Report
- Create peel test entries
- Record test measurements
- Generate peel test PDFs
- Download Excel reports

### 5. Master Data Management
- Upload BOM (Bill of Materials) data
- Manage rejection reasons
- Import from Excel templates
- View and update master data

### 6. FTR Management
- Download FTR templates
- Upload delivered FTR data
- Track delivery status
- Generate FTR reports

---

## 🛠️ Troubleshooting

### White Screen Issue

**Symptoms:** Application loads but shows only white screen

**Solutions:**

1. **Frontend not built:**
   ```bash
   cd frontend
   npm run build
   ```

2. **API URL incorrect:**
   ```bash
   # Check frontend/.env
   REACT_APP_API_URL=http://your-server:5000/api
   ```

3. **Backend not running:**
   ```bash
   # Check backend status
   sudo systemctl status pdi_complete-backend
   
   # View logs
   sudo journalctl -u pdi_complete-backend -n 50
   ```

4. **CORS issue:**
   ```bash
   # Check backend/app/__init__.py CORS configuration
   # Ensure frontend URL is in allowed origins
   ```

### Database Connection Error

```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u your_user -p -e "SELECT 1;"

# Check credentials in backend/.env
```

### Port Already in Use

```bash
# Find process using port
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use different port
python run.py --port 5001
```

### File Upload Fails

```bash
# Check upload folder exists and has correct permissions
cd backend
mkdir -p uploads generated_pdfs
chmod 755 uploads generated_pdfs

# Check Nginx configuration for client_max_body_size
sudo nano /etc/nginx/sites-available/pdi_complete
# Should have: client_max_body_size 500M;
```

---

## 📊 Useful Commands

### Backend

```bash
# Start backend (development)
cd backend
source venv/bin/activate
python run.py

# Start backend (production)
sudo systemctl start pdi_complete-backend

# View backend logs
sudo journalctl -u pdi_complete-backend -f

# Restart backend
sudo systemctl restart pdi_complete-backend

# Check backend status
sudo systemctl status pdi_complete-backend
```

### Frontend

```bash
# Development mode
npm start

# Build for production
npm run build

# Test build locally
npx serve -s build
```

### Database

```bash
# Backup database
mysqldump -u root -p pdi_database > backup_$(date +%Y%m%d).sql

# Restore database
mysql -u root -p pdi_database < backup.sql

# Check tables
mysql -u root -p pdi_database -e "SHOW TABLES;"
```

### Nginx

```bash
# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/access.log
```

---

## 🔐 Security Recommendations

### For Production

1. **SSL Certificate:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

2. **Firewall:**
   ```bash
   sudo ufw allow 'Nginx Full'
   sudo ufw allow OpenSSH
   sudo ufw enable
   ```

3. **MySQL Security:**
   ```bash
   sudo mysql_secure_installation
   ```

4. **Change Default Credentials:**
   - Update MySQL root password
   - Use strong SECRET_KEY in .env
   - Create separate MySQL user for application

5. **Regular Backups:**
   ```bash
   # Add to crontab for daily backup
   0 2 * * * mysqldump -u root -p'password' pdi_database > /backups/pdi_$(date +\%Y\%m\%d).sql
   ```

---

## 📞 Support

### Check Logs

```bash
# Backend logs
sudo journalctl -u pdi_complete-backend -n 100

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# System logs
sudo tail -f /var/log/syslog
```

### Common Checks

```bash
# Check if backend is responding
curl http://localhost:5000/api/health

# Check if frontend is accessible
curl http://localhost/

# Check services status
sudo systemctl status pdi_complete-backend nginx mysql
```

---

## 📝 Development Workflow

### Adding New Features

1. Create feature branch
2. Test locally with `./test_local.sh`
3. Build frontend: `npm run build`
4. Test production build locally
5. Deploy to production with `./deploy_production.sh`

### Updating Production

```bash
# On server
cd ~/pdi_complete

# Pull latest changes
git pull

# Rebuild frontend
cd frontend
npm install
npm run build

# Restart backend
sudo systemctl restart pdi_complete-backend

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🎉 Success Indicators

Application is working correctly when:

- ✅ `http://your-domain.com` loads React app
- ✅ Login page appears
- ✅ After login, you see the dashboard with sidebar
- ✅ All menu items (IPQC, Daily Report, etc.) are accessible
- ✅ You can generate and download PDFs
- ✅ You can upload Excel files
- ✅ No errors in browser console
- ✅ Backend logs show no errors

---

## 📚 Additional Resources

- **Backend API Docs:** Check `backend/README.md`
- **Frontend Docs:** Check `frontend/README.md`
- **Deployment Guide:** `DEPLOYMENT_GUIDE.md`
- **Hostinger Specific:** `backend/HOSTINGER_DEPLOYMENT.md`
- **Testing Guide:** `LOCAL_TESTING_GUIDE.md`

---

## 🤝 Contributing

1. Test changes locally
2. Run `./test_local.sh` to ensure all tests pass
3. Update documentation if needed
4. Create pull request

---

**Made with ❤️ for Gautam Solar**

*Last updated: December 2025*

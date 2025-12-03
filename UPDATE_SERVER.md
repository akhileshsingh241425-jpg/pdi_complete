# 🔄 Server Update Guide - Live Project Update

## Current Server Status
```
Server Path: ~/pdi_complete/
Current Files: Backend + Frontend exist
Status: Running on server
```

---

## 🚀 Quick Update Steps (Server Par)

### Step 1: Backup Current Code (Important!)

```bash
cd ~
cp -r pdi_complete pdi_complete_backup_$(date +%Y%m%d_%H%M%S)

# Verify backup
ls -la pdi_complete_backup_*
```

### Step 2: Pull Latest Changes from Git

```bash
cd ~/pdi_complete

# Check current status
git status

# Stash any local changes (if needed)
git stash

# Pull latest code
git pull origin main

# If stash was used, apply it back
git stash pop
```

### Step 3: Update Backend

```bash
cd ~/pdi_complete/backend

# Activate virtual environment (if exists)
source ~/virtualenv/pdi_backend/3.9/bin/activate

# Install/Update dependencies
pip install -r requirements.txt --upgrade

# Check for any new database migrations
python -c "from app import create_app; app = create_app(); print('✅ App loads successfully')"

# Restart backend application
touch ~/pdi_complete/backend/tmp/restart.txt
# OR
systemctl restart your_app_name  # If using systemd
# OR
pkill -f "python.*run.py" && nohup python run.py &  # If running directly
```

### Step 4: Update Frontend (if needed)

```bash
cd ~/pdi_complete/frontend

# Check if build needs update
npm install

# Rebuild for production
npm run build

# If frontend is served separately, copy build files
# cp -r build/* /var/www/html/frontend/  # Adjust path as needed
```

### Step 5: Verify Update

```bash
# Test backend
curl http://localhost:5002/api/health

# Check backend logs
tail -f ~/pdi_complete/backend/logs/app.log

# Check frontend (if applicable)
curl http://localhost:3000
```

---

## 🆕 New Features Added (Latest Update)

### 1. COC Selection Modal
- **Location:** `frontend/src/components/COCSelectionModal.js`
- **Features:** 
  - Material-wise COC invoice selection
  - Real-time calculations (modules possible, remaining quantity)
  - 12 materials with per-module requirements
  - Color-coded insufficient/sufficient indicators

### 2. Password Protection System
- **Location:** 
  - Backend: `backend/app/routes/auth_routes.py`
  - Frontend: `frontend/src/components/PasswordModal.js`
- **Password:** `241425`
- **Features:**
  - Protects production and COC changes
  - Auto-lock after 5 minutes
  - Beautiful red gradient UI

### 3. Material Requirements Constants
- **Location:** `frontend/src/constants/materialRequirements.js`
- **Details:** 12 materials with exact quantities
  - Solar Cell: 66 PCS
  - Front Glass: 1 PCS
  - Ribbon: 0.212 KG
  - And 9 more materials

### 4. Hostinger Deployment Configuration
- **Files:**
  - `backend/.htaccess` - Updated with Passenger, CORS, Security
  - `backend/passenger_wsgi.py` - Production ready
  - `.env.example` - Environment template
  - Deployment scripts

---

## 📋 Files Changed in Latest Update

### New Files:
```
backend/app/routes/auth_routes.py
frontend/src/components/PasswordModal.js
frontend/src/components/COCSelectionModal.js
frontend/src/components/COCDashboard.js
frontend/src/constants/materialRequirements.js
frontend/src/styles/PasswordModal.css
frontend/src/styles/COCSelectionModal.css
frontend/src/styles/COCDashboard.css
HOSTINGER_DEPLOYMENT_COMPLETE.md
QUICK_DEPLOY.md
prepare_hostinger_deployment.sh
build_frontend_production.sh
```

### Modified Files:
```
backend/app/__init__.py (auth blueprint added)
backend/.htaccess (updated for production)
frontend/src/components/DailyReport.js (password integration)
```

---

## 🔧 Configuration Updates Needed

### 1. Backend Environment Variables

Check if `backend/.env` exists and has:

```bash
cd ~/pdi_complete/backend
nano .env
```

**Required variables:**
```env
# Database
MYSQL_HOST=localhost
MYSQL_USER=your_db_user
MYSQL_PASSWORD=your_db_password
MYSQL_DB=pdi_database

# Security
SECRET_KEY=your-secret-key-here

# Flask
FLASK_ENV=production
DEBUG=False

# CORS
FRONTEND_URL=http://your-frontend-url
```

### 2. Frontend API URL

Update if server URL changed:

```bash
cd ~/pdi_complete/frontend
nano .env.production
```

```env
REACT_APP_API_BASE_URL=http://your-backend-url:5002
```

---

## 🔍 Verification Checklist

After update, verify:

```bash
# ✅ 1. Backend Health
curl http://localhost:5002/api/health
# Expected: {"status": "healthy"}

# ✅ 2. Auth Endpoint (NEW)
curl -X POST http://localhost:5002/api/auth/verify-password \
  -H "Content-Type: application/json" \
  -d '{"password":"241425"}'
# Expected: {"success": true, "valid": true}

# ✅ 3. COC List API (if you have data)
curl http://localhost:5002/api/coc/list
# Expected: {"success": true, "data": [...]}

# ✅ 4. Database Tables
cd ~/pdi_complete/backend
source ~/virtualenv/pdi_backend/3.9/bin/activate
python -c "
from app import create_app
from app.models.database import db
app = create_app()
with app.app_context():
    print('Tables:', db.engine.table_names())
"
```

---

## 🐛 Troubleshooting

### Problem 1: "Module 'auth_routes' not found"

```bash
cd ~/pdi_complete/backend
# Check if file exists
ls -la app/routes/auth_routes.py

# If missing, pull again
git pull origin main

# Restart
touch tmp/restart.txt
```

### Problem 2: Frontend build errors

```bash
cd ~/pdi_complete/frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Problem 3: Database connection error

```bash
# Test connection
cd ~/pdi_complete/backend
source ~/virtualenv/pdi_backend/3.9/bin/activate
python -c "
import pymysql
conn = pymysql.connect(
    host='localhost',
    user='YOUR_USER',
    password='YOUR_PASS',
    db='pdi_database'
)
print('✅ Database Connected!')
conn.close()
"
```

### Problem 4: Password modal not showing

```bash
# Rebuild frontend
cd ~/pdi_complete/frontend
npm run build

# Check if files exist
ls -la src/components/PasswordModal.js
ls -la src/styles/PasswordModal.css
```

---

## 📝 Manual File Copy (if Git Pull fails)

If Git pull has conflicts or issues:

### Option 1: Copy specific files from local to server

```bash
# On your local machine
cd /home/sarvi/pid/pdi_complete

# Copy to server
scp -r backend/app/routes/auth_routes.py root@srv1050488:~/pdi_complete/backend/app/routes/
scp -r frontend/src/components/PasswordModal.js root@srv1050488:~/pdi_complete/frontend/src/components/
scp -r frontend/src/components/COCSelectionModal.js root@srv1050488:~/pdi_complete/frontend/src/components/
scp -r frontend/src/constants/materialRequirements.js root@srv1050488:~/pdi_complete/frontend/src/constants/
scp -r frontend/src/styles/PasswordModal.css root@srv1050488:~/pdi_complete/frontend/src/styles/
scp -r frontend/src/styles/COCSelectionModal.css root@srv1050488:~/pdi_complete/frontend/src/styles/
```

### Option 2: Create files manually on server

See detailed file contents in this document below.

---

## 🆕 NEW FILES CONTENT (For Manual Creation)

### 1. Backend Auth Route

Create: `~/pdi_complete/backend/app/routes/auth_routes.py`

```python
from flask import Blueprint, request, jsonify

auth_bp = Blueprint('auth', __name__)

# Master password for production and COC changes
MASTER_PASSWORD = "241425"

@auth_bp.route('/verify-password', methods=['POST'])
def verify_password():
    """Verify password for production/COC changes"""
    try:
        data = request.get_json()
        password = data.get('password', '')
        
        if password == MASTER_PASSWORD:
            return jsonify({
                'success': True,
                'valid': True,
                'message': 'Password verified successfully'
            }), 200
        else:
            return jsonify({
                'success': True,
                'valid': False,
                'message': 'Invalid password'
            }), 200
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
```

### 2. Register Auth Blueprint

Edit: `~/pdi_complete/backend/app/__init__.py`

Add these lines:

```python
# After other blueprint imports
from app.routes.auth_routes import auth_bp

# In create_app() function, after other blueprint registrations
app.register_blueprint(auth_bp, url_prefix='/api/auth')
```

### 3. Material Requirements Constants

Create: `~/pdi_complete/frontend/src/constants/materialRequirements.js`

```javascript
export const MATERIAL_REQUIREMENTS = {
  'Solar Cell': { quantity: 66, unit: 'PCS', description: '25.3-25.8', cocMaterial: 'Solar Cell' },
  'Front Glass': { quantity: 1, unit: 'PCS', description: '2376', cocMaterial: 'Glass' },
  'Back Glass': { quantity: 1, unit: 'PCS', description: '2376 with 3 hole', cocMaterial: 'Glass' },
  'Ribbon': { quantity: 0.212, unit: 'KG', description: '0.26mm', cocMaterial: 'Ribbon' },
  'Flux': { quantity: 0.02, unit: 'LTR', description: '', cocMaterial: 'Flux' },
  'Busbar 4mm': { quantity: 0.038, unit: 'KG', description: '4.0X0.4 mm', cocMaterial: 'Ribbon' },
  'Busbar 6mm': { quantity: 0.018, unit: 'KG', description: '6.0X0.4 mm', cocMaterial: 'Ribbon' },
  'EPE Front': { quantity: 5.2, unit: 'SQM', description: 'Front', cocMaterial: 'EPE' },
  'Aluminium Frame': { quantity: 1, unit: 'SETS', description: '2382*1134', cocMaterial: 'Aluminium Frame' },
  'Sealant': { quantity: 0.35, unit: 'KG', description: '270KG', cocMaterial: 'Sealant' },
  'JB Potting': { quantity: 0.021, unit: 'KG', description: 'A and B', cocMaterial: 'Potting Material' },
  'Junction Box': { quantity: 1, unit: 'SETS', description: '1200mm', cocMaterial: 'Junction Box' }
};

export const calculateMaterialRequirements = (productionQty) => {
  const requirements = {};
  Object.entries(MATERIAL_REQUIREMENTS).forEach(([materialName, config]) => {
    requirements[materialName] = {
      ...config,
      totalRequired: config.quantity * productionQty,
      formattedQty: `${(config.quantity * productionQty).toFixed(3)} ${config.unit}`
    };
  });
  return requirements;
};
```

---

## 🔄 Complete Update Command (One-liner)

```bash
cd ~/pdi_complete && \
git stash && \
git pull origin main && \
cd backend && source ~/virtualenv/pdi_backend/3.9/bin/activate && pip install -r requirements.txt && \
cd ../frontend && npm install && npm run build && \
cd ../backend && touch tmp/restart.txt && \
echo "✅ Update Complete! Testing..." && \
curl http://localhost:5002/api/health
```

---

## 📞 Post-Update Support

**Check Status:**
```bash
# Backend
systemctl status your_app_name
# OR
ps aux | grep python | grep run.py

# Logs
tail -f ~/pdi_complete/backend/logs/app.log
```

**Rollback (if issues):**
```bash
cd ~
rm -rf pdi_complete
mv pdi_complete_backup_YYYYMMDD_HHMMSS pdi_complete
cd pdi_complete/backend && touch tmp/restart.txt
```

---

## ✅ Update Summary

**What's New:**
1. ✅ Password Protection System (Password: 241425)
2. ✅ COC Selection Modal with material calculations
3. ✅ Material Requirements (12 materials)
4. ✅ COC Dashboard with sync functionality
5. ✅ Hostinger deployment configuration
6. ✅ Production-ready security headers

**Impact:**
- 🔒 Enhanced security for production/COC changes
- 📊 Better material tracking and COC management
- 🚀 Production deployment ready
- 🎨 Improved UI/UX

**Backward Compatible:** YES ✅ (No breaking changes)

---

**🎉 Server update ready! Follow steps above to update your live project! 🎉**

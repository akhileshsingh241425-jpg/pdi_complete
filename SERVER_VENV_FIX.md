# 🔧 Server Environment Fix Guide

## Problem
```
error: externally-managed-environment
Virtual env not found, using system python
```

## Solution - Create Virtual Environment on Server

---

## 🚀 Quick Fix (Copy-Paste on Server)

### Option 1: Automated Setup (Recommended)

```bash
cd ~/pdi_complete
chmod +x setup_server_venv.sh
sudo ./setup_server_venv.sh
```

This will:
- ✅ Install python3-venv if missing
- ✅ Create virtual environment in `backend/venv/`
- ✅ Install all dependencies
- ✅ Create activation helper script
- ✅ Test everything

---

### Option 2: Manual Setup

#### Step 1: Install python3-venv
```bash
sudo apt update
sudo apt install -y python3-venv python3-full
```

#### Step 2: Create Virtual Environment
```bash
cd ~/pdi_complete/backend
python3 -m venv venv
```

#### Step 3: Activate Virtual Environment
```bash
source venv/bin/activate
```

#### Step 4: Upgrade pip
```bash
pip install --upgrade pip
```

#### Step 5: Install Dependencies
```bash
pip install -r requirements.txt
```

#### Step 6: Test
```bash
python -c "from flask import Flask; print('✅ Flask works!')"
```

---

## 📋 After Setup - How to Use

### Start Backend:
```bash
# Activate environment
cd ~/pdi_complete/backend
source venv/bin/activate

# Run application
python run.py
```

### OR use the helper script:
```bash
source ~/activate_pdi.sh
python run.py
```

---

## 🔄 Complete Server Update Commands (After venv setup)

```bash
# 1. Setup virtual environment (one-time)
cd ~/pdi_complete
sudo ./setup_server_venv.sh

# 2. Activate environment
cd ~/pdi_complete/backend
source venv/bin/activate

# 3. Install/Update dependencies
pip install -r requirements.txt

# 4. Test new auth endpoint
python -c "from app.routes.auth_routes import auth_bp; print('✅ Auth routes loaded')"

# 5. Run application
python run.py
```

---

## 🎯 Production Setup with systemd

Create service file: `/etc/systemd/system/pdi_backend.service`

```ini
[Unit]
Description=PDI Backend Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/pdi_complete/backend
Environment="PATH=/root/pdi_complete/backend/venv/bin"
ExecStart=/root/pdi_complete/backend/venv/bin/python run.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable pdi_backend
sudo systemctl start pdi_backend
sudo systemctl status pdi_backend
```

---

## 🔍 Verify Virtual Environment

```bash
cd ~/pdi_complete/backend
source venv/bin/activate

# Check Python path
which python
# Should show: /root/pdi_complete/backend/venv/bin/python

# Check installed packages
pip list

# Test imports
python -c "
from flask import Flask
from app import create_app
print('✅ All imports working!')
"
```

---

## 📦 Dependencies in requirements.txt

Make sure these are installed:
```
Flask==3.0.0
Flask-SQLAlchemy==3.1.1
Flask-CORS==4.0.0
pymysql==1.1.0
python-dotenv==1.0.0
reportlab==4.0.7
pandas==2.1.3
openpyxl==3.1.2
Pillow==10.1.0
cryptography==41.0.7
```

---

## 🐛 Troubleshooting

### Problem: "python3-venv not found"
```bash
sudo apt update
sudo apt install python3-venv python3-full
```

### Problem: "Permission denied"
```bash
sudo chown -R $USER:$USER ~/pdi_complete
```

### Problem: "Module not found" after install
```bash
# Make sure venv is activated
cd ~/pdi_complete/backend
source venv/bin/activate

# Reinstall
pip install -r requirements.txt --force-reinstall
```

### Problem: "Can't create venv"
```bash
# Check disk space
df -h

# Check Python installation
python3 --version
which python3

# Try with full path
/usr/bin/python3 -m venv venv
```

---

## ✅ Success Indicators

After setup, you should see:

```bash
$ source venv/bin/activate
(venv) root@srv1050488:~/pdi_complete/backend$ which python
/root/pdi_complete/backend/venv/bin/python

(venv) root@srv1050488:~/pdi_complete/backend$ python run.py
 * Serving Flask app 'app'
 * Debug mode: off
WARNING: This is a development server. Do not use it in production.
 * Running on http://127.0.0.1:5002
```

---

## 🎉 Final Verification

```bash
# 1. Activate venv
cd ~/pdi_complete/backend
source venv/bin/activate

# 2. Test backend
python run.py &
sleep 2

# 3. Test endpoints
curl http://localhost:5002/api/health
curl -X POST http://localhost:5002/api/auth/verify-password \
  -H "Content-Type: application/json" \
  -d '{"password":"241425"}'

# 4. Kill test server
pkill -f "python run.py"
```

Expected output:
```json
{"status":"healthy"}
{"success":true,"valid":true,"message":"Password verified successfully"}
```

---

## 📝 Quick Reference

### Activate venv:
```bash
cd ~/pdi_complete/backend && source venv/bin/activate
```

### Deactivate venv:
```bash
deactivate
```

### Update dependencies:
```bash
source venv/bin/activate
pip install -r requirements.txt --upgrade
```

### Add new package:
```bash
source venv/bin/activate
pip install package-name
pip freeze > requirements.txt
```

---

**🎊 Virtual environment setup ke baad, aapka server ready ho jayega! 🎊**

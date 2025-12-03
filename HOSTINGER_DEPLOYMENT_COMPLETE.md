# 🚀 Complete Hostinger Deployment Guide - PDI System

## 📋 Pre-Deployment Requirements

### What You Need:
1. **Hostinger Account** with Python hosting plan
2. **Domain Name** (e.g., yourdomain.com)
3. **SSH Access** enabled in Hostinger
4. **MySQL Database** access in Hostinger
5. **Git** installed (or FileZilla for FTP upload)

---

## 🎯 PART 1: Backend Deployment on Hostinger

### Step 1: Setup MySQL Database

1. **Login to Hostinger Control Panel** (hPanel)
2. **Go to:** Databases → MySQL Databases
3. **Create New Database:**
   ```
   Database Name: pdi_database
   Username: pdi_user (or your choice)
   Password: [Generate Strong Password]
   ```
4. **Save these credentials** - you'll need them!

### Step 2: Connect via SSH

```bash
# Connect to Hostinger via SSH
ssh u123456789@yourdomain.com -p 65002

# Replace:
# - u123456789 with your actual Hostinger username
# - yourdomain.com with your actual domain
# - Port may vary (check Hostinger documentation)
```

### Step 3: Setup Python Virtual Environment

```bash
# Create virtual environment
cd ~
python3 -m venv virtualenv/pdi_backend/3.9

# Activate virtual environment
source virtualenv/pdi_backend/3.9/bin/activate

# Upgrade pip
pip install --upgrade pip
```

### Step 4: Upload Backend Files

**Method A: Using Git (Recommended)**
```bash
cd ~/public_html
git clone https://github.com/akhileshsingh241425-jpg/pdi_complete.git temp
mv temp/backend/* .
mv temp/backend/.htaccess .
rm -rf temp
```

**Method B: Using FileZilla/FTP**
1. Connect to Hostinger FTP
2. Upload entire `backend/` folder to `public_html/`
3. Make sure `.htaccess` is uploaded

### Step 5: Install Python Dependencies

```bash
cd ~/public_html
source ~/virtualenv/pdi_backend/3.9/bin/activate

# Install all requirements
pip install -r requirements.txt

# Verify installation
pip list
```

### Step 6: Configure Environment Variables

```bash
cd ~/public_html

# Create .env file
nano .env
```

**Copy and paste this, then update with YOUR credentials:**
```env
# DATABASE (Update with Hostinger MySQL credentials)
MYSQL_HOST=localhost
MYSQL_USER=your_hostinger_db_username
MYSQL_PASSWORD=your_hostinger_db_password
MYSQL_DB=pdi_database

# FLASK
SECRET_KEY=your-secret-key-here-generate-random-32-chars
FLASK_ENV=production
DEBUG=False

# FILE UPLOADS
MAX_CONTENT_LENGTH=524288000
UPLOAD_FOLDER=uploads
GENERATED_PDF_FOLDER=generated_pdfs

# CORS (Update with your frontend domain)
FRONTEND_URL=https://yourdomain.com
```

**Save:** Press `Ctrl+X`, then `Y`, then `Enter`

### Step 7: Update .htaccess with Your Username

```bash
nano .htaccess
```

**Replace `YOUR_USERNAME` with your actual Hostinger username:**
```apache
PassengerAppRoot /home/YOUR_ACTUAL_USERNAME/public_html
PassengerPython /home/YOUR_ACTUAL_USERNAME/virtualenv/pdi_backend/3.9/bin/python3
```

**Find your username:**
```bash
whoami
```

### Step 8: Create Upload Directories

```bash
cd ~/public_html
mkdir -p uploads
mkdir -p uploads/bom_materials
mkdir -p uploads/ipqc_pdfs
mkdir -p uploads/ftr_documents
mkdir -p generated_pdfs

# Set permissions
chmod -R 755 uploads
chmod -R 755 generated_pdfs
```

### Step 9: Initialize Database Tables

```bash
cd ~/public_html
source ~/virtualenv/pdi_backend/3.9/bin/activate

# Run database initialization
python init_db.py

# Create master tables
python create_master_tables.py

# Create COC tables
python create_coc_tables.py
```

### Step 10: Restart Application

**In Hostinger Control Panel:**
1. Go to: **Advanced → Python Selector**
2. Find your application
3. Click **Restart**

**Or via SSH:**
```bash
touch ~/public_html/tmp/restart.txt
```

### Step 11: Test Backend

```bash
# Test if backend is running
curl https://yourdomain.com/api/health

# Should return: {"status": "healthy"}
```

---

## 🎨 PART 2: Frontend Deployment

### Step 1: Update Frontend API URL

On your local machine:

```bash
cd /home/sarvi/pid/pdi_complete/frontend

# Create production environment file
nano .env.production
```

**Add:**
```env
REACT_APP_API_BASE_URL=https://yourdomain.com
```

### Step 2: Build Frontend

```bash
cd /home/sarvi/pid/pdi_complete/frontend

# Install dependencies (if not already)
npm install

# Build for production
npm run build
```

This creates a `build/` folder with optimized files.

### Step 3: Deploy Frontend

**Option A: Deploy to Hostinger (same domain)**

```bash
# Upload build folder contents to public_html/frontend/
# Using FileZilla or command:

cd build
scp -P 65002 -r * u123456789@yourdomain.com:~/public_html/frontend/
```

Then access at: `https://yourdomain.com/frontend/`

**Option B: Deploy to Netlify/Vercel (Recommended)**

1. **Go to Netlify.com or Vercel.com**
2. **Connect GitHub repository**
3. **Build settings:**
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `build`
4. **Environment Variables:**
   - `REACT_APP_API_BASE_URL=https://yourdomain.com`
5. **Deploy!**

---

## 🔧 PART 3: Post-Deployment Configuration

### 1. Update CORS in Backend

Edit `backend/config.py`:
```python
FRONTEND_URL = os.getenv('FRONTEND_URL', 'https://your-actual-frontend-domain.com')
```

### 2. Update Password Protection

Password is already set to: `241425`

To change, edit `backend/app/routes/auth_routes.py`:
```python
MASTER_PASSWORD = "your_new_password"
```

### 3. SSL Certificate

**Hostinger automatically provides SSL** for your domain.

Enable it:
1. Go to: **Hostinger Control Panel → SSL**
2. Enable SSL for your domain
3. Force HTTPS redirect

### 4. Verify All Features

Test these URLs:
```
✅ Backend Health: https://yourdomain.com/api/health
✅ Companies List: https://yourdomain.com/api/companies
✅ COC List: https://yourdomain.com/api/coc/list
✅ Auth Verify: https://yourdomain.com/api/auth/verify-password
```

---

## 🐛 Troubleshooting

### Problem 1: "500 Internal Server Error"

**Solution:**
```bash
# Check error logs
cd ~/public_html
tail -f logs/error.log

# Or check Passenger logs
tail -f ~/passenger.log
```

### Problem 2: "Database Connection Failed"

**Solution:**
```bash
# Verify .env file
cd ~/public_html
cat .env

# Test database connection
python -c "import pymysql; conn = pymysql.connect(host='localhost', user='YOUR_USER', password='YOUR_PASS', db='pdi_database'); print('Connected!')"
```

### Problem 3: "Module Not Found"

**Solution:**
```bash
# Reinstall requirements
source ~/virtualenv/pdi_backend/3.9/bin/activate
pip install -r requirements.txt --force-reinstall
```

### Problem 4: "CORS Error" in Frontend

**Solution:**
Update `backend/.htaccess`:
```apache
Header set Access-Control-Allow-Origin "https://your-frontend-domain.com"
```

Then restart:
```bash
touch ~/public_html/tmp/restart.txt
```

### Problem 5: "Upload Directory Not Writable"

**Solution:**
```bash
cd ~/public_html
chmod -R 755 uploads
chmod -R 755 generated_pdfs
```

---

## 📱 Accessing Your Application

After successful deployment:

1. **Backend API:** `https://yourdomain.com/api/`
2. **Frontend:** `https://your-frontend-domain.com/`
3. **Admin Panel:** Login with your credentials
4. **Password for Production/COC changes:** `241425`

---

## 🔒 Security Checklist

- [ ] Changed default SECRET_KEY in .env
- [ ] Strong MySQL password set
- [ ] SSL enabled (HTTPS)
- [ ] Debug mode disabled (DEBUG=False)
- [ ] .env file NOT committed to Git
- [ ] File upload directories have correct permissions
- [ ] CORS configured with actual domain (not *)
- [ ] Regular database backups enabled

---

## 📞 Support

**Hostinger Support:**
- Email: support@hostinger.com
- Live Chat: Available 24/7
- Knowledge Base: https://support.hostinger.com

**Application Issues:**
- Check logs: `~/public_html/logs/`
- SSH access: `ssh u123456789@yourdomain.com -p 65002`
- Restart app: `touch ~/public_html/tmp/restart.txt`

---

## 🎉 Deployment Checklist

### Pre-Deployment:
- [ ] Hostinger account active
- [ ] Domain connected
- [ ] MySQL database created
- [ ] SSH access enabled

### Backend Deployment:
- [ ] Files uploaded to `public_html/`
- [ ] Virtual environment created
- [ ] Dependencies installed
- [ ] .env configured with correct credentials
- [ ] .htaccess updated with username
- [ ] Upload directories created
- [ ] Database tables initialized
- [ ] Application restarted

### Frontend Deployment:
- [ ] .env.production created
- [ ] `npm run build` executed
- [ ] Build files uploaded/deployed
- [ ] API_BASE_URL pointing to backend

### Testing:
- [ ] Backend health check passes
- [ ] Frontend loads without errors
- [ ] Login works
- [ ] Production form works
- [ ] COC selection works
- [ ] Password protection works (241425)
- [ ] File uploads work
- [ ] PDF generation works

### Security:
- [ ] SSL enabled
- [ ] CORS configured properly
- [ ] DEBUG=False
- [ ] Strong passwords set

---

## 🚀 Quick Deploy Commands (Summary)

```bash
# 1. SSH Connect
ssh u123456789@yourdomain.com -p 65002

# 2. Setup Virtual Environment
python3 -m venv ~/virtualenv/pdi_backend/3.9
source ~/virtualenv/pdi_backend/3.9/bin/activate

# 3. Clone/Upload Code
cd ~/public_html
git clone https://github.com/akhileshsingh241425-jpg/pdi_complete.git temp
mv temp/backend/* .
rm -rf temp

# 4. Install Dependencies
pip install -r requirements.txt

# 5. Configure Environment
nano .env  # Add your credentials

# 6. Update .htaccess
nano .htaccess  # Replace YOUR_USERNAME

# 7. Create Directories
mkdir -p uploads/bom_materials uploads/ipqc_pdfs uploads/ftr_documents generated_pdfs
chmod -R 755 uploads generated_pdfs

# 8. Initialize Database
python init_db.py
python create_master_tables.py
python create_coc_tables.py

# 9. Restart Application
touch tmp/restart.txt

# 10. Test
curl https://yourdomain.com/api/health
```

**Frontend:**
```bash
# On local machine
cd frontend
npm run build

# Upload build folder to Hostinger or deploy to Netlify/Vercel
```

---

**🎊 Congratulations! Your PDI System is now live on Hostinger! 🎊**

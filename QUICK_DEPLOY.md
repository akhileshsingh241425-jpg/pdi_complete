# 🚀 Hostinger Deployment - Quick Start Guide

## ⚡ TL;DR - Quick Deployment Steps

### 1️⃣ Prepare Deployment Package (2 minutes)
```bash
cd /home/sarvi/pid/pdi_complete
./prepare_hostinger_deployment.sh
```
**Output:** Creates `pdi_backend_deploy_YYYYMMDD_HHMMSS/` folder with all files

---

### 2️⃣ Upload to Hostinger (5 minutes)

**Option A: Using FileZilla (Easiest)**
1. Download FileZilla: https://filezilla-project.org/
2. Connect to Hostinger:
   - Host: `ftp.yourdomain.com`
   - Username: Your Hostinger FTP username
   - Password: Your Hostinger FTP password
   - Port: 21
3. Upload entire `pdi_backend_deploy_*/` contents to `/public_html/`

**Option B: Using SSH/SCP**
```bash
# Connect and upload
scp -P 65002 -r pdi_backend_deploy_*/* username@yourdomain.com:~/public_html/
```

---

### 3️⃣ Configure Database (3 minutes)

**In Hostinger Control Panel:**
1. Go to: **Databases → MySQL Databases**
2. Click: **Create New Database**
3. Enter:
   - Database Name: `pdi_database`
   - Username: `pdi_user` (or your choice)
   - Password: [Generate Strong Password]
4. Click: **Create**
5. **Save these credentials!**

---

### 4️⃣ Setup via SSH (10 minutes)

```bash
# 1. Connect to Hostinger
ssh u123456789@yourdomain.com -p 65002

# 2. Find your username
whoami
# Output: u123456789 (this is YOUR_USERNAME)

# 3. Create Virtual Environment
python3 -m venv ~/virtualenv/pdi_backend/3.9
source ~/virtualenv/pdi_backend/3.9/bin/activate

# 4. Install Dependencies
cd ~/public_html
pip install -r requirements.txt

# 5. Create .env file
nano .env
```

**Paste this in nano (update with YOUR credentials):**
```env
MYSQL_HOST=localhost
MYSQL_USER=pdi_user
MYSQL_PASSWORD=your_strong_password_from_step_3
MYSQL_DB=pdi_database

SECRET_KEY=change-this-to-random-32-character-string
FLASK_ENV=production
DEBUG=False

FRONTEND_URL=https://yourdomain.com
```

**Save:** `Ctrl+X` → `Y` → `Enter`

```bash
# 6. Update .htaccess with YOUR username
nano .htaccess
```

**Find and replace:**
- Change `YOUR_USERNAME` to your actual username (from step 2)
- Example: `u123456789`

**Save:** `Ctrl+X` → `Y` → `Enter`

```bash
# 7. Create Upload Directories
mkdir -p uploads/bom_materials uploads/ipqc_pdfs uploads/ftr_documents generated_pdfs
chmod -R 755 uploads generated_pdfs

# 8. Initialize Database
python init_db.py
python create_master_tables.py
python create_coc_tables.py

# 9. Restart Application
mkdir -p tmp
touch tmp/restart.txt

# 10. Test Backend
curl https://yourdomain.com/api/health
```

**Expected Output:** `{"status":"healthy"}`

---

### 5️⃣ Deploy Frontend (5 minutes)

**On your local machine:**

```bash
cd /home/sarvi/pid/pdi_complete
./build_frontend_production.sh
```

**When prompted, enter:**
- Backend URL: `https://yourdomain.com`

**Deploy Options:**

**Option A: Netlify (Recommended - Free & Fast)**
1. Go to: https://netlify.com
2. Sign up/Login with GitHub
3. Click: **Add new site → Deploy manually**
4. Drag & drop the `frontend/build/` folder
5. Done! Get instant URL like: `https://your-app.netlify.app`

**Option B: Vercel (Alternative)**
1. Go to: https://vercel.com
2. Sign up/Login
3. Install: `npm i -g vercel`
4. Run: `cd frontend && vercel --prod`
5. Follow prompts

**Option C: Upload to Hostinger**
```bash
cd frontend/build
scp -P 65002 -r * username@yourdomain.com:~/public_html/frontend/
```
Access at: `https://yourdomain.com/frontend/`

---

### 6️⃣ Update CORS (2 minutes)

**After frontend deployment, update backend CORS:**

```bash
ssh u123456789@yourdomain.com -p 65002
cd ~/public_html
nano .htaccess
```

**Find and update:**
```apache
Header set Access-Control-Allow-Origin "https://your-actual-frontend-domain.com"
```

**Examples:**
- Netlify: `https://your-app.netlify.app`
- Vercel: `https://your-app.vercel.app`
- Hostinger: `https://yourdomain.com`

**Save and restart:**
```bash
touch tmp/restart.txt
```

---

## ✅ Verification Checklist

Test these URLs:

- [ ] Backend Health: `https://yourdomain.com/api/health`
- [ ] Companies API: `https://yourdomain.com/api/companies`
- [ ] COC API: `https://yourdomain.com/api/coc/list`
- [ ] Frontend loads: `https://your-frontend-domain.com`
- [ ] Login works
- [ ] Production form works
- [ ] COC selection works (password: `241425`)
- [ ] File upload works
- [ ] PDF generation works

---

## 🐛 Quick Troubleshooting

### Problem: "500 Internal Server Error"
```bash
ssh u123456789@yourdomain.com -p 65002
cd ~/public_html
tail -f logs/error.log
```

### Problem: "Database Connection Failed"
```bash
# Test database connection
cd ~/public_html
source ~/virtualenv/pdi_backend/3.9/bin/activate
python -c "import pymysql; conn = pymysql.connect(host='localhost', user='YOUR_USER', password='YOUR_PASS', db='pdi_database'); print('✅ Connected!')"
```

### Problem: "CORS Error"
Update `backend/.htaccess` with correct frontend domain and restart:
```bash
touch ~/public_html/tmp/restart.txt
```

### Problem: "Module Not Found"
```bash
source ~/virtualenv/pdi_backend/3.9/bin/activate
pip install -r requirements.txt --force-reinstall
```

---

## 📱 Access Your Application

After successful deployment:

- **Backend API:** `https://yourdomain.com/api/`
- **Frontend:** `https://your-frontend-domain.com/`
- **Admin Access:** Login with credentials
- **Production/COC Password:** `241425`

---

## 📞 Need Help?

**Detailed Guide:** See `HOSTINGER_DEPLOYMENT_COMPLETE.md`

**Hostinger Support:**
- Live Chat: 24/7 in hPanel
- Email: support@hostinger.com
- Knowledge Base: https://support.hostinger.com

**Common Issues:** Check logs in `~/public_html/logs/`

---

## 🎉 Success Indicators

You've successfully deployed when you see:

✅ Backend health check returns `{"status":"healthy"}`  
✅ Frontend loads without errors  
✅ Login page appears  
✅ Can create production entries  
✅ COC selection modal works  
✅ Password protection (241425) works  
✅ File uploads work  
✅ PDF generation works  

**🎊 Congratulations! Your PDI System is LIVE! 🎊**

---

## ⏱️ Estimated Total Time

- Preparation: 2 minutes
- Upload: 5 minutes
- Database Setup: 3 minutes
- SSH Configuration: 10 minutes
- Frontend Build: 5 minutes
- CORS Update: 2 minutes
- Testing: 5 minutes

**Total: ~30 minutes** ⚡

---

## 📝 Important URLs to Save

```
Backend:  https://yourdomain.com
Frontend: https://your-app.netlify.app (or your chosen domain)
Database: Hostinger hPanel → Databases
SSH:      ssh username@yourdomain.com -p 65002
FTP:      ftp.yourdomain.com:21
```

---

**Last Updated:** December 3, 2025  
**Version:** 1.0  
**Status:** Production Ready ✅

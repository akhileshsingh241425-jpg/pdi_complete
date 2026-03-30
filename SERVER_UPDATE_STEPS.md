# Server Pe Code Update Karne Ke Steps

## Server Details
- **IP:** 93.127.194.235
- **User:** root
- **Project Path:** /root/ipqc
- **Process Manager:** PM2
- **Backend PM2 Name:** pdi-backend
- **Frontend PM2 Name:** pdi-frontend
- **Git Remote:** origin (https://github.com/akhileshsingh241425-jpg/pdi_complete.git)
- **Branch:** main

---

## QUICK DEPLOY - Copy-Paste (Server Terminal Me)

```bash
cd /root/ipqc
git pull origin main
cd frontend && npm run build
cd ..
pm2 restart pdi-backend pdi-frontend
echo "✓ Deploy complete!"
```

---

## Step-by-Step Method

### 1. SSH se connect karo
```bash
ssh root@93.127.194.235
```

### 2. Project folder me jao
```bash
cd /root/ipqc
```

### 3. Git pull karo
```bash
git pull origin main
```

### 4. Frontend build karo (agar frontend changes hain)
```bash
cd frontend
npm run build
cd ..
```

### 5. Backend dependencies update karo (agar naye packages hain)
```bash
pip install -r backend/requirements.txt
```

### 6. PM2 restart karo
```bash
pm2 restart pdi-backend pdi-frontend
```

### 7. Check karo sab chal raha hai
```bash
pm2 status
```

---

## Troubleshooting

### Git pull nahi ho raha / conflict aa raha?
```bash
cd /root/ipqc
git stash
git pull origin main
```

### Ya force pull (WARNING: local changes jayenge)
```bash
cd /root/ipqc
git fetch origin
git reset --hard origin/main
```

### PM2 process crash ho raha?
```bash
pm2 logs pdi-backend --lines 50
pm2 logs pdi-frontend --lines 50
```

### Sab PM2 processes dekhne ke liye
```bash
pm2 status
```

### Frontend build error?
```bash
cd /root/ipqc/frontend
npm install
npm run build
```

---

## Important Notes

1. **Backup pehle lo:** Database export kar lo update se pehle
2. **Test karo:** Update ke baad test URL kholo browser me
3. **Logs check karo:** `tail -f ~/logs/error_log` errors dekhne ke liye
4. **.env file:** Update mat karo git se, manually check karo
5. **uploads/ folder:** Git me nahi hai, manually create karna padega

---

## Test URLs After Update

- API Health: http://103.108.220.227/api/health
- COC Management: http://103.108.220.227/coc-management
- BOM Image: http://103.108.220.227/api/uploads/bom_materials/test.jpg
- Frontend: http://103.108.220.227/

---

## Agar koi issue aaye toh:

1. Error logs dekho: `tail -100 ~/logs/error_log`
2. Application restart: `touch tmp/restart.txt`
3. Python version check: `python --version` (should be 3.9+)
4. Database connectivity: `mysql -u username -p database_name`
5. File permissions: `ls -la` and fix with `chmod`

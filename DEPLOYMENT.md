# Complete Production Server Setup & Deployment Guide

This guide walks you through deploying **InterestAccurate** on a cloud server (Ubuntu 22.04 LTS or 24.04 LTS) with zero-configuration embedded SQLite database, automated process management (PM2), Nginx reverse proxy, and free SSL certificate.

---

## ⚡ Quick 1-Command Automated Setup

If you already have an Ubuntu server, connect via SSH and run this single block:

```bash
# 1. Clone your GitHub repository
cd /var/www
sudo git clone https://github.com/kevin252303/InterestAccurate.git
cd InterestAccurate

# 2. Make deployment script executable and run it
chmod +x deploy.sh
./deploy.sh
```

The script automatically:
* Updates Ubuntu packages
* Installs Node.js 22 LTS, Git, build-essential, Nginx, and Certbot
* Installs PM2 process manager
* Installs dependencies and builds the optimized frontend bundle
* Generates a secure `.env` file with random JWT secret
* Starts the app in PM2 and enables auto-start on server boot
* Schedules an automated daily SQLite database backup at 2:00 AM

---

## 📋 Step-by-Step Manual Setup

If you prefer to run each step manually:

### 1. Update Server & Install Node.js 22
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git build-essential nginx certbot python3-certbot-nginx
```

### 2. Clone Repository
```bash
cd /var/www
git clone https://github.com/kevin252303/InterestAccurate.git
cd InterestAccurate
```

### 3. Install Dependencies & Build Frontend
```bash
# Root backend dependencies
npm install

# Frontend bundle
cd client
npm install
npm run build
cd ..
```

### 4. Environment Variables
Create your production `.env` file:
```bash
cat <<EOF > .env
PORT=5000
NODE_ENV=production
JWT_SECRET=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 32)
JWT_EXPIRES_IN=7d
EOF
```

### 5. Database Setup (Zero Config!)
**You do NOT need to install MySQL, PostgreSQL, or any DB server.**
The SQLite database engine is embedded inside Node.js.
The database file `server/interest_accurate.db` and all tables will automatically be created the moment the server starts.

*(Optional)* If you want to load demo borrowers and loans:
```bash
node --experimental-sqlite server/seed.js
```

### 6. Start Application with PM2
```bash
sudo npm install -g pm2

# Start background process
pm2 start "node --experimental-sqlite server/index.js" --name "interest-accurate"

# Save process list and enable systemd startup on server reboot
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

---

## 🌐 Nginx Domain & Reverse Proxy Setup

To connect your domain (e.g., `app.yourdomain.com`) to port 5000:

1. Create Nginx site configuration:
```bash
sudo nano /etc/nginx/sites-available/interest-accurate
```

2. Paste the following configuration:
```nginx
server {
    listen 80;
    server_name app.yourdomain.com; # Replace with your domain or server IP

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. Enable the configuration and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/interest-accurate /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 Free SSL Certificate (HTTPS)

Once your domain's DNS A-record points to your server's IP:
```bash
sudo certbot --nginx -d app.yourdomain.com
```
Certbot will configure HTTPS automatically with free auto-renewal every 90 days.

---

## 💾 Daily Database Backup & Restore

### Backup
All customer data, loans, and interest records live in `/var/www/InterestAccurate/server/interest_accurate.db`.

To schedule an automated backup every night at 2:00 AM:
```bash
mkdir -p /var/backups/interest_accurate
crontab -e
```
Add this line:
```cron
0 2 * * * cp /var/www/InterestAccurate/server/interest_accurate.db /var/backups/interest_accurate/interest_backup_$(date +\%Y\%m\%d).db
```

### Restore (If ever needed)
To restore from a backup:
```bash
pm2 stop interest-accurate
cp /var/backups/interest_accurate/interest_backup_YYYYMMDD.db /var/www/InterestAccurate/server/interest_accurate.db
pm2 start interest-accurate
```

---

## 🔄 Deploying Future Updates

Whenever you make changes or push updates to your GitHub repository:
```bash
cd /var/www/InterestAccurate
git pull origin main
cd client && npm install && npm run build && cd ..
npm install
pm2 restart interest-accurate
```

---

## 🛠️ Handy PM2 Commands

* **Check Status**: `pm2 status`
* **View Live Logs**: `pm2 logs interest-accurate`
* **Restart Server**: `pm2 restart interest-accurate`
* **Stop Server**: `pm2 stop interest-accurate`
* **Monitor CPU/RAM**: `pm2 monit`

#!/usr/bin/env bash
# ==============================================================================
# InterestAccurate — Automated Production Server Setup & Deployment Script
# Target OS: Ubuntu 22.04 LTS / 24.04 LTS
# ==============================================================================

set -e # Exit immediately if a command exits with a non-zero status

echo ""
echo "======================================================================"
echo "🚀 Starting Automated Setup for InterestAccurate Multi-Tenant SaaS"
echo "======================================================================"
echo ""

# 1. Update system packages
echo "📦 [1/7] Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 22 LTS & Build Essentials
echo "📦 [2/7] Installing Node.js 22 LTS, Git, Nginx, and Certbot..."
if ! command -v node > /dev/null || ! node -v | grep -q "v22"; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt install -y nodejs
fi

sudo apt install -y git build-essential nginx certbot python3-certbot-nginx

# 3. Install Global PM2 Process Manager
echo "⚙️  [3/7] Installing PM2 process manager..."
sudo npm install -g pm2

# 4. Install Project Dependencies
echo "📥 [4/7] Installing backend dependencies..."
npm install

echo "📥 [5/7] Installing and building frontend bundle..."
cd client
npm install
npm run build
cd ..

# 5. Setup Production Environment (.env)
echo "🔒 [6/7] Configuring production environment variables..."
if [ ! -f .env ]; then
  # Generate a random 32-character secret key
  RANDOM_SECRET=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 32)
  cat <<EOF > .env
PORT=5000
NODE_ENV=production
JWT_SECRET=ia_sec_${RANDOM_SECRET}
JWT_EXPIRES_IN=7d
EOF
  echo "✅ Created new .env file with generated secure JWT secret."
else
  echo "ℹ️  Existing .env file detected, preserving current secrets."
fi

# 6. Configure PM2 Daemon
echo "🔄 [7/7] Launching application with PM2 process manager..."
if pm2 list | grep -q "interest-accurate"; then
  pm2 reload interest-accurate
  echo "✅ PM2 process reloaded."
else
  pm2 start "node --experimental-sqlite server/index.js" --name "interest-accurate"
  pm2 save
  sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME || true
  echo "✅ PM2 service registered and set to auto-start on server boot."
fi

# 7. Setup Automated Database Backup Cron
echo "💾 Configuring daily automated database backup cron..."
BACKUP_DIR="/var/backups/interest_accurate"
sudo mkdir -p $BACKUP_DIR
sudo chown -R $USER:$USER $BACKUP_DIR

CRON_CMD="0 2 * * * cp $(pwd)/server/interest_accurate.db ${BACKUP_DIR}/interest_backup_\$(date +\\%Y\\%m\\%d).db"
(crontab -l 2>/dev/null | grep -v "interest_accurate.db" ; echo "$CRON_CMD") | crontab -

echo ""
echo "======================================================================"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================================================================"
echo "🌐 Local App URL: http://localhost:5000"
echo "👑 Developer Super-Admin: Login PIN 'dev@1234'"
echo "📁 Database: $(pwd)/server/interest_accurate.db (Auto-created & active)"
echo "💾 Daily Backup Cron: Configured for 2:00 AM daily in ${BACKUP_DIR}"
echo ""
echo "Next step: Point your Nginx domain to http://127.0.0.1:5000 and run:"
echo "sudo certbot --nginx -d yourdomain.com"
echo "======================================================================"
echo ""

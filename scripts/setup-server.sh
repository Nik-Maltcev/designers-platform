#!/bin/bash
# Установка ПроектЛист на VPS (Ubuntu 22/24)
# Запуск: curl -sL https://raw.githubusercontent.com/Nik-Maltcev/designers-platform/main/scripts/setup-server.sh | bash

set -e

echo "🚀 Установка ПроектЛист..."

# 1. Node.js
if ! command -v node &> /dev/null; then
  echo "📦 Устанавливаю Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
  sudo apt install -y nodejs
fi

# 2. PostgreSQL
if ! command -v psql &> /dev/null; then
  echo "📦 Устанавливаю PostgreSQL..."
  sudo apt install -y postgresql
  sudo -u postgres createuser --superuser projektlist 2>/dev/null || true
  sudo -u postgres createdb projektlist 2>/dev/null || true
fi

# 3. Nginx
if ! command -v nginx &> /dev/null; then
  echo "📦 Устанавливаю Nginx..."
  sudo apt install -y nginx certbot python3-certbot-nginx
fi

# 4. PM2
if ! command -v pm2 &> /dev/null; then
  echo "📦 Устанавливаю PM2..."
  sudo npm install -g pm2
fi

# 5. Клонирую репо
cd /opt
if [ ! -d "designers-platform" ]; then
  sudo git clone https://github.com/Nik-Maltcev/designers-platform.git
  sudo chown -R $USER:$USER designers-platform
fi
cd designers-platform

# 6. Зависимости
npm install

# 7. .env
if [ ! -f ".env" ]; then
  cat > .env << 'ENVEOF'
DATABASE_URL="postgresql://projektlist@localhost:5432/projektlist"
AUTH_SECRET="mWcQE7aKlm36orL0+f4aPR38T48ydQWUMuxNdRL2KA4"
AUTH_TRUST_HOST=true
EMAIL_SERVER_HOST="smtp.yandex.ru"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="verify@projectlist.pro"
EMAIL_SERVER_PASSWORD="Amx50100%heavytank"
EMAIL_FROM="ПроектЛист <verify@projectlist.pro>"
NEXTAUTH_URL="https://www.projectlist.pro"
MOONSHOT_API_KEY="sk-Iq8P8Ce8pM279G3PuR8oXg7X4ONrlJbiib0UdBrzp57qKCys"
CHECKKO_API_KEY="7PclHKCe9YOAvl29"
DATANEWTON_API_KEY="LVGq6Yr41PyX"
ENVEOF
  echo "⚠️  Отредактируй .env: nano /opt/designers-platform/.env"
fi

# 8. БД + Билд
npx prisma db push
npm run build

# 9. Запуск
pm2 delete projektlist 2>/dev/null || true
pm2 start npm --name projektlist -- start
pm2 save
pm2 startup | tail -1 | bash

# 10. Nginx
sudo tee /etc/nginx/sites-available/projektlist > /dev/null << 'NGINX'
server {
    listen 80;
    server_name projectlist.pro www.projectlist.pro;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX
sudo ln -sf /etc/nginx/sites-available/projektlist /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "✅ Готово!"
echo "1. Отредактируй .env: nano /opt/designers-platform/.env"
echo "2. Направь DNS A-запись projectlist.pro на IP этого сервера"
echo "3. После DNS: sudo certbot --nginx -d projectlist.pro"
echo "4. Перезапуск: cd /opt/designers-platform && pm2 restart projektlist"

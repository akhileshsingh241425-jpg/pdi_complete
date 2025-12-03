#!/bin/bash

# PDI Complete - Nginx Update Script
# Updates backend proxy port from 4001 to 5002

set -e

echo "=========================================="
echo "PDI Complete - Nginx Configuration Update"
echo "=========================================="
echo ""

CONFIG_FILE="/etc/nginx/sites-available/pdi_complete"
BACKUP_FILE="/etc/nginx/sites-available/pdi_complete.backup.$(date +%Y%m%d_%H%M%S)"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

echo "📋 Current Configuration:"
echo "------------------------"
grep "proxy_pass" $CONFIG_FILE || echo "No proxy_pass found"
echo ""

# Backup
echo "💾 Creating backup..."
cp $CONFIG_FILE $BACKUP_FILE
echo "✅ Backup created: $BACKUP_FILE"
echo ""

# Update port 4001 → 5002
echo "🔧 Updating backend proxy port 4001 → 5002..."
sed -i 's/http:\/\/localhost:4001/http:\/\/localhost:5002/g' $CONFIG_FILE
echo "✅ Configuration updated"
echo ""

echo "📋 New Configuration:"
echo "--------------------"
grep "proxy_pass" $CONFIG_FILE
echo ""

# Test configuration
echo "🧪 Testing Nginx configuration..."
if nginx -t; then
    echo "✅ Nginx configuration is valid"
    echo ""
    
    # Reload Nginx
    echo "🔄 Reloading Nginx..."
    systemctl reload nginx
    echo "✅ Nginx reloaded successfully"
    echo ""
    
    echo "=========================================="
    echo "✅ UPDATE COMPLETE!"
    echo "=========================================="
    echo ""
    echo "Frontend URL: http://pdi.gspl.cloud:4000"
    echo "Backend API:  http://localhost:5002/api"
    echo ""
    echo "Test the site:"
    echo "  curl -I http://pdi.gspl.cloud:4000"
    echo ""
else
    echo "❌ Nginx configuration test failed!"
    echo "Restoring backup..."
    cp $BACKUP_FILE $CONFIG_FILE
    echo "✅ Backup restored"
    exit 1
fi

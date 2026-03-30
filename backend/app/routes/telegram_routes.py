"""
Telegram Bot Routes — Hourly Dispatch Summary per Party
Sends automated dispatch reports to Telegram chat/group every hour.
"""

from flask import Blueprint, request, jsonify
from config import Config
import os
import json
import requests
import pymysql
import time
import threading
from datetime import datetime, timedelta

telegram_bp = Blueprint('telegram', __name__, url_prefix='/api/telegram')

# ============================================================
# CONFIG FILE - stores bot token, chat IDs, and schedule
# ============================================================
CONFIG_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'telegram_config')
CONFIG_FILE = os.path.join(CONFIG_DIR, 'config.json')

def _load_config():
    """Load Telegram config from JSON file."""
    if not os.path.exists(CONFIG_FILE):
        return {
            'bot_token': '',
            'chat_id': '',
            'is_active': False,
            'interval_minutes': 60,
            'companies': [],
            'last_sent': {}
        }
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def _save_config(config):
    """Save Telegram config to JSON file."""
    os.makedirs(CONFIG_DIR, exist_ok=True)
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, default=str)

def _get_db_connection():
    """Get MySQL connection."""
    return pymysql.connect(
        host=Config.MYSQL_HOST,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        database=Config.MYSQL_DB,
        cursorclass=pymysql.cursors.DictCursor
    )

# ============================================================
# PARTY MAPPING (same as ftr_routes.py)
# ============================================================
PARTY_IDS = {
    'rays': '931db2c5-b016-4914-b378-69e9f22562a7',
    'l&t': 'a005562f-568a-46e9-bf2e-700affb171e8',
    'larsen': 'a005562f-568a-46e9-bf2e-700affb171e8',
    'sterling': '141b81a0-2bab-4790-b825-3c8734d41484',
    'sterlin': '141b81a0-2bab-4790-b825-3c8734d41484',
}

PACKING_PARTY_MAP = {
    'rays': ['RAYS POWER INFRA PRIVATE LIMITED', 'Rays', 'Rays-NTPC', 'Rays-NTPC-Barethi'],
    'l&t': ['LARSEN & TOUBRO LIMITED, CONSTRUCTION', 'L&T', 'LARSEN & TOUBRO LIMITED', 'LARSEN AND TOUBRO'],
    'larsen': ['LARSEN & TOUBRO LIMITED, CONSTRUCTION', 'L&T', 'LARSEN & TOUBRO LIMITED', 'LARSEN AND TOUBRO'],
    'sterling': ['STERLING AND WILSON RENEWABLE ENERGY LIMITED', 'S&W', 'S&W - NTPC'],
    'sterlin': ['STERLING AND WILSON RENEWABLE ENERGY LIMITED', 'S&W', 'S&W - NTPC'],
}

# ============================================================
# TELEGRAM API HELPERS
# ============================================================
def _send_telegram_message(bot_token, chat_id, text):
    """Send a message via Telegram Bot API."""
    url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
    payload = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML'
    }
    resp = requests.post(url, json=payload, timeout=30)
    return resp.json()

# ============================================================
# FETCH DISPATCH DATA FOR A COMPANY (lightweight version)
# ============================================================
def _fetch_dispatch_summary(company_id):
    """
    Fetch dispatch summary for a company.
    Returns dict with totals and PDI-wise breakdown.
    """
    conn = _get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 1. Company info
        cursor.execute("SELECT id, company_name FROM companies WHERE id = %s", (company_id,))
        company = cursor.fetchone()
        if not company:
            return None
        
        company_name = company['company_name']
        lower_name = company_name.strip().lower()
        
        # 2. Get all PDI serials
        pdi_serials_map = {}
        cursor.execute("""
            SELECT serial_number, pdi_number
            FROM pdi_serial_numbers
            WHERE company_id = %s AND pdi_number IS NOT NULL AND serial_number IS NOT NULL
        """, (company_id,))
        for row in cursor.fetchall():
            pdi = row['pdi_number']
            serial = row['serial_number']
            if pdi and serial and not serial.strip().startswith('20'):
                if pdi not in pdi_serials_map:
                    pdi_serials_map[pdi] = []
                pdi_serials_map[pdi].append(serial.strip())
        
        total_assigned = sum(len(s) for s in pdi_serials_map.values())
        
        # 3. Production records
        cursor.execute("""
            SELECT SUM(COALESCE(day_production, 0) + COALESCE(night_production, 0)) as total
            FROM production_records
            WHERE company_id = %s
        """, (company_id,))
        row = cursor.fetchone()
        total_produced = int(row['total'] or 0) if row else 0
        
        conn.close()
        
        # 4. Fetch packing data from MRP
        packing_party_names = []
        for key, names in PACKING_PARTY_MAP.items():
            if key in lower_name:
                packing_party_names = names
                break
        
        packed_lookup = set()
        for party_name in packing_party_names:
            try:
                resp = requests.post(
                    'https://umanmrp.in/api/get_barcode_tracking.php',
                    json={'party_name': party_name},
                    timeout=120
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get('status') == 'success' or data.get('data'):
                        for item in data.get('data', []):
                            barcode = item.get('barcode', '').strip().upper()
                            if barcode:
                                packed_lookup.add(barcode)
            except Exception as e:
                print(f"[Telegram] Packing API error ({party_name}): {e}")
        
        # 5. Fetch dispatch data from MRP
        party_id = None
        for key, pid in PARTY_IDS.items():
            if key in lower_name:
                party_id = pid
                break
        
        dispatched_set = set()
        dispatched_dates = {}
        
        if party_id:
            try:
                to_date = datetime.now().strftime('%Y-%m-%d')
                from_date = (datetime.now() - timedelta(days=730)).strftime('%Y-%m-%d')
                
                # OLD API — paginated for detailed data
                page = 1
                while page <= 20:
                    resp = requests.post(
                        'https://umanmrp.in/api/party-dispatch-history.php',
                        json={
                            'party_id': party_id,
                            'from_date': from_date,
                            'to_date': to_date,
                            'page': page,
                            'limit': 10000
                        },
                        timeout=120
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        dispatch_summary = data.get('dispatch_summary', [])
                        if not dispatch_summary:
                            break
                        for dispatch in dispatch_summary:
                            dispatch_date = dispatch.get('dispatch_date', '')
                            pallet_nos = dispatch.get('pallet_nos', {})
                            if isinstance(pallet_nos, dict):
                                for pallet_no, barcodes_str in pallet_nos.items():
                                    if isinstance(barcodes_str, str):
                                        for serial in barcodes_str.strip().split():
                                            serial = serial.strip().upper()
                                            if serial:
                                                dispatched_set.add(serial)
                                                if dispatch_date:
                                                    dispatched_dates[serial] = dispatch_date
                        page += 1
                    else:
                        break
                
                # NEW API — backup
                resp = requests.post(
                    'https://umanmrp.in/api/party-dispatch-history1.php',
                    json={
                        'party_id': party_id,
                        'from_date': from_date,
                        'to_date': to_date,
                        'barcodes_only': True
                    },
                    timeout=300
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get('status') == 'success':
                        for barcode_str in data.get('barcodes', []):
                            if barcode_str and isinstance(barcode_str, str):
                                for serial in barcode_str.strip().split():
                                    serial = serial.strip().upper()
                                    if serial:
                                        dispatched_set.add(serial)
            except Exception as e:
                print(f"[Telegram] Dispatch API error: {e}")
        
        # 6. Categorize serials
        pdi_breakdown = []
        total_dispatched = 0
        total_packed = 0
        total_not_packed = 0
        
        for pdi in sorted(pdi_serials_map.keys()):
            serials = pdi_serials_map[pdi]
            d = p = np = 0
            for serial in serials:
                serial_upper = serial.strip().upper()
                if serial_upper in dispatched_set:
                    d += 1
                elif serial_upper in packed_lookup:
                    p += 1
                else:
                    np += 1
            total_dispatched += d
            total_packed += p
            total_not_packed += np
            pdi_breakdown.append({
                'pdi': pdi,
                'total': len(serials),
                'dispatched': d,
                'packed': p,
                'not_packed': np
            })
        
        # 7. Last dispatch date
        last_dispatch_date = ''
        if dispatched_dates:
            last_dispatch_date = max(dispatched_dates.values())
        
        return {
            'company_name': company_name,
            'company_id': company_id,
            'total_assigned': total_assigned,
            'total_produced': total_produced,
            'total_dispatched': total_dispatched,
            'total_packed': total_packed,
            'total_not_packed': total_not_packed,
            'last_dispatch_date': last_dispatch_date,
            'pdi_breakdown': pdi_breakdown,
            'extra_dispatched': len(dispatched_set) - total_dispatched,
            'total_mrp_dispatched': len(dispatched_set),
            'total_mrp_packed': len(packed_lookup)
        }
    
    except Exception as e:
        print(f"[Telegram] Error fetching dispatch summary: {e}")
        import traceback
        traceback.print_exc()
        if conn:
            conn.close()
        return None

# ============================================================
# FORMAT TELEGRAM MESSAGE
# ============================================================
def _format_dispatch_message(data):
    """Format dispatch data as a nice Telegram message (HTML)."""
    company = data['company_name']
    now = datetime.now().strftime('%d-%b-%Y %H:%M IST')
    
    total = data['total_assigned']
    dispatched = data['total_dispatched']
    packed = data['total_packed']
    not_packed = data['total_not_packed']
    produced = data['total_produced']
    
    disp_pct = round((dispatched / total) * 100, 1) if total > 0 else 0
    packed_pct = round((packed / total) * 100, 1) if total > 0 else 0
    not_packed_pct = round((not_packed / total) * 100, 1) if total > 0 else 0
    
    # Progress bar
    bar_len = 20
    filled = round(disp_pct / 100 * bar_len)
    bar = '█' * filled + '░' * (bar_len - filled)
    
    msg = f"""<b>📊 PDI Dispatch Report</b>
<b>🏢 {company}</b>
<code>📅 {now}</code>

<b>━━━ Summary ━━━</b>
🏭 Produced: <b>{produced:,}</b>
📋 FTR Assigned: <b>{total:,}</b>
✅ Dispatched: <b>{dispatched:,}</b> ({disp_pct}%)
📦 Packed: <b>{packed:,}</b> ({packed_pct}%)
⏳ Not Packed: <b>{not_packed:,}</b> ({not_packed_pct}%)

<code>[{bar}] {disp_pct}%</code>"""

    if data.get('last_dispatch_date'):
        msg += f"\n📅 Last Dispatch: <b>{data['last_dispatch_date']}</b>"
    
    if data.get('extra_dispatched', 0) > 0:
        msg += f"\n🔀 Extra in MRP: <b>{data['extra_dispatched']:,}</b>"
    
    # PDI-wise breakdown
    if data.get('pdi_breakdown'):
        msg += "\n\n<b>━━━ PDI Breakdown ━━━</b>"
        for pdi in data['pdi_breakdown']:
            pdi_disp_pct = round((pdi['dispatched'] / pdi['total']) * 100) if pdi['total'] > 0 else 0
            status_icon = '✅' if pdi_disp_pct == 100 else '🟡' if pdi_disp_pct >= 50 else '🔴'
            msg += f"\n{status_icon} <b>{pdi['pdi']}</b>: {pdi['total']:,} → D:{pdi['dispatched']:,} P:{pdi['packed']:,} NP:{pdi['not_packed']:,} ({pdi_disp_pct}%)"
    
    return msg

# ============================================================
# SEND REPORT FOR ALL COMPANIES
# ============================================================
def send_hourly_report():
    """Send dispatch report for all configured companies."""
    config = _load_config()
    
    if not config.get('is_active'):
        return {'success': False, 'error': 'Bot is not active'}
    
    bot_token = config.get('bot_token', '')
    chat_id = config.get('chat_id', '')
    
    if not bot_token or not chat_id:
        return {'success': False, 'error': 'Bot token or chat ID not configured'}
    
    companies = config.get('companies', [])
    if not companies:
        return {'success': False, 'error': 'No companies configured'}
    
    results = []
    for company in companies:
        company_id = company.get('id')
        company_name = company.get('name', '')
        
        try:
            print(f"[Telegram] Fetching data for {company_name} (id={company_id})...")
            data = _fetch_dispatch_summary(company_id)
            
            if data:
                msg = _format_dispatch_message(data)
                result = _send_telegram_message(bot_token, chat_id, msg)
                
                if result.get('ok'):
                    results.append({'company': company_name, 'status': 'sent'})
                    print(f"[Telegram] ✅ Report sent for {company_name}")
                else:
                    results.append({'company': company_name, 'status': 'failed', 'error': result.get('description', 'Unknown error')})
                    print(f"[Telegram] ❌ Failed for {company_name}: {result.get('description')}")
            else:
                results.append({'company': company_name, 'status': 'no_data'})
                print(f"[Telegram] ⚠️ No data for {company_name}")
        except Exception as e:
            results.append({'company': company_name, 'status': 'error', 'error': str(e)})
            print(f"[Telegram] ❌ Error for {company_name}: {e}")
    
    # Update last sent time
    config['last_sent'] = {
        'time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'results': results
    }
    _save_config(config)
    
    return {'success': True, 'results': results}

# ============================================================
# FLASK ROUTES
# ============================================================

@telegram_bp.route('/setup', methods=['POST'])
def setup_bot():
    """
    Setup/update Telegram bot configuration.
    POST body: { bot_token, chat_id, interval_minutes, companies: [{id, name}] }
    """
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400
    
    config = _load_config()
    
    if 'bot_token' in data:
        config['bot_token'] = data['bot_token'].strip()
    if 'chat_id' in data:
        config['chat_id'] = str(data['chat_id']).strip()
    if 'interval_minutes' in data:
        config['interval_minutes'] = max(10, int(data['interval_minutes']))
    if 'companies' in data:
        config['companies'] = data['companies']
    if 'is_active' in data:
        config['is_active'] = bool(data['is_active'])
    
    _save_config(config)
    
    return jsonify({
        'success': True,
        'message': 'Configuration saved',
        'config': {
            'bot_token': config['bot_token'][:10] + '...' if config.get('bot_token') else '',
            'chat_id': config.get('chat_id', ''),
            'is_active': config.get('is_active', False),
            'interval_minutes': config.get('interval_minutes', 60),
            'companies': config.get('companies', [])
        }
    })

@telegram_bp.route('/status', methods=['GET'])
def get_status():
    """Get current Telegram bot status and config."""
    config = _load_config()
    
    return jsonify({
        'success': True,
        'config': {
            'bot_token_set': bool(config.get('bot_token')),
            'chat_id': config.get('chat_id', ''),
            'is_active': config.get('is_active', False),
            'interval_minutes': config.get('interval_minutes', 60),
            'companies': config.get('companies', []),
            'last_sent': config.get('last_sent', {})
        }
    })

@telegram_bp.route('/test', methods=['POST'])
def test_message():
    """Send a test message to verify bot setup."""
    config = _load_config()
    bot_token = config.get('bot_token', '')
    chat_id = config.get('chat_id', '')
    
    if not bot_token or not chat_id:
        return jsonify({'success': False, 'error': 'Bot token and chat ID must be configured first. Use /api/telegram/setup'}), 400
    
    test_msg = f"""<b>🔔 PDI Dispatch Bot — Test Message</b>
<code>📅 {datetime.now().strftime('%d-%b-%Y %H:%M IST')}</code>

✅ Bot is connected and working!
📊 Hourly reports will be sent here.

Companies configured: <b>{len(config.get('companies', []))}</b>
Interval: <b>{config.get('interval_minutes', 60)} minutes</b>"""
    
    result = _send_telegram_message(bot_token, chat_id, test_msg)
    
    if result.get('ok'):
        return jsonify({'success': True, 'message': 'Test message sent successfully!'})
    else:
        return jsonify({'success': False, 'error': result.get('description', 'Failed to send message')}), 400

@telegram_bp.route('/send-now', methods=['POST'])
def send_now():
    """Manually trigger dispatch report for all companies or a specific one."""
    data = request.get_json() or {}
    company_id = data.get('company_id')
    
    config = _load_config()
    bot_token = config.get('bot_token', '')
    chat_id = config.get('chat_id', '')
    
    if not bot_token or not chat_id:
        return jsonify({'success': False, 'error': 'Bot not configured'}), 400
    
    if company_id:
        # Send for specific company
        summary = _fetch_dispatch_summary(company_id)
        if summary:
            msg = _format_dispatch_message(summary)
            result = _send_telegram_message(bot_token, chat_id, msg)
            if result.get('ok'):
                return jsonify({'success': True, 'message': f'Report sent for {summary["company_name"]}'})
            else:
                return jsonify({'success': False, 'error': result.get('description', 'Send failed')}), 400
        return jsonify({'success': False, 'error': 'No data found for this company'}), 404
    else:
        # Send for all configured companies
        result = send_hourly_report()
        return jsonify(result)

@telegram_bp.route('/companies', methods=['GET'])
def list_companies():
    """List all available companies for Telegram configuration."""
    try:
        conn = _get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, company_name FROM companies ORDER BY company_name")
        companies = [{'id': row['id'], 'name': row['company_name']} for row in cursor.fetchall()]
        conn.close()
        return jsonify({'success': True, 'companies': companies})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@telegram_bp.route('/toggle', methods=['POST'])
def toggle_bot():
    """Toggle bot on/off."""
    config = _load_config()
    config['is_active'] = not config.get('is_active', False)
    _save_config(config)
    return jsonify({
        'success': True,
        'is_active': config['is_active'],
        'message': f"Bot {'activated' if config['is_active'] else 'deactivated'}"
    })

# ============================================================
# BACKGROUND SCHEDULER (called from __init__.py)
# ============================================================
_telegram_scheduler_started = False

def start_telegram_scheduler(app):
    """Start background thread for hourly Telegram reports."""
    global _telegram_scheduler_started
    if _telegram_scheduler_started:
        return
    _telegram_scheduler_started = True
    
    def scheduler_loop():
        print("\n📱 TELEGRAM DISPATCH BOT SCHEDULER STARTED")
        time.sleep(60)  # Wait for server to start
        
        while True:
            try:
                config = _load_config()
                interval = config.get('interval_minutes', 60) * 60  # Convert to seconds
                
                if config.get('is_active') and config.get('bot_token') and config.get('chat_id'):
                    print(f"\n📱 [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Sending Telegram dispatch reports...")
                    with app.app_context():
                        result = send_hourly_report()
                        print(f"📱 Telegram report result: {result}")
                else:
                    interval = 300  # Check every 5 min if not active
                
                time.sleep(interval)
                
            except Exception as e:
                print(f"📱 Telegram scheduler error: {e}")
                time.sleep(300)
    
    thread = threading.Thread(target=scheduler_loop, daemon=True)
    thread.start()
    print("📱 Telegram scheduler thread started")

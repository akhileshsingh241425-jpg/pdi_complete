from flask import Blueprint, request, jsonify, send_file
import os
import base64
from datetime import datetime
from werkzeug.utils import secure_filename

rfid_upload_bp = Blueprint('rfid_upload', __name__)

RFID_UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '../../uploads/rfid_reports')
RFID_GRAPHS_FOLDER = os.path.join(os.path.dirname(__file__), '../../uploads/rfid_graphs')
os.makedirs(RFID_UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RFID_GRAPHS_FOLDER, exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_image(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS


# ============= RFID IV GRAPH MANAGEMENT =============

@rfid_upload_bp.route('/api/rfid/graphs', methods=['GET'])
def get_rfid_graphs():
    """Get all uploaded RFID IV curve graphs organized by wattage"""
    try:
        graphs = {}
        if os.path.exists(RFID_GRAPHS_FOLDER):
            for filename in os.listdir(RFID_GRAPHS_FOLDER):
                if allowed_image(filename):
                    parts = filename.split('_')
                    if parts:
                        wattage = parts[0]
                        if wattage not in graphs:
                            graphs[wattage] = []
                        filepath = os.path.join(RFID_GRAPHS_FOLDER, filename)
                        try:
                            with open(filepath, 'rb') as f:
                                img_data = f.read()
                                ext = filename.rsplit('.', 1)[1].lower()
                                mime = 'image/jpeg' if ext in ['jpg', 'jpeg'] else 'image/png'
                                b64 = base64.b64encode(img_data).decode('utf-8')
                                graphs[wattage].append(f"data:{mime};base64,{b64}")
                        except Exception as e:
                            print(f"Error reading {filename}: {e}")
                            continue
        return jsonify({'success': True, 'graphs': graphs}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@rfid_upload_bp.route('/api/rfid/graphs/upload', methods=['POST'])
def upload_rfid_graphs():
    """Upload RFID IV curve graph images for a specific wattage"""
    try:
        wattage = request.form.get('wattage')
        if not wattage:
            return jsonify({'error': 'Wattage not specified'}), 400
        if 'files' not in request.files:
            return jsonify({'error': 'No files provided'}), 400

        files = request.files.getlist('files')
        uploaded = []
        existing_count = 0
        for f in os.listdir(RFID_GRAPHS_FOLDER):
            if f.startswith(f"{wattage}_"):
                existing_count += 1

        for i, file in enumerate(files):
            if file and allowed_image(file.filename):
                ext = file.filename.rsplit('.', 1)[1].lower()
                new_filename = f"{wattage}_{existing_count + i + 1}.{ext}"
                filepath = os.path.join(RFID_GRAPHS_FOLDER, new_filename)
                file.save(filepath)
                uploaded.append(new_filename)

        return jsonify({
            'success': True,
            'message': f'{len(uploaded)} RFID graphs uploaded for {wattage}W',
            'uploaded': uploaded
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@rfid_upload_bp.route('/api/rfid/graphs/<wattage>', methods=['DELETE'])
def delete_rfid_graphs(wattage):
    """Delete all RFID graphs for a specific wattage"""
    try:
        deleted = 0
        for filename in os.listdir(RFID_GRAPHS_FOLDER):
            if filename.startswith(f"{wattage}_"):
                os.remove(os.path.join(RFID_GRAPHS_FOLDER, filename))
                deleted += 1
        return jsonify({'success': True, 'message': f'{deleted} RFID graphs deleted for {wattage}W'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@rfid_upload_bp.route('/api/rfid/graphs/clear', methods=['DELETE'])
def clear_all_rfid_graphs():
    """Delete all RFID graphs"""
    try:
        deleted = 0
        for filename in os.listdir(RFID_GRAPHS_FOLDER):
            if allowed_image(filename):
                os.remove(os.path.join(RFID_GRAPHS_FOLDER, filename))
                deleted += 1
        return jsonify({'success': True, 'message': f'{deleted} RFID graphs deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@rfid_upload_bp.route('/api/rfid/upload-bulk', methods=['POST'])
def upload_bulk_rfid():
    """Upload multiple RFID PDFs and return their file paths"""
    try:
        data = request.json

        if not data or 'reports' not in data:
            return jsonify({'error': 'No reports data provided'}), 400

        uploaded_files = []

        for report in data['reports']:
            if 'pdfData' not in report or 'serialNumber' not in report:
                continue

            # Decode base64 PDF data
            pdf_data = report['pdfData']
            if pdf_data.startswith('data:application/pdf;base64,'):
                pdf_data = pdf_data.replace('data:application/pdf;base64,', '')

            pdf_bytes = base64.b64decode(pdf_data)

            # Generate filename
            serial_number = report['serialNumber'].replace('/', '_').replace('\\', '_')
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"RFID_{serial_number}_{timestamp}.pdf"
            filename = secure_filename(filename)

            # Save file
            filepath = os.path.join(RFID_UPLOAD_FOLDER, filename)
            with open(filepath, 'wb') as f:
                f.write(pdf_bytes)

            relative_path = f"/uploads/rfid_reports/{filename}"

            uploaded_files.append({
                'serialNumber': report['serialNumber'],
                'filePath': relative_path,
                'moduleType': report.get('moduleType', ''),
                'pmax': report.get('pmax', 0)
            })

        return jsonify({
            'success': True,
            'message': f'{len(uploaded_files)} RFID reports uploaded successfully',
            'files': uploaded_files
        }), 200

    except Exception as e:
        print(f"Error uploading RFID reports: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@rfid_upload_bp.route('/api/rfid/upload-single', methods=['POST'])
def upload_single_rfid():
    """Upload single RFID PDF"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if file and '.' in file.filename and file.filename.rsplit('.', 1)[1].lower() == 'pdf':
            filename = secure_filename(file.filename)
            filepath = os.path.join(RFID_UPLOAD_FOLDER, filename)
            file.save(filepath)

            return jsonify({
                'success': True,
                'filePath': f"/uploads/rfid_reports/{filename}"
            }), 200

        return jsonify({'error': 'Invalid file type'}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500

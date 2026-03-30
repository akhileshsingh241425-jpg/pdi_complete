from flask import Blueprint, request, jsonify
import os
import base64
from datetime import datetime
from werkzeug.utils import secure_filename

rfid_upload_bp = Blueprint('rfid_upload', __name__)

RFID_UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '../../uploads/rfid_reports')
os.makedirs(RFID_UPLOAD_FOLDER, exist_ok=True)


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

"""
COC Management Routes
"""
from flask import Blueprint, request, jsonify
from app.services.coc_service import COCService
from sqlalchemy import text
from app.models.database import db

coc_bp = Blueprint('coc', __name__)

@coc_bp.route('/sync', methods=['POST'])
def sync_coc_data():
    """Sync COC data from external API"""
    try:
        data = request.get_json() or {}
        from_date = data.get('from_date')
        to_date = data.get('to_date')
        
        result = COCService.fetch_and_sync_coc_data(from_date, to_date)
        return jsonify(result), 200 if result['success'] else 500
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@coc_bp.route('/list', methods=['GET'])
def list_coc_documents():
    """List all COC documents"""
    try:
        company = request.args.get('company')
        material = request.args.get('material')
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        
        query = "SELECT * FROM coc_documents WHERE is_active = 1"
        params = {}
        
        if company:
            query += " AND company_name = :company"
            params['company'] = company
        
        if material:
            query += " AND material_name = :material"
            params['material'] = material
        
        if from_date:
            query += " AND invoice_date >= :from_date"
            params['from_date'] = from_date
        
        if to_date:
            query += " AND invoice_date <= :to_date"
            params['to_date'] = to_date
        
        query += " ORDER BY invoice_date DESC"
        
        result = db.session.execute(text(query), params).fetchall()
        
        coc_list = []
        for row in result:
            coc_list.append({
                'id': row[0],
                'company': row[2],
                'material': row[3],
                'brand': row[4],
                'lot_batch_no': row[6],
                'coc_qty': float(row[7]),
                'invoice_no': row[8],
                'invoice_date': str(row[10]) if row[10] else None,
                'consumed_qty': float(row[15]) if row[15] else 0,
                'available_qty': float(row[16]) if row[16] else 0,
                'coc_document_url': row[13],
                'iqc_document_url': row[14]
            })
        
        return jsonify({"success": True, "data": coc_list}), 200
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@coc_bp.route('/stock', methods=['GET'])
def get_material_stock():
    """Get raw material stock levels"""
    try:
        company = request.args.get('company')
        material = request.args.get('material')
        
        result = COCService.get_material_stock(company, material)
        return jsonify(result), 200 if result['success'] else 500
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@coc_bp.route('/validate', methods=['POST'])
def validate_production():
    """Validate if production can proceed based on material availability"""
    try:
        data = request.get_json()
        company = data.get('company_name')
        materials = data.get('materials', {})
        
        result = COCService.validate_production(company, materials)
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@coc_bp.route('/companies', methods=['GET'])
def get_companies():
    """Get list of all companies"""
    try:
        query = text("SELECT DISTINCT company_name FROM coc_documents WHERE is_active = 1 ORDER BY company_name")
        result = db.session.execute(query).fetchall()
        
        companies = [row[0] for row in result]
        return jsonify({"success": True, "data": companies}), 200
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@coc_bp.route('/materials', methods=['GET'])
def get_materials():
    """Get list of all materials"""
    try:
        company = request.args.get('company')
        query = "SELECT DISTINCT material_name FROM coc_documents WHERE is_active = 1"
        params = {}
        
        if company:
            query += " AND company_name = :company"
            params['company'] = company
        
        query += " ORDER BY material_name"
        
        result = db.session.execute(text(query), params).fetchall()
        materials = [row[0] for row in result]
        
        return jsonify({"success": True, "data": materials}), 200
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

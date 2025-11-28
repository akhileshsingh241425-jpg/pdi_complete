from flask import Blueprint, request, jsonify
from datetime import datetime
from app.models.database import db, Company, ProductionRecord, RejectedModule

company_bp = Blueprint('company', __name__)

# Get all companies
@company_bp.route('/api/companies', methods=['GET'])
def get_companies():
    try:
        companies = Company.query.all()
        return jsonify([company.to_dict() for company in companies]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get single company
@company_bp.route('/api/companies/<int:company_id>', methods=['GET'])
def get_company(company_id):
    try:
        company = Company.query.get_or_404(company_id)
        return jsonify(company.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 404

# Create company
@company_bp.route('/api/companies', methods=['POST'])
def create_company():
    try:
        data = request.get_json()
        
        company = Company(
            company_name=data.get('companyName'),
            module_wattage=int(data.get('moduleWattage', 625)),
            module_type=data.get('moduleType', 'Topcon'),
            cells_per_module=int(data.get('cellsPerModule', 132)),
            cells_received_qty=int(data.get('cellsReceivedQty')) if data.get('cellsReceivedQty') else None,
            cells_received_mw=float(data.get('cellsReceivedMW')) if data.get('cellsReceivedMW') else None
        )
        
        db.session.add(company)
        db.session.commit()
        
        return jsonify(company.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Update company
@company_bp.route('/api/companies/<int:company_id>', methods=['PUT'])
def update_company(company_id):
    try:
        company = Company.query.get_or_404(company_id)
        data = request.get_json()
        
        company.company_name = data.get('companyName', company.company_name)
        company.module_wattage = int(data.get('moduleWattage', company.module_wattage))
        company.module_type = data.get('moduleType', company.module_type)
        company.cells_per_module = int(data.get('cellsPerModule', company.cells_per_module))
        company.cells_received_qty = int(data.get('cellsReceivedQty')) if data.get('cellsReceivedQty') else None
        company.cells_received_mw = float(data.get('cellsReceivedMW')) if data.get('cellsReceivedMW') else None
        
        db.session.commit()
        
        return jsonify(company.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Delete company
@company_bp.route('/api/companies/<int:company_id>', methods=['DELETE'])
def delete_company(company_id):
    try:
        company = Company.query.get_or_404(company_id)
        db.session.delete(company)
        db.session.commit()
        
        return jsonify({'message': 'Company deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Add production record
@company_bp.route('/api/companies/<int:company_id>/production', methods=['POST'])
def add_production_record(company_id):
    try:
        company = Company.query.get_or_404(company_id)
        data = request.get_json()
        
        record = ProductionRecord(
            company_id=company_id,
            date=datetime.strptime(data.get('date'), '%Y-%m-%d').date(),
            day_production=int(data.get('dayProduction', 0)),
            night_production=int(data.get('nightProduction', 0)),
            pdi=data.get('pdi', ''),
            cell_rejection_percent=float(data.get('cellRejectionPercent', 0.0)),
            module_rejection_percent=float(data.get('moduleRejectionPercent', 0.0))
        )
        
        db.session.add(record)
        db.session.commit()
        
        return jsonify(record.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Update production record
@company_bp.route('/api/companies/<int:company_id>/production/<int:record_id>', methods=['PUT'])
def update_production_record(company_id, record_id):
    try:
        record = ProductionRecord.query.filter_by(id=record_id, company_id=company_id).first_or_404()
        data = request.get_json()
        
        if data.get('date'):
            record.date = datetime.strptime(data.get('date'), '%Y-%m-%d').date()
        record.day_production = int(data.get('dayProduction', record.day_production))
        record.night_production = int(data.get('nightProduction', record.night_production))
        record.pdi = data.get('pdi', record.pdi)
        record.cell_rejection_percent = float(data.get('cellRejectionPercent', record.cell_rejection_percent))
        record.module_rejection_percent = float(data.get('moduleRejectionPercent', record.module_rejection_percent))
        
        db.session.commit()
        
        return jsonify(record.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Delete production record
@company_bp.route('/api/companies/<int:company_id>/production/<int:record_id>', methods=['DELETE'])
def delete_production_record(company_id, record_id):
    try:
        record = ProductionRecord.query.filter_by(id=record_id, company_id=company_id).first_or_404()
        db.session.delete(record)
        db.session.commit()
        
        return jsonify({'message': 'Production record deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Add rejected module
@company_bp.route('/api/companies/<int:company_id>/rejections', methods=['POST'])
def add_rejected_module(company_id):
    try:
        company = Company.query.get_or_404(company_id)
        data = request.get_json()
        
        rejection = RejectedModule(
            company_id=company_id,
            serial_number=data.get('serialNumber'),
            rejection_date=datetime.strptime(data.get('rejectionDate'), '%Y-%m-%d').date(),
            reason=data.get('reason', ''),
            stage=data.get('stage', 'Visual Inspection')
        )
        
        db.session.add(rejection)
        db.session.commit()
        
        return jsonify(rejection.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Bulk add rejected modules (Excel upload)
@company_bp.route('/api/companies/<int:company_id>/rejections/bulk', methods=['POST'])
def bulk_add_rejections(company_id):
    try:
        company = Company.query.get_or_404(company_id)
        data = request.get_json()
        rejections_data = data.get('rejections', [])
        
        rejections = []
        for rej_data in rejections_data:
            rejection = RejectedModule(
                company_id=company_id,
                serial_number=rej_data.get('serialNumber'),
                rejection_date=datetime.strptime(rej_data.get('rejectionDate'), '%Y-%m-%d').date(),
                reason=rej_data.get('reason', ''),
                stage=rej_data.get('stage', 'Visual Inspection')
            )
            rejections.append(rejection)
        
        db.session.add_all(rejections)
        db.session.commit()
        
        return jsonify({'message': f'{len(rejections)} rejections added successfully'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Delete rejected module
@company_bp.route('/api/companies/<int:company_id>/rejections/<int:rejection_id>', methods=['DELETE'])
def delete_rejected_module(company_id, rejection_id):
    try:
        rejection = RejectedModule.query.filter_by(id=rejection_id, company_id=company_id).first_or_404()
        db.session.delete(rejection)
        db.session.commit()
        
        return jsonify({'message': 'Rejection deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Delete all rejected modules for a company
@company_bp.route('/api/companies/<int:company_id>/rejections', methods=['DELETE'])
def delete_all_rejections(company_id):
    try:
        company = Company.query.get_or_404(company_id)
        RejectedModule.query.filter_by(company_id=company_id).delete()
        db.session.commit()
        
        return jsonify({'message': 'All rejections deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

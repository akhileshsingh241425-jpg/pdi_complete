from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Company(db.Model):
    __tablename__ = 'companies'
    
    id = db.Column(db.Integer, primary_key=True)
    company_name = db.Column(db.String(200), nullable=False)
    module_wattage = db.Column(db.Integer, default=625)
    module_type = db.Column(db.String(50), default='Topcon')
    cells_per_module = db.Column(db.Integer, default=132)
    cells_received_qty = db.Column(db.Integer, nullable=True)
    cells_received_mw = db.Column(db.Float, nullable=True)
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    production_records = db.relationship('ProductionRecord', backref='company', lazy=True, cascade='all, delete-orphan')
    rejected_modules = db.relationship('RejectedModule', backref='company', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'companyName': self.company_name,
            'moduleWattage': self.module_wattage,
            'moduleType': self.module_type,
            'cellsPerModule': self.cells_per_module,
            'cellsReceivedQty': self.cells_received_qty,
            'cellsReceivedMW': self.cells_received_mw,
            'createdDate': self.created_date.strftime('%Y-%m-%d') if self.created_date else None,
            'productionRecords': [pr.to_dict() for pr in self.production_records],
            'rejectedModules': [rm.to_dict() for rm in self.rejected_modules]
        }


class ProductionRecord(db.Model):
    __tablename__ = 'production_records'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    day_production = db.Column(db.Integer, default=0)
    night_production = db.Column(db.Integer, default=0)
    pdi = db.Column(db.String(200), default='')
    cell_rejection_percent = db.Column(db.Float, default=0.0)
    module_rejection_percent = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.strftime('%Y-%m-%d') if self.date else None,
            'dayProduction': self.day_production,
            'nightProduction': self.night_production,
            'pdi': self.pdi,
            'cellRejectionPercent': self.cell_rejection_percent,
            'moduleRejectionPercent': self.module_rejection_percent
        }


class RejectedModule(db.Model):
    __tablename__ = 'rejected_modules'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    serial_number = db.Column(db.String(100), nullable=False)
    rejection_date = db.Column(db.Date, nullable=False)
    reason = db.Column(db.String(200), default='')
    stage = db.Column(db.String(100), default='Visual Inspection')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'serialNumber': self.serial_number,
            'rejectionDate': self.rejection_date.strftime('%Y-%m-%d') if self.rejection_date else None,
            'reason': self.reason,
            'stage': self.stage
        }

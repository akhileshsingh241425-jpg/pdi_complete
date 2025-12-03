#!/usr/bin/env python3
"""
Fix IPQC PDF and FTR document paths in database
Change: ipqc_pdfs/filename.pdf -> uploads/ipqc_pdfs/filename.pdf
Change: ftr_documents/filename.xlsx -> uploads/ftr_documents/filename.xlsx
"""

from app import create_app
from app.models.database import db, ProductionRecord

app = create_app()

with app.app_context():
    print("🔧 Fixing IPQC PDF and FTR document paths...")
    
    # Get all production records with documents
    records = ProductionRecord.query.filter(
        (ProductionRecord.ipqc_pdf.isnot(None)) | 
        (ProductionRecord.ftr_document.isnot(None))
    ).all()
    
    updated_count = 0
    
    for record in records:
        updated = False
        
        # Fix IPQC PDF path
        if record.ipqc_pdf and not record.ipqc_pdf.startswith('uploads/'):
            old_path = record.ipqc_pdf
            record.ipqc_pdf = f"uploads/{record.ipqc_pdf}"
            print(f"✓ IPQC PDF: {old_path} -> {record.ipqc_pdf}")
            updated = True
        
        # Fix FTR document path
        if record.ftr_document and not record.ftr_document.startswith('uploads/'):
            old_path = record.ftr_document
            record.ftr_document = f"uploads/{record.ftr_document}"
            print(f"✓ FTR Document: {old_path} -> {record.ftr_document}")
            updated = True
        
        if updated:
            updated_count += 1
    
    if updated_count > 0:
        db.session.commit()
        print(f"\n✅ Successfully updated {updated_count} document paths!")
    else:
        print("\n✓ All document paths are already correct!")
    
    # Verify
    print("\n📋 Verification:")
    sample = ProductionRecord.query.filter(ProductionRecord.ipqc_pdf.isnot(None)).first()
    if sample:
        print(f"Sample IPQC path: {sample.ipqc_pdf}")
        
        import os
        backend_dir = os.path.dirname(__file__)
        full_path = os.path.join(backend_dir, sample.ipqc_pdf)
        print(f"Full path: {full_path}")
        print(f"File exists: {os.path.exists(full_path)}")

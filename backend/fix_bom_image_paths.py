#!/usr/bin/env python3
"""
Fix BOM material image paths in database
Change: bom_materials/filename.jpg -> uploads/bom_materials/filename.jpg
"""

from app import create_app
from app.models.database import db, BomMaterial

app = create_app()

with app.app_context():
    print("🔧 Fixing BOM material image paths...")
    
    # Get all BOM materials with images
    materials = BomMaterial.query.filter(BomMaterial.image_path.isnot(None)).all()
    
    updated_count = 0
    for material in materials:
        if material.image_path and not material.image_path.startswith('uploads/'):
            old_path = material.image_path
            # Add 'uploads/' prefix
            material.image_path = f"uploads/{material.image_path}"
            print(f"✓ {material.material_name}: {old_path} -> {material.image_path}")
            updated_count += 1
    
    if updated_count > 0:
        db.session.commit()
        print(f"\n✅ Successfully updated {updated_count} image paths!")
    else:
        print("\n✓ All paths are already correct!")
    
    # Verify
    print("\n📋 Verification:")
    sample = BomMaterial.query.filter(BomMaterial.image_path.isnot(None)).first()
    if sample:
        print(f"Sample path: {sample.image_path}")
        
        import os
        backend_dir = os.path.dirname(__file__)
        full_path = os.path.join(backend_dir, sample.image_path)
        print(f"Full path: {full_path}")
        print(f"File exists: {os.path.exists(full_path)}")

#!/bin/bash

# Complete Database Setup Script
# Run this on server to create all missing tables

echo "=========================================="
echo "PDI Database Setup - COC Tables"
echo "=========================================="
echo ""

cd ~/pdi_complete/backend

# Activate venv
source venv/bin/activate

echo "📊 Creating COC tracking tables..."
python create_coc_tables.py

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Tables created:"
echo "  - coc_documents"
echo "  - raw_material_stock"
echo "  - material_consumption"
echo "  - production_material_usage"
echo ""

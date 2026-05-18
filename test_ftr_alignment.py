#!/usr/bin/env python3
"""
Test FTR alignment by generating a sample report
"""
import os
import sys
from datetime import datetime
from backend.app.services.ftr_pdf_generator import create_ftr_report

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

def generate_test_report():
    """Generate a test FTR report"""
    # Sample test data
    test_data = {
        'producer': 'Gautam Solar',
        'moduleType': 'GS-600M',
        'serialNumber': 'GS-2023-001',
        'testDate': datetime.now().strftime('%Y-%m-%d'),
        'testTime': datetime.now().strftime('%H:%M:%S'),
        'irradiance': 1000.25,
        'moduleTemp': 45.2,
        'ambientTemp': 32.5,
        'moduleArea': 2.5,
        'results': {
            'pmax': 600.5,
            'vpm': 45.2,
            'ipm': 13.3,
            'voc': 50.1,
            'isc': 14.0,
            'fillFactor': 78.4,
            'rs': 0.25,
            'rsh': 500.0,
            'efficiency': 22.1
        }
    }

    # Paths
    template_path = os.path.join('frontend', 'public', 'IV curve template.pdf')
    graph_path = os.path.join('frontend', 'public', 'iv_curves', '600.png')
    output_path = os.path.join('test_ftr_report.pdf')

    # Generate PDF
    pdf_bytes = create_ftr_report(template_path, test_data, graph_path)
    
    # Save to file
    with open(output_path, 'wb') as f:
        f.write(pdf_bytes.read())
    
    print(f"Generated test report at {output_path}")

if __name__ == "__main__":
    generate_test_report()
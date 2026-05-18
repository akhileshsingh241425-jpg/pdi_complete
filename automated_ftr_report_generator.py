import os
import pandas as pd
import sys
import traceback
import random
from PyPDF2 import PdfMerger
from datetime import datetime
from backend.app.services.ftr_pdf_generator import FTRPDFGenerator

# Configuration
EXCEL_DIR = r"E:\\BSNL\\Generated_Output"
IMAGE_DIR = r"C:\\Users\\hp\\Pictures\\550(a)"
TEMPLATE_PATH = os.path.abspath("frontend/public/IV curve template.pdf")

# Enhanced logging
print("\n=== FTR Report Generator Debug Mode ===")
print(f"Excel Directory: {EXCEL_DIR}")
print(f"Image Directory: {IMAGE_DIR}")
print(f"Template Path: {TEMPLATE_PATH}")
print(f"Template Exists: {os.path.exists(TEMPLATE_PATH)}")
print(f"Image Dir Exists: {os.path.exists(IMAGE_DIR)}")
print(f"Excel Dir Exists: {os.path.exists(EXCEL_DIR)}")

# Create PDF generator instance
generator = FTRPDFGenerator(TEMPLATE_PATH)

def process_excel_file(excel_path):
    """Process a single Excel file and generate merged FTR reports"""
    try:
        # Read Excel file
        df = pd.read_excel(excel_path)
        output_dir = os.path.dirname(excel_path)
        pdf_files = []
        
        # Process each row with detailed logging
        for idx, row in df.iterrows():
            serial = str(row.get('SerialNumber', '')).strip()
            print(f"\n  Row {idx+1}: Serial='{serial}'")
            
            if not serial:
                print("    SKIPPED: Missing SerialNumber")
                continue
                
            # Get random image from folder
            image_files = [f for f in os.listdir(IMAGE_DIR) if f.endswith('.png')]
            if not image_files:
                print(f"    ERROR: No PNG images found in {IMAGE_DIR}")
                continue
            
            # Pick random image
            random_image = random.choice(image_files)
            image_path = os.path.join(IMAGE_DIR, random_image)
            print(f"    Using random image: {image_path}")
            
            # Prepare test data
            try:
                test_data = {
                    'producer': row.get('Producer', 'Gautam Solar'),
                    'moduleType': row.get('ModuleType', '550W'),
                    'serialNumber': serial,
                    'testDate': row.get('Date', datetime.now().strftime('%Y-%m-%d')),
                    'testTime': row.get('Time', datetime.now().strftime('%H:%M:%S')),
                    'irradiance': float(row.get('Irradiance', 1000)),
                    'moduleTemp': float(row.get('ModuleTemp', 25)),
                    'ambientTemp': float(row.get('AmbientTemp', 25)),
                    'moduleArea': float(row.get('ModuleArea', 2.7)),
                    'results': {
                        'pmax': float(row.get('Pmax', 0)),
                        'vpm': float(row.get('Vpm', 0)),
                        'ipm': float(row.get('Ipm', 0)),
                        'voc': float(row.get('Voc', 0)),
                        'isc': float(row.get('Isc', 0)),
                        'fillFactor': float(row.get('FillFactor', 0)),
                        'rs': float(row.get('Rs', 0)),
                        'rsh': float(row.get('Rsh', 0)),
                        'efficiency': float(row.get('Efficiency', 0))
                    }
                }
                
                # Generate PDF with detailed logging
                try:
                    temp_pdf = os.path.join(output_dir, f"{serial}_temp.pdf")
                    print(f"    Generating PDF: {temp_pdf}")
                    
                    # Generate PDF content
                    pdf_content = generator.generate_pdf({
                        **test_data,
                        'graphImagePath': image_path
                    }).read()
                    
                    # Write to file
                    with open(temp_pdf, 'wb') as f:
                        f.write(pdf_content)
                    
                    print(f"    PDF generated successfully ({len(pdf_content)} bytes)")
                    pdf_files.append(temp_pdf)
                except Exception as e:
                    print(f"    ERROR generating PDF: {str(e)}")
                    print(traceback.format_exc())
                
                pdf_files.append(temp_pdf)
                
            except Exception as e:
                print(f"Error generating PDF for {serial}: {str(e)}")
        
        # Merge PDFs
        if pdf_files:
            merger = PdfMerger()
            for pdf in pdf_files:
                merger.append(pdf)
            
            # Save merged PDF
            output_pdf = os.path.join(output_dir, f"{os.path.basename(excel_path).split('.')[0]}_merged.pdf")
            merger.write(output_pdf)
            merger.close()
            print(f"Generated merged FTR report: {output_pdf}")
            
            # Cleanup temp files
            for pdf in pdf_files:
                os.remove(pdf)
        
    except Exception as e:
        print(f"Error processing {excel_path}: {str(e)}")

def main():
    """Main processing function"""
    if not os.path.exists(EXCEL_DIR):
        print(f"Excel directory not found: {EXCEL_DIR}")
        return
    
    if not os.path.exists(IMAGE_DIR):
        print(f"Image directory not found: {IMAGE_DIR}")
        return
    
    if not os.path.exists(TEMPLATE_PATH):
        print(f"Template PDF not found: {TEMPLATE_PATH}")
        return
    
    # Recursively find all Excel files in directory and subdirectories
    excel_files = []
    for root, _, files in os.walk(EXCEL_DIR):
        for file in files:
            if file.startswith('~$'):  # Skip temporary Excel files
                continue
            if file.endswith(('.xlsx', '.xls')):
                excel_path = os.path.join(root, file)
                excel_files.append(excel_path)
    
    print(f"Found {len(excel_files)} Excel files in directory and subfolders")
    
    for i, excel_path in enumerate(excel_files):
        print(f"\nProcessing file {i+1}/{len(excel_files)}: {excel_path}")
        process_excel_file(excel_path)

if __name__ == "__main__":
    main()
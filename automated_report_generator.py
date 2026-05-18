import os
import pandas as pd
import sys
from PyPDF2 import PdfMerger
from generate_iv_curves import generate_iv_curve, plot_iv_curve

# Configuration
EXCEL_DIR = r"E:\\BSNL\\Generated_Output"
IMAGE_DIR = r"C:\\Users\\hp\\Pictures\\550(a)"

def process_excel_file(excel_path):
    """Process a single Excel file and generate merged PDF"""
    try:
        # Read Excel file
        df = pd.read_excel(excel_path)
        output_dir = os.path.dirname(excel_path)
        pdf_files = []
        
        # Process each row
        for _, row in df.iterrows():
            serial = str(row.get('SerialNumber', '')).strip()
            if not serial:
                print(f"Skipping row with missing SerialNumber in {excel_path}")
                continue
                
            # Find IV image
            image_path = os.path.join(IMAGE_DIR, f"{serial}.png")
            if not os.path.exists(image_path):
                print(f"Image not found for {serial} in {excel_path}")
                continue
            
            # Generate IV curve
            try:
                # Extract parameters
                Voc = row.get('Voc')
                Isc = row.get('Isc')
                Vpm = row.get('Vpm')
                Ipm = row.get('Ipm')
                
                # Generate curve points
                V, I, P = generate_iv_curve(Voc, Isc, Vpm, Ipm, Rs=0.1, Rsh=100)
                
                # Create temporary PDF
                temp_pdf = os.path.join(output_dir, f"{serial}_temp.pdf")
                plot_iv_curve(V, I, P, Voc, Isc, row.get('Pmax'), temp_pdf)
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
            print(f"Generated merged PDF: {output_pdf}")
            
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
    
    # Process all Excel files
    for file in os.listdir(EXCEL_DIR):
        if file.endswith(('.xlsx', '.xls')):
            excel_path = os.path.join(EXCEL_DIR, file)
            process_excel_file(excel_path)

if __name__ == "__main__":
    main()
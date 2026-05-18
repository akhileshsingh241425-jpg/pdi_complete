import os
import pandas as pd
import matplotlib.pyplot as plt
from PIL import Image
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from PyPDF2 import PdfMerger

def generate_report(test_data, image_path, output_path):
    """Generate a single PDF report for a module"""
    c = canvas.Canvas(output_path, pagesize=letter)
    width, height = letter
    
    # Logo and title
    logo_path = "c:/Users/hp/Desktop/PDI/pdi_complete/frontend/public/gautam-solar-logo.jpg"
    if os.path.exists(logo_path):
        logo = ImageReader(logo_path)
        c.drawImage(logo, 30, height-100, width=80, height=70, preserveAspectRatio=True)
    
    c.setFont("Helvetica-Bold", 16)
    c.drawString(120, height-50, "Production Testing Report")
    
    # Draw blue bars
    c.setFillColorRGB(0, 0.2, 0.8)
    c.rect(0, height-110, width, 5, fill=True, stroke=False)
    c.rect(0, 50, width, 5, fill=True, stroke=False)
    
    # Module identification
    c.setFont("Helvetica-Bold", 12)
    c.drawString(30, height-140, "Module identification")
    c.setFont("Helvetica", 10)
    c.drawString(30, height-160, "Producer:")
    c.drawString(100, height-160, "Gautam Solar")
    c.drawString(30, height-180, "Module type:")
    c.drawString(100, height-180, test_data.get('ModuleType', '550W'))
    c.drawString(30, height-200, "S/N:")
    c.drawString(100, height-200, test_data.get('SerialNumber', ''))
    
    # Test conditions
    c.setFont("Helvetica-Bold", 12)
    c.drawString(30, height-230, "Test conditions")
    c.setFont("Helvetica", 10)
    c.drawString(30, height-250, "Date:")
    c.drawString(100, height-250, test_data.get('Date', ''))
    c.drawString(30, height-270, "Time:")
    c.drawString(100, height-270, test_data.get('Time', ''))
    c.drawString(30, height-290, "Irradiance:")
    c.drawString(100, height-290, f"{test_data.get('Irradiance', 1000)} W/m²")
    c.drawString(30, height-310, "Module temperature:")
    c.drawString(130, height-310, f"{test_data.get('ModuleTemp', 25)} °C")
    c.drawString(30, height-330, "Ambient temperature:")
    c.drawString(130, height-330, f"{test_data.get('AmbientTemp', 25)} °C")
    
    # Test results
    c.setFont("Helvetica-Bold", 12)
    c.drawString(30, height-360, "Test results")
    c.setFont("Helvetica", 10)
    c.drawString(30, height-380, "Pmax:")
    c.drawString(100, height-380, f"{test_data.get('Pmax', 0)} W")
    c.drawString(30, height-400, "Vpm:")
    c.drawString(100, height-400, f"{test_data.get('Vpm', 0)} V")
    c.drawString(30, height-420, "Ipm:")
    c.drawString(100, height-420, f"{test_data.get('Ipm', 0)} A")
    c.drawString(30, height-440, "Voc:")
    c.drawString(100, height-440, f"{test_data.get('Voc', 0)} V")
    c.drawString(30, height-460, "Isc:")
    c.drawString(100, height-460, f"{test_data.get('Isc', 0)} A")
    c.drawString(30, height-480, "Fill factor:")
    c.drawString(100, height-480, f"{test_data.get('FF', 0)} %")
    
    # IV Curve image
    if os.path.exists(image_path):
        try:
            img = ImageReader(image_path)
            c.drawImage(img, 300, height-400, width=200, height=200, preserveAspectRatio=True)
        except:
            pass
    
    # Reference conditions
    c.setFont("Helvetica-Bold", 10)
    c.drawString(300, height-470, "Plot & Results reference conditions")
    c.setFont("Helvetica", 10)
    c.drawString(300, height-490, "Irradiance: 1000.00 W/m²")
    c.drawString(300, height-510, "Temperature: 25.00 °C")
    
    # Other info
    c.setFont("Helvetica-Bold", 10)
    c.drawString(300, height-540, "Other info")
    c.setFont("Helvetica", 10)
    c.drawString(300, height-560, f"Module Area: {test_data.get('ModuleArea', 2.7)} m²")
    
    c.save()

def process_qa_folders():
    base_dir = r"E:\BSNL\Generated_Output"
    
    # Find all QA folders
    qa_folders = [f for f in os.listdir(base_dir) 
                 if os.path.isdir(os.path.join(base_dir, f)) and f.startswith('QA')]
    
    print(f"Found {len(qa_folders)} QA folders to process\n")
    
    # Process each QA folder
    for folder in qa_folders:
        folder_path = os.path.join(base_dir, folder)
        excel_path = os.path.join(folder_path, "IV_Curve_Data.xlsx")
        iv_dir = os.path.join(folder_path, "IV_Curves")
        
        if not os.path.exists(excel_path):
            print(f"Skipping {folder}: Excel file not found")
            continue
            
        # Read Excel data
        try:
            df = pd.read_excel(excel_path)
            print(f"Processing {folder}: {len(df)} modules found")
        except Exception as e:
            print(f"Error reading Excel for {folder}: {str(e)}")
            continue
            
        # Create temp directory for individual PDFs
        temp_dir = os.path.join(folder_path, "temp_pdfs")
        os.makedirs(temp_dir, exist_ok=True)
        
        # Generate individual PDFs
        pdf_files = []
        for index, row in df.iterrows():
            serial = str(row['SerialNumber']).strip()
            if not serial:
                continue
                
            # Find IV curve image
            image_path = os.path.join(iv_dir, f"{serial}.png")
            if not os.path.exists(image_path):
                print(f"  IV curve not found for {serial}")
                continue
                
            # Generate PDF report
            pdf_path = os.path.join(temp_dir, f"{serial}.pdf")
            try:
                generate_report(row.to_dict(), image_path, pdf_path)
                pdf_files.append(pdf_path)
            except Exception as e:
                print(f"  Error generating PDF for {serial}: {str(e)}")
        
        # Merge all PDFs
        if pdf_files:
            merger = PdfMerger()
            for pdf_file in pdf_files:
                merger.append(pdf_file)
                
            merged_pdf = os.path.join(folder_path, f"Merged_FTR_Report_{folder}.pdf")
            merger.write(merged_pdf)
            merger.close()
            print(f"Created merged report: {merged_pdf}")
            
            # Cleanup temp files
            for pdf_file in pdf_files:
                os.remove(pdf_file)
            os.rmdir(temp_dir)
    
    print("\nAll QA folders processed!")

if __name__ == "__main__":
    process_qa_folders()
import os
import sys
from PIL import Image
from PyPDF2 import PdfMerger

def merge_images_to_pdf(folder_path, image_paths, output_filename):
    """Merge multiple images into a single PDF file"""
    try:
        # Create a PDF merger object
        merger = PdfMerger()
        
        # Create temporary PDF files for each image
        temp_pdfs = []
        skipped_files = []
        
        for img_path in image_paths:
            try:
                img = Image.open(img_path)
                pdf_path = f"{os.path.splitext(img_path)[0]}_temp.pdf"
                img.save(pdf_path, "PDF", resolution=100.0)
                temp_pdfs.append(pdf_path)
            except Exception as e:
                print(f"Skipping invalid image: {img_path} - {str(e)}")
                skipped_files.append(img_path)
                
        if not temp_pdfs:
            print("No valid images found to merge")
            return False
            
        # Merge all temporary PDFs into one
        merger = PdfMerger()
        for pdf in temp_pdfs:
            merger.append(pdf)
        
        # Save the merged PDF
        merged_pdf_path = os.path.join(folder_path, output_filename)
        merger.write(merged_pdf_path)
        merger.close()
        
        # Clean up temporary files
        for pdf in temp_pdfs:
            try:
                os.remove(pdf)
            except Exception as e:
                print(f"Error removing temp file {pdf}: {str(e)}")
        
        print(f"Created merged PDF: {merged_pdf_path}")
        if skipped_files:
            print(f"Skipped {len(skipped_files)} invalid image(s)")
        return True
        
    except Exception as e:
        print(f"Error merging PDFs: {str(e)}")
        return False

def main():
    """Main function to process all QA folders"""
    base_dir = r"E:\BSNL\Generated_Output"
    
    # Find all QA folders
    qa_folders = [f for f in os.listdir(base_dir) 
                 if os.path.isdir(os.path.join(base_dir, f)) and f.startswith('QA')]
    
    if not qa_folders:
        print("No QA folders found in the directory")
        return
    
    print(f"Found {len(qa_folders)} QA folders to process\n")
    
    # Process each QA folder
    for folder in qa_folders:
        folder_path = os.path.join(base_dir, folder)
        
        # Find all IV Curve PNG files
        iv_files = []
        for root, _, files in os.walk(folder_path):
            for file in files:
                if file.lower().endswith('.png'):
                    iv_files.append(os.path.join(root, file))
        
        if not iv_files:
            print(f"No IV curve PNG files found in {folder}")
            continue
            
        print(f"Processing {folder}: {len(iv_files)} IV curves found")
        
        # Create merged PDF
        output_pdf = f"Merged_IV_Curves_{folder}.pdf"
        merge_images_to_pdf(folder_path, iv_files, output_pdf)
    
    print("\nAll QA folders processed!")

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
Extract positioning metadata from PDF reports
"""
import fitz  # PyMuPDF
import sys

def extract_positions(pdf_path):
    """Extract positioned text and images from PDF"""
    doc = fitz.open(pdf_path)
    page = doc[0]
    
    data = {
        'text_blocks': [],
        'images': []
    }
    
    # Extract text blocks
    for block in page.get_text('blocks'):
        x0, y0, x1, y1, text, block_no, block_type = block
        if block_type == 0:  # Text block
            data['text_blocks'].append({
                'text': text.strip(),
                'bbox': [x0, y0, x1, y1],
                'position_mm': [x0 * 0.3528, y0 * 0.3528]  # points to mm
            })
    
    # Extract images
    for img_index, img in enumerate(page.get_images()):
        xref = img[0]
        base_img = doc.extract_image(xref)
        img_data = {
            'index': img_index,
            'position': None
        }
        
        # Find image position on page
        for img_instance in page.get_image_rects(xref):
            bbox = img_instance
            img_data['position'] = {
                'bbox': [bbox.x0, bbox.y0, bbox.x1, bbox.y1],
                'position_mm': [bbox.x0 * 0.3528, bbox.y0 * 0.3528]
            }
            
        if img_data['position']:
            data['images'].append(img_data)
    
    return data

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python compare_reports.py <production_report.pdf> <our_report.pdf>")
        sys.exit(1)
        
    prod_report = sys.argv[1]
    our_report = sys.argv[2]
    
    prod_data = extract_positions(prod_report)
    our_data = extract_positions(our_report)
    
    print("Production Report Text Positions:")
    for item in prod_data['text_blocks']:
        print(f"- '{item['text'][:20]}...' at {item['position_mm']}mm")
        
    print("\nOur Report Text Positions:")
    for item in our_data['text_blocks']:
        print(f"- '{item['text'][:20]}...' at {item['position_mm']}mm")
    
    print("\nComparison Summary:")
    for i, (prod_item, our_item) in enumerate(zip(prod_data['text_blocks'], our_data['text_blocks'])):
        x_diff = prod_item['position_mm'][0] - our_item['position_mm'][0]
        y_diff = prod_item['position_mm'][1] - our_item['position_mm'][1]
        print(f"Item {i+1}: X_diff={x_diff:.2f}mm, Y_diff={y_diff:.2f}mm")
        
    if prod_data['images'] and our_data['images']:
        prod_img = prod_data['images'][0]
        our_img = our_data['images'][0]
        x_diff = prod_img['position']['position_mm'][0] - our_img['position']['position_mm'][0]
        y_diff = prod_img['position']['position_mm'][1] - our_img['position']['position_mm'][1]
        print(f"\nImage Position: X_diff={x_diff:.2f}mm, Y_diff={y_diff:.2f}mm")
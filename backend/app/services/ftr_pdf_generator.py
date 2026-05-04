"""
FTR (Field Test Report) PDF Generator
Uses template PDF and fills it with exact coordinate positioning
"""

from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from PyPDF2 import PdfReader, PdfWriter
import os


class FTRPDFGenerator:
    """Generate FTR PDFs by overlaying data on template"""
    
    def __init__(self, template_path):
        """Initialize with template PDF path"""
        self.template_path = template_path
        
    def create_overlay(self, data):
        """Create overlay PDF with all the text values at exact positions"""
        packet = BytesIO()
        
        # Create canvas - A4 size (595.27 x 841.89 points)
        c = canvas.Canvas(packet, pagesize=A4)
        width, height = A4
        
        # Set font
        c.setFont("Helvetica", 11)
        c.setFillColorRGB(0, 0, 0)  # Black color
        
        # Conversion factor: 1 mm = 2.83465 points
        MM_TO_POINT = 2.83465
        
        def mm_to_point(mm_val):
            return mm_val * MM_TO_POINT
            
        def place_text(x_mm, y_mm, text):
            """Convert CSS-style mm positioning to ReportLab coordinates"""
            x_pt = mm_to_point(x_mm)
            y_pt = mm_to_point(y_mm)
            # Flip y-axis origin (CSS top-left to ReportLab bottom-left)
            c.drawString(x_pt, height - y_pt, str(text))

        # Header - positions now in mm to match CSS
        place_text(15, 45, data.get('producer', ''))   # Matches .ftr-left-column top
        place_text(15, 50, data.get('moduleType', ''))
        place_text(15, 55, data.get('serialNumber', ''))
        
        # Test conditions
        place_text(15, 80, data.get('testDate', ''))
        place_text(15, 85, data.get('testTime', ''))
        place_text(15, 90, f"{data.get('irradiance', 0):.2f} W/m²")
        place_text(15, 95, f"{data.get('moduleTemp', 0):.2f} °C")
        place_text(15, 100, f"{data.get('ambientTemp', 0):.2f} °C")
        
        # Test results
        results = data.get('results', {})
        place_text(15, 125, f"{results.get('pmax', 0):.2f} W")
        place_text(15, 130, f"{results.get('vpm', 0):.2f} V")
        place_text(15, 135, f"{results.get('ipm', 0):.2f} A")
        place_text(15, 140, f"{results.get('voc', 0):.2f} V")
        place_text(15, 145, f"{results.get('isc', 0):.2f} A")
        place_text(15, 150, f"{results.get('fillFactor', 0):.2f} %")
        place_text(15, 155, f"{results.get('rs', 0):.2f} Ω")
        place_text(15, 160, f"{results.get('rsh', 0):.2f} Ω")
        place_text(15, 165, f"{results.get('efficiency', 0):.2f} %")
        
        # Reference conditions
        place_text(115, 80, "1000.00 W/m²")
        place_text(115, 85, "25.00 °C")
        
        # Module Area
        place_text(115, 165, f"{data.get('moduleArea', 0)} m²")
        
        # Add graph image if provided
        graph_image_path = data.get('graphImagePath')
        if graph_image_path and os.path.exists(graph_image_path):
            # Position matches .ftr-graph-container with production adjustments
            img_x_mm = 115 - 7.24  # Adjust for X_diff
            img_y_mm = 45 - 10.16  # Adjust for Y_diff
            
            c.drawImage(
                graph_image_path,
                mm_to_point(img_x_mm),
                height - mm_to_point(img_y_mm) - mm_to_point(50),  # Adjust for image height
                width=mm_to_point(80),
                height=mm_to_point(50)
            )
        
        c.save()
        packet.seek(0)
        return packet
    
    def generate_pdf(self, data):
        """
        Generate final PDF by overlaying data on template
        
        Args:
            data: Dictionary with all test data
            
        Returns:
            BytesIO object containing the PDF
        """
        # Create overlay with text and graph
        overlay_pdf = self.create_overlay(data)
        
        # Read template PDF
        template_reader = PdfReader(self.template_path)
        overlay_reader = PdfReader(overlay_pdf)
        
        # Create writer
        writer = PdfWriter()
        
        # Get first page of template
        template_page = template_reader.pages[0]
        
        # Merge overlay onto template
        template_page.merge_page(overlay_reader.pages[0])
        
        # Add merged page to writer
        writer.add_page(template_page)
        
        # Write to BytesIO
        output = BytesIO()
        writer.write(output)
        output.seek(0)
        
        return output


def create_ftr_report(template_path, test_data, graph_image_path=None):
    """
    Convenience function to create FTR report
    
    Args:
        template_path: Path to template PDF
        test_data: Dictionary with test data
        graph_image_path: Optional path to graph image
        
    Returns:
        BytesIO object containing generated PDF
    """
    # Add graph path to data if provided
    if graph_image_path:
        test_data['graphImagePath'] = graph_image_path
    
    generator = FTRPDFGenerator(template_path)
    return generator.generate_pdf(test_data)

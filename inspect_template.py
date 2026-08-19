import zipfile
import re
import xml.etree.ElementTree as ET

pptx_path = r"C:\Users\LENOVO\Downloads\Major Project-I (01CE0716) - PPT format.pptx"
output_path = r"d:\Hotel Booking Management\ppt_structure.txt"

try:
    print(f"Reading template PPTX from: {pptx_path}")
    with zipfile.ZipFile(pptx_path, 'r') as z:
        # Find all slide files
        slide_files = [name for name in z.namelist() if name.startswith('ppt/slides/slide') and name.endswith('.xml')]
        # Sort slides numerically
        slide_files.sort(key=lambda x: int(re.search(r'\d+', x).group()))
        
        print(f"Found {len(slide_files)} slides in the template.")
        with open(output_path, 'w', encoding='utf-8') as out:
            out.write(f"SLIDE_COUNT: {len(slide_files)}\n")
            for slide_file in slide_files:
                xml_content = z.read(slide_file)
                root = ET.fromstring(xml_content)
                namespaces = {
                    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
                    'p': 'http://schemas.openxmlformats.org/presentationml/2006/main'
                }
                text_nodes = root.findall('.//a:t', namespaces)
                slide_text = [node.text for node in text_nodes if node.text]
                out.write(f"\n--- Slide: {slide_file} ---\n")
                out.write(" | ".join(slide_text) + "\n")
    print(f"Inspection complete! Slide texts written to {output_path}")
except Exception as e:
    with open(output_path, 'w', encoding='utf-8') as out:
        out.write(f"ERROR: {e}\n")
    print(f"Error during inspection: {e}")

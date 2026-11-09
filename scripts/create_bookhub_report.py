from pathlib import Path
from datetime import datetime
import os

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import WD_LINE_SPACING
from docx.text.paragraph import Paragraph


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "reports" / "BookHub_Project_Report_Devender_Revised_with_Logo.docx"
TMP = ROOT / "tmp" / "report_assets"
TMP.mkdir(parents=True, exist_ok=True)
OUT.parent.mkdir(parents=True, exist_ok=True)

TEAL = "0B6B63"
DEEP_TEAL = "07554F"
NAVY = "243247"
INK = "2D2520"
MUTED = "6F625A"
SAND = "E8D7C0"
CREAM = "FBF7F1"
MINT = "E3F0EC"
CORAL = "C46A4A"
WHITE = "FFFFFF"

FONT_BODY = "Aptos"
FONT_DISPLAY = "Aptos Display"


def set_cell_shading(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = tcPr.find(qn('w:shd'))
    if shd is None:
        shd = OxmlElement('w:shd')
        tcPr.append(shd)
    shd.set(qn('w:fill'), fill)


def set_cell_border(cell, **kwargs):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = tcPr.first_child_found_in('w:tcBorders')
    if tcBorders is None:
        tcBorders = OxmlElement('w:tcBorders')
        tcPr.append(tcBorders)
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        if edge in kwargs:
            tag = 'w:{}'.format(edge)
            element = tcBorders.find(qn(tag))
            if element is None:
                element = OxmlElement(tag)
                tcBorders.append(element)
            for key in ['sz', 'val', 'color', 'space']:
                if key in kwargs[edge]:
                    element.set(qn('w:{}'.format(key)), str(kwargs[edge][key]))


def set_cell_margins(cell, top=100, start=120, bottom=100, end=120):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcMar = tcPr.first_child_found_in('w:tcMar')
    if tcMar is None:
        tcMar = OxmlElement('w:tcMar')
        tcPr.append(tcMar)
    for m, v in [('top', top), ('start', start), ('bottom', bottom), ('end', end)]:
        node = tcMar.find(qn('w:' + m))
        if node is None:
            node = OxmlElement('w:' + m)
            tcMar.append(node)
        node.set(qn('w:w'), str(v))
        node.set(qn('w:type'), 'dxa')


def set_repeat_table_header(row):
    trPr = row._tr.get_or_add_trPr()
    tblHeader = OxmlElement('w:tblHeader')
    tblHeader.set(qn('w:val'), 'true')
    trPr.append(tblHeader)


def add_page_number(paragraph):
    run = paragraph.add_run()
    fldChar1 = OxmlElement('w:fldChar')
    fldChar1.set(qn('w:fldCharType'), 'begin')
    instrText = OxmlElement('w:instrText')
    instrText.set(qn('xml:space'), 'preserve')
    instrText.text = ' PAGE '
    fldChar2 = OxmlElement('w:fldChar')
    fldChar2.set(qn('w:fldCharType'), 'end')
    run._r.append(fldChar1)
    run._r.append(instrText)
    run._r.append(fldChar2)


def set_paragraph_spacing(p, before=0, after=6, line=1.12):
    pf = p.paragraph_format
    pf.space_before = Pt(before)
    pf.space_after = Pt(after)
    pf.line_spacing = line


def set_run_font(run, name=FONT_BODY, size=11, color=INK, bold=False, italic=False):
    run.font.name = name
    run._element.rPr.rFonts.set(qn('w:eastAsia'), name)
    run.font.size = Pt(size)
    run.font.color.rgb = RGBColor.from_string(color)
    run.bold = bold
    run.italic = italic


def style_document(doc):
    sec = doc.sections[0]
    sec.page_width = Inches(8.27)
    sec.page_height = Inches(11.69)
    sec.top_margin = Inches(0.72)
    sec.bottom_margin = Inches(0.70)
    sec.left_margin = Inches(0.85)
    sec.right_margin = Inches(0.85)
    sec.header_distance = Inches(0.32)
    sec.footer_distance = Inches(0.35)

    styles = doc.styles
    normal = styles['Normal']
    normal.font.name = FONT_BODY
    normal._element.rPr.rFonts.set(qn('w:eastAsia'), FONT_BODY)
    normal.font.size = Pt(10.8)
    normal.font.color.rgb = RGBColor.from_string(INK)
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.line_spacing = 1.12

    for name, size, color, before, after in [
        ('Heading 1', 23, NAVY, 14, 8),
        ('Heading 2', 15, TEAL, 10, 5),
        ('Heading 3', 12, CORAL, 8, 3),
    ]:
        st = styles[name]
        st.font.name = FONT_DISPLAY
        st._element.rPr.rFonts.set(qn('w:eastAsia'), FONT_DISPLAY)
        st.font.size = Pt(size)
        st.font.bold = True
        st.font.color.rgb = RGBColor.from_string(color)
        st.paragraph_format.space_before = Pt(before)
        st.paragraph_format.space_after = Pt(after)
        st.paragraph_format.keep_with_next = True

    for name, size, color in [('ReportSmall', 9, MUTED), ('Caption', 9.3, MUTED), ('CoverKicker', 11, TEAL), ('CoverTitle', 34, INK), ('CoverSub', 16, NAVY)]:
        if name in styles:
            st = styles[name]
        else:
            st = styles.add_style(name, WD_STYLE_TYPE.PARAGRAPH)
        st.font.name = FONT_BODY if name not in ('CoverTitle',) else FONT_DISPLAY
        st._element.rPr.rFonts.set(qn('w:eastAsia'), st.font.name)
        st.font.size = Pt(size)
        st.font.color.rgb = RGBColor.from_string(color)
        st.paragraph_format.space_after = Pt(5)


def add_header_footer(section):
    # The reference report keeps its cover clean. The revised report has no
    # repeating header/footer labels so the cover and body remain uncluttered.
    for p in section.header.paragraphs:
        p.text = ''
    for p in section.footer.paragraphs:
        p.text = ''


def add_rule(doc, color=SAND, thickness=8):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(8)
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), str(thickness))
    bottom.set(qn('w:space'), '1')
    bottom.set(qn('w:color'), color)
    pBdr.append(bottom)
    pPr.append(pBdr)
    return p


def add_title(doc, kicker, title, subtitle=None):
    p = doc.add_paragraph(style='CoverKicker')
    p.add_run(kicker.upper())
    p = doc.add_paragraph(style='Heading 1')
    p.add_run(title)
    if subtitle:
        p = doc.add_paragraph()
        r = p.add_run(subtitle)
        set_run_font(r, FONT_BODY, 11.5, MUTED)
        set_paragraph_spacing(p, after=8)
    add_rule(doc)


def add_body(doc, text, bold_prefix=None):
    p = doc.add_paragraph()
    if bold_prefix and text.startswith(bold_prefix):
        r = p.add_run(bold_prefix)
        set_run_font(r, FONT_BODY, 10.8, INK, True)
        r = p.add_run(text[len(bold_prefix):])
        set_run_font(r, FONT_BODY, 10.8, INK)
    else:
        r = p.add_run(text)
        set_run_font(r, FONT_BODY, 10.8, INK)
    set_paragraph_spacing(p)
    return p


def add_bullets(doc, items, level=0):
    for item in items:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.left_indent = Inches(0.23 + level * 0.18)
        p.paragraph_format.space_after = Pt(3)
        r = p.add_run(item)
        set_run_font(r, FONT_BODY, 10.5, INK)


def add_table(doc, headers, rows, widths=None, font_size=9.5):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table.style = 'Table Grid'
    hdr = table.rows[0]
    set_repeat_table_header(hdr)
    for i, h in enumerate(headers):
        c = hdr.cells[i]
        set_cell_shading(c, TEAL)
        set_cell_margins(c)
        c.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        if widths:
            c.width = Inches(widths[i])
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.text = ''
        r = p.add_run(str(h))
        set_run_font(r, FONT_BODY, font_size, WHITE, True)
    for ri, row in enumerate(rows):
        cells = table.add_row().cells
        for i, val in enumerate(row):
            c = cells[i]
            set_cell_margins(c)
            if widths:
                c.width = Inches(widths[i])
            set_cell_shading(c, CREAM if ri % 2 == 0 else 'F2ECE3')
            set_cell_border(c, top={'val':'single','sz':'3','color':SAND}, bottom={'val':'single','sz':'3','color':SAND}, left={'val':'single','sz':'3','color':SAND}, right={'val':'single','sz':'3','color':SAND})
            p = c.paragraphs[0]
            p.text = ''
            r = p.add_run(str(val))
            set_run_font(r, FONT_BODY, font_size, INK)
    doc.add_paragraph().paragraph_format.space_after = Pt(1)
    return table


def add_figure(doc, path, caption, width=6.35):
    if path and Path(path).exists():
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run()
        r.add_picture(str(path), width=Inches(width))
        set_paragraph_spacing(p, after=3)
        cp = doc.add_paragraph(style='Caption')
        cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        cp.add_run(caption)
    else:
        p = doc.add_paragraph(style='Caption')
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.add_run(caption + ' (image not available in the current workspace)')


def add_certificate_page(doc):
    """Place the supplied portrait certificate on one dedicated early page."""
    add_page_break(doc)
    add_title(doc, 'INTERNSHIP DOCUMENT', 'Internship completion certificate', 'Codtech IT Solutions Private Limited • MERN Stack Web Development')
    certificate_path = Path('C:/Users/Admin/Desktop/Book Store/tmp/pdf-review/certificate.png')
    if not certificate_path.exists():
        certificate_path = Path('C:/Users/Admin/Desktop/Book Store/output/presentation/assets/certificate-1.png')
    # Keep the complete portrait certificate and caption within one A4 page.
    add_figure(doc, certificate_path, 'Internship completion certificate issued for Devender (Intern ID CITS2765).', width=5.55)


def _insert_text_before_table(table, text, bold_prefix=None, size=10.5, color=INK, after=3):
    """Create a paragraph at the table's exact position in the document body."""
    p = Paragraph(OxmlElement('w:p'), table._parent)
    table._tbl.addprevious(p._p)
    if bold_prefix and text.startswith(bold_prefix):
        r = p.add_run(bold_prefix)
        set_run_font(r, FONT_BODY, size, TEAL, True)
        r = p.add_run(text[len(bold_prefix):])
        set_run_font(r, FONT_BODY, size, color)
    else:
        r = p.add_run(text)
        set_run_font(r, FONT_BODY, size, color)
    set_paragraph_spacing(p, after=after, line=1.08)
    return p


def flatten_repetitive_tables(doc, preserve_indices={6, 8, 11}):
    """Turn repetitive tables into labelled paragraphs while retaining key technical tables."""
    tables = list(doc.tables)
    for index, table in enumerate(tables):
        if index in preserve_indices:
            continue
        rows = [[c.text.replace('\n', ' / ').strip() for c in row.cells] for row in table.rows]
        if not rows:
            table._element.getparent().remove(table._element)
            continue
        headers = rows[0]
        if len(headers) > 1:
            _insert_text_before_table(table, '  •  '.join(x for x in headers if x), size=10.2, color=TEAL, after=4)
        for row in rows[1:]:
            vals = [x for x in row if x]
            if not vals:
                continue
            if len(headers) == 2 and len(vals) >= 2:
                text = f'{vals[0]} — {vals[1]}'
                _insert_text_before_table(table, text, bold_prefix=f'{vals[0]} —', size=10.4, after=3)
            else:
                parts = []
                for i, val in enumerate(vals):
                    label = headers[i] if i < len(headers) and headers[i] else f'Item {i+1}'
                    parts.append(f'{label}: {val}')
                _insert_text_before_table(table, '  •  '.join(parts), size=9.9, after=3)
        table._element.getparent().remove(table._element)


def add_page_break(doc):
    doc.add_page_break()


def add_chapter(doc, num, title, subtitle=None):
    add_page_break(doc)
    add_title(doc, f'CHAPTER {num}', title, subtitle)


def make_architecture_png(path):
    from PIL import Image, ImageDraw, ImageFont
    W, H = 1500, 760
    img = Image.new('RGB', (W, H), '#FBF7F1')
    d = ImageDraw.Draw(img)
    try:
        bold = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', 32)
        regular = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 24)
        small = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 20)
    except Exception:
        bold = regular = small = None
    d.rounded_rectangle((60, 70, 1440, 210), radius=25, fill='#DDECE7', outline='#0B6B63', width=4)
    d.text((90, 95), 'Customer / Admin React Client', font=bold, fill='#243247')
    d.text((90, 145), 'Vite • React Router • Redux Toolkit • Axios • Tailwind CSS', font=regular, fill='#2D2520')
    d.rounded_rectangle((60, 305, 1440, 470), radius=25, fill='#E8D7C0', outline='#C46A4A', width=4)
    d.text((90, 330), 'Express API and business services', font=bold, fill='#243247')
    d.text((90, 380), 'Auth • catalog • inventory • orders • rentals • digital access • notifications • payments', font=regular, fill='#2D2520')
    d.text((90, 420), 'Validation • role authorization • error handling • rate limiting • audit boundaries', font=small, fill='#6F625A')
    d.rounded_rectangle((60, 575, 690, 700), radius=25, fill='#E3F0EC', outline='#0B6B63', width=4)
    d.text((90, 600), 'MongoDB + Mongoose', font=bold, fill='#243247')
    d.text((90, 650), 'Users, books, copies, orders, rentals, reviews', font=small, fill='#2D2520')
    d.rounded_rectangle((810, 575, 1440, 700), radius=25, fill='#F4E6D9', outline='#C46A4A', width=4)
    d.text((840, 600), 'Protected digital assets', font=bold, fill='#243247')
    d.text((840, 650), 'PDF metadata + future private storage / signed URLs', font=small, fill='#2D2520')
    for x1, y1, x2, y2 in [(750,210,750,305),(750,470,380,575),(750,470,1125,575)]:
        d.line((x1,y1,x2,y2), fill='#0B6B63', width=6)
        d.polygon([(x2,y2),(x2-12,y2-22),(x2+12,y2-22)], fill='#0B6B63')
    img.save(path)


def make_er_png(path):
    from PIL import Image, ImageDraw, ImageFont
    W, H = 1600, 1050
    img = Image.new('RGB', (W, H), '#FBF7F1')
    d = ImageDraw.Draw(img)
    try:
        b = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', 24)
        r = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 18)
    except Exception:
        b = r = None
    boxes = {
        'User': (50, 80, 390, 295), 'Book': (610, 70, 990, 315), 'BookCopy': (1210, 70, 1560, 285),
        'Order': (50, 470, 390, 690), 'Rental': (610, 470, 990, 720), 'Review': (1210, 420, 1560, 610),
        'Location': (1210, 760, 1560, 950), 'Reservation': (610, 790, 990, 1015)
    }
    colors = {'User':'#DDECE7','Book':'#E8D7C0','BookCopy':'#F4E6D9','Order':'#E3F0EC','Rental':'#F4E6D9','Review':'#DDECE7','Location':'#E8D7C0','Reservation':'#E3F0EC'}
    fields = {
        'User':['PK userId','email','role','status'], 'Book':['PK bookId','title','ISBN','price','digitalEnabled'],
        'BookCopy':['PK copyId','FK bookId','FK locationId','status','condition'], 'Order':['PK orderId','FK userId','items','total','paymentStatus'],
        'Rental':['PK rentalId','FK userId','FK bookId','FK copyId','type','status'], 'Review':['PK reviewId','FK userId','FK bookId','rating','status'],
        'Location':['PK locationId','parentLocation','type','name'], 'Reservation':['PK reservationId','FK userId','FK bookId','queuePosition','status']
    }
    for name,(x1,y1,x2,y2) in boxes.items():
        d.rounded_rectangle((x1,y1,x2,y2), radius=18, fill=colors[name], outline='#0B6B63', width=3)
        d.text((x1+18,y1+14), name, font=b, fill='#243247')
        yy=y1+55
        for f in fields[name]:
            d.text((x1+20,yy), f, font=r, fill='#2D2520'); yy += 30
    def line(a,b):
        x1,y1,x2,y2 = a; x3,y3,x4,y4 = b
        d.line((x1,y1,x3,y3), fill='#C46A4A', width=4)
    line((390,160,610,160),(610,160,610,160))
    line((990,170,1210,170),(1210,170,1210,170))
    line((220,295,220,470),(220,470,220,470))
    line((800,315,800,470),(800,470,800,470))
    line((990,560,1210,560),(1210,560,1210,560))
    d.line((1210,170,1160,170,1160,760,1210,760), fill='#C46A4A', width=4)
    line((800,720,800,790),(800,790,800,790))
    for txt, pos in [('1 user → many orders',(405,135)),('1 book → many copies',(1000,145)),('1 user → many rentals',(250,360)),('1 book → many rentals',(810,365)),('1 user/book → reviews',(1000,520)),('copy → shelf location',(1000,720)),('book/user → reservations',(820,760))]:
        d.text(pos, txt, font=r, fill='#6F625A')
    img.save(path)


def cover_page(doc):
    # Cover layout follows the reference report: centered academic identity,
    # project title, internship provider, then a compact submitted-to/by block.
    university_logo = Path('C:/Users/Admin/Desktop/Book Store/tmp/friend_media/image1.png')
    if university_logo.exists():
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run()
        r.add_picture(str(university_logo), width=Inches(1.05))
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(26)
    r = p.add_run('BOOKHUB')
    set_run_font(r, FONT_DISPLAY, 18, TEAL, True)
    p = doc.add_paragraph(style='CoverTitle')
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(12)
    r = p.add_run('Online Bookstore &\nDigital Library Management System')
    set_run_font(r, FONT_DISPLAY, 30, INK, True)
    p = doc.add_paragraph(style='CoverSub')
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run('Professional Training Report')
    set_run_font(r, FONT_DISPLAY, 15, NAVY, True)
    add_rule(doc, TEAL, 12)
    for text, size, color, bold in [
        ('Submitted in partial fulfilment of the requirements for', 10.5, MUTED, False),
        ('Bachelor of Technology', 14, NAVY, True),
        ('in', 10.5, MUTED, False),
        ('Department of Computer Science and Engineering', 13, NAVY, True),
        ('Deenbandhu Chhotu Ram University of Science and Technology, Murthal', 10.5, INK, True),
        ('Academic Session 2026–2027', 10.5, TEAL, True),
    ]:
        p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(text); set_run_font(r, FONT_BODY if size < 14 else FONT_DISPLAY, size, color, bold)
        p.paragraph_format.space_after = Pt(3)
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run('Codtech IT Solutions Private Limited')
    set_run_font(r, FONT_DISPLAY, 14, CORAL, True)
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run('Intern ID: CITS2765  |  Duration: 8 Weeks  |  30 May 2026 – 25 July 2026')
    set_run_font(r, FONT_BODY, 9.7, MUTED)
    doc.add_paragraph()
    info = [
        ('Submitted to', 'Dr. Jitender Bharadwaj Sir\nDepartment of Computer Science and Engineering'),
        ('Submitted by', 'Devender\nRoll No. 23001001023\nB.Tech CSE • 4th Year • 7th Semester'),
    ]
    t = doc.add_table(rows=0, cols=2)
    t.alignment = WD_TABLE_ALIGNMENT.LEFT
    t.autofit = False
    for label, value in info:
        row = t.add_row().cells
        row[0].width = Inches(1.55); row[1].width = Inches(4.85)
        set_cell_shading(row[0], MINT); set_cell_shading(row[1], CREAM)
        set_cell_margins(row[0], 100, 130, 100, 130); set_cell_margins(row[1], 100, 130, 100, 130)
        for c in row: set_cell_border(c, top={'val':'single','sz':'3','color':SAND}, bottom={'val':'single','sz':'3','color':SAND}, left={'val':'single','sz':'3','color':SAND}, right={'val':'single','sz':'3','color':SAND})
        row[0].paragraphs[0].text=''; row[1].paragraphs[0].text=''
        r1=row[0].paragraphs[0].add_run(label); set_run_font(r1, FONT_BODY, 9.5, TEAL, True)
        r2=row[1].paragraphs[0].add_run(value); set_run_font(r2, FONT_BODY, 9.5, INK, True)
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(18)
    r = p.add_run('A practical MERN-stack bookstore experience')
    set_run_font(r, FONT_BODY, 10.5, CORAL, True, True)


def build():
    arch = TMP / 'architecture.png'; er = TMP / 'er-diagram.png'
    make_architecture_png(arch); make_er_png(er)
    doc = Document()
    style_document(doc)
    add_header_footer(doc.sections[0])
    cover_page(doc)
    add_certificate_page(doc)

    add_page_break(doc)
    add_title(doc, 'REPORT GUIDE', 'Contents', 'The report follows the same academic flow as the supplied reference: context → problem → design → implementation → evidence → reflection.')
    contents = [
        'Internship completion certificate', 'Acknowledgement', 'Preface and project snapshot', 'Chapter 1 — Internship and project context', 'Chapter 2 — Problem statement and objectives',
        'Chapter 3 — Scope, users, and requirements', 'Chapter 4 — Technology stack and development tools', 'Chapter 5 — System architecture and workflow',
        'Chapter 6 — Database design and ER model', 'Chapter 7 — Core modules and implementation', 'Chapter 8 — Interface evidence',
        'Chapter 9 — Testing, validation, and security', 'Chapter 10 — Limitations and future scope', 'Chapter 11 — Learning outcomes', 'Conclusion', 'References', 'Appendix B — Demonstration checklist'
    ]
    add_table(doc, ['No.', 'Section'], [[str(i+1).zfill(2), x] for i,x in enumerate(contents)], widths=[0.55,5.8], font_size=10)

    add_page_break(doc)
    add_title(doc, 'ACKNOWLEDGEMENT', 'Acknowledgement')
    add_body(doc, 'I express my sincere gratitude to Dr. Jitender Bharadwaj Sir for his guidance, encouragement, and academic support during the development and documentation of BookHub. His feedback helped me connect software engineering concepts with a complete, working bookstore platform.')
    add_body(doc, 'I am thankful to the faculty members of the Department of Computer Science and Engineering, DCRUST, Murthal, for providing an environment that encouraged experimentation, documentation, and technical learning. I also acknowledge Codtech IT Solutions Private Limited for the internship context and practical exposure to full-stack web development.')
    add_body(doc, 'Finally, I thank my family and friends for their support during implementation, testing, and preparation of this report.')
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.RIGHT; r=p.add_run('Devender'); set_run_font(r,FONT_BODY,11,TEAL,True)

    add_page_break(doc)
    add_title(doc, 'PREFACE', 'Project snapshot', 'BookHub is documented as an academic implementation. Production integrations that are not yet connected are explicitly marked as future scope.')
    add_body(doc, 'BookHub is a full-stack bookstore management platform for a single physical store in Rewari, India. It brings online discovery, purchase and rental workflows, digital reading access, exact shelf locations, customer self-service, and staff operations into one system.')
    add_body(doc, 'The project is designed around a simple promise: make every title discoverable, every physical copy traceable, and every customer interaction understandable. Customers can browse sections, search the catalogue, buy or rent books, reserve unavailable titles, maintain a wishlist, read eligible digital editions, view notifications, and submit verified reviews. Staff and owners can manage catalogue records, copies, branches, shelf locations, orders, rentals, payments, and operational signals.')
    add_body(doc, 'The implementation uses a React/Vite client and a Node.js/Express API backed by MongoDB and Mongoose. JWT authentication, role-based permissions, validation, security middleware, and server-side business rules protect the main workflows. Checkout and payment records are intentionally labelled demo mode; a live payment gateway is not claimed as implemented.')
    add_table(doc, ['Project fact', 'Verified detail'], [
        ('Project name', 'BookHub — Online Bookstore & Digital Library Management System'),
        ('Primary audience', 'Students, everyday readers, bookstore staff, managers, and owners'),
        ('Store context', 'Single-store bookstore in Rewari, India'),
        ('Core formats', 'Physical purchase, physical rental, and digital rental / reading access'),
        ('Current data boundary', 'MongoDB operational data; production private file storage is planned'),
        ('Payment boundary', 'Demo checkout and demo payment status; no live gateway connected'),
    ], widths=[1.7,4.65], font_size=9.7)

    add_chapter(doc, 1, 'Internship and project context', 'The internship provided the practical setting for applying full-stack development, database design, security, and user-interface skills.')
    doc.add_paragraph('1.1 About Codtech IT Solutions Private Limited', style='Heading 2')
    add_body(doc, 'Codtech IT Solutions Private Limited is the organisation identified in the supplied internship documents. The certificate lists its address as 8-7-7/2, Plot No. 51, Opp. Naveena School, Hastinapuram Central, Hyderabad, 500079, Telangana. For this report, the company is presented as the internship provider and practical training context; no unverified claims about specific client projects or commercial products are added.')
    add_body(doc, 'The internship domain was MERN Stack Web Development. The training context supported practical learning through assignment-based work, progress review, technical problem solving, documentation, and professional communication. BookHub is the project developed and documented within that context.')
    doc.add_paragraph('1.2 Internship profile', style='Heading 2')
    add_body(doc, 'The project materials identify Intern ID CITS2765 and an eight-week period from 30 May 2026 to 25 July 2026. The internship framing encouraged an end-to-end implementation mindset: define the problem, design the data contract, build the interface and API, test the workflow, and communicate limitations clearly.')
    doc.add_paragraph('1.3 Why a bookstore platform?', style='Heading 2')
    add_body(doc, 'A bookstore is a useful academic domain because it combines public discovery with operational rules. A reader needs to know whether a title exists, whether a physical copy is available, where that copy is shelved, whether a digital edition is available, and what happens after an order or rental is created. Staff need a separate view for stock, locations, returns, reservations, and customer updates. BookHub makes these relationships visible in one coherent project.')
    doc.add_paragraph('1.4 Project motivation', style='Heading 2')
    add_bullets(doc, ['Readers should not depend on a manual stock enquiry for every title.', 'Book copies, orders, rentals, and notifications should share consistent status rules.', 'Digital reading access should be checked by the server and expire with the entitlement.', 'A small bookstore should be able to begin with one branch while keeping a path to future expansion.'])

    add_chapter(doc, 2, 'Problem statement and objectives', 'BookHub turns fragmented bookstore tasks into a single, role-aware workflow.')
    doc.add_paragraph('2.1 Problem statement', style='Heading 2')
    add_body(doc, 'How can a local bookstore provide a modern self-service experience for discovery, purchase, physical rentals, reservations, and digital reading without losing control over inventory, shelf locations, user permissions, and business rules?')
    doc.add_paragraph('2.2 Existing approach and limitations', style='Heading 2')
    add_table(doc, ['Area', 'Fragmented approach', 'BookHub approach'], [
        ('Discovery', 'Static list or in-person enquiry', 'Search, sections, filters, thumbnails, and book detail pages'),
        ('Availability', 'Manual stock check', 'BookCopy status plus exact branch / floor / section / rack / shelf'),
        ('Orders', 'Messages or spreadsheets', 'Order state, demo payment record, and notifications'),
        ('Rentals', 'Paper due dates', 'Server-calculated due date, return status, and penalty rules'),
        ('Digital access', 'Uncontrolled file sharing', 'Authenticated, time-limited access checked by the backend'),
        ('Reviews', 'Unverified comments', 'Verified customer activity plus moderation status'),
    ], widths=[1.15,2.45,2.75], font_size=8.8)
    doc.add_paragraph('2.3 Objectives', style='Heading 2')
    add_bullets(doc, ['Create a polished catalogue and section-based discovery experience.', 'Support physical purchase, physical rental, and digital rental journeys.', 'Track each physical copy and its precise shelf location.', 'Give customers and staff role-specific visibility and actions.', 'Keep access, availability, rental, and payment rules on the server.', 'Provide a realistic, explainable academic implementation with documented future integrations.'])

    add_chapter(doc, 3, 'Scope, users, and requirements', 'The scope balances a credible college demonstration with a production-aware design.')
    doc.add_paragraph('3.1 Target users and roles', style='Heading 2')
    add_table(doc, ['Role', 'Main capabilities'], [
        ('Customer', 'Browse, search, buy or rent, reserve, read eligible digital editions, review, wishlist, notifications, profile'),
        ('Inventory staff', 'Manage copies, locations, checkouts, returns, condition, and stock status'),
        ('Manager', 'Manage catalogue, customers, orders, reservations, reports, and staff operations'),
        ('Owner', 'Full access, settings, sensitive adjustments, and administration'),
    ], widths=[1.35,5.0], font_size=9.4)
    doc.add_paragraph('3.2 Functional requirements', style='Heading 2')
    add_bullets(doc, ['Authentication: registration, login, refresh sessions, logout, password changes, and password-reset foundation.', 'Catalogue: title details, authors, categories, publishers, formats, cover, pricing, search, filtering, sorting, and sections.', 'Commerce: cart, quantity changes, demo checkout, order history, payment history, and receipt-ready payment records.', 'Rentals: physical copy assignment, due dates, returns, overdue status, penalties, and digital access expiry.', 'Operations: branches, locations, physical copy inventory, reservations, notifications, customer reviews, and admin dashboard metrics.'])
    doc.add_paragraph('3.3 Non-functional requirements', style='Heading 2')
    add_bullets(doc, ['Security: password hashing, JWT authentication, role authorization, rate limiting, Helmet headers, CORS restrictions, and input validation.', 'Reliability: centralized errors, request context, server-side business rules, and safe demo payment boundaries.', 'Usability: responsive interface, consistent navigation, clear status badges, accessible forms, loading states, and empty states.', 'Maintainability: routes → controllers → services → models separation, reusable client components, and documented data contracts.'])
    doc.add_paragraph('3.4 Scope boundary', style='Heading 2')
    add_table(doc, ['Implemented in the current project', 'Not claimed as complete'], [
        ('Catalogue, auth foundation, cart, demo checkout, orders, rentals, digital access, notifications, wishlist, reservations, reviews, admin dashboard, inventory locations, security middleware, UI polish', 'Live payment gateway, provider email/SMS/WhatsApp delivery, private production PDF object storage, multi-branch transfers, supplier purchasing, external delivery tracking')
    ], widths=[3.15,3.2], font_size=8.9)

    add_chapter(doc, 4, 'Technology stack and development tools', 'Each technology has a clear role in the BookHub request–response flow.')
    add_table(doc, ['Technology', 'Category', 'Role in BookHub'], [
        ('React 19', 'Frontend library', 'Builds reusable pages and components such as book cards, forms, dashboards, and status panels.'),
        ('Vite', 'Build tool', 'Runs the client during development and creates the production frontend bundle.'),
        ('React Router', 'Client routing', 'Separates Home, Books, Book Details, Cart, Digital Library, Payments, Admin, and other routes.'),
        ('Redux Toolkit', 'State management', 'Maintains cross-page state such as authentication, cart, and notifications.'),
        ('Axios', 'HTTP client', 'Sends JSON requests to the Express API and normalizes API responses and errors.'),
        ('Tailwind CSS', 'UI styling', 'Provides responsive utility classes and the BookHub visual design system.'),
        ('Node.js', 'Runtime', 'Runs the server-side JavaScript application.'),
        ('Express 5', 'Web framework', 'Defines the API routes and request pipeline.'),
        ('MongoDB', 'Database', 'Stores users, books, copies, locations, orders, rentals, reviews, and operational records.'),
        ('Mongoose', 'ODM', 'Defines schemas, relationships, validation helpers, and database queries.'),
        ('JWT + bcryptjs', 'Authentication', 'JWT identifies authenticated sessions; bcryptjs stores password hashes rather than plain passwords.'),
        ('Zod / middleware', 'Validation and safety', 'Validates inputs, checks ObjectIds, sanitizes requests, and keeps errors consistent.'),
    ], widths=[1.35,1.55,3.45], font_size=8.5)
    doc.add_paragraph('4.1 Simple request–response explanation', style='Heading 2')
    add_body(doc, 'When a reader searches for a title, the React page sends a request through Axios to an Express route. The controller validates the request and calls the relevant service or model query. Mongoose retrieves matching records from MongoDB. The server returns a JSON response, and React updates the visible cards without rebuilding the page. Protected actions add a JWT token, and the server checks the role and ownership before changing data.')
    doc.add_paragraph('4.2 Why this stack fits the project', style='Heading 2')
    add_body(doc, 'The stack keeps the browser experience responsive while centralising business decisions on the API. React makes catalogue and dashboard interfaces reusable; Express provides a small, readable backend boundary; MongoDB suits the evolving catalogue and operational records; and Mongoose makes relationships and validation explicit. The main limitation is that external production services still need to be connected deliberately rather than assumed.')

    add_chapter(doc, 5, 'System architecture and workflow', 'The architecture separates interface, business rules, persistence, and protected digital assets.')
    add_figure(doc, arch, 'Figure 5.1  BookHub architecture and integration boundaries.', width=6.35)
    doc.add_paragraph('5.1 Application layers', style='Heading 2')
    add_bullets(doc, ['Client layer: React pages and reusable components render the customer and admin experience.', 'API layer: Express routes expose authenticated and public endpoints.', 'Business layer: controllers and services handle availability, due dates, penalties, digital expiry, reservations, and notifications.', 'Data layer: Mongoose models persist operational records in MongoDB.', 'Asset boundary: covers and PDFs are represented through protected metadata; production signed URLs are a future storage integration.'])
    doc.add_paragraph('5.2 End-to-end customer workflow', style='Heading 2')
    add_table(doc, ['Step', 'What happens'], [
        ('1. Discover', 'Customer opens Home or Books, searches a title, filters by section or format, and opens Book Details.'),
        ('2. Decide', 'Book Details shows title metadata, price, rental options, physical availability, shelf context, and digital availability where configured.'),
        ('3. Select', 'Customer adds a purchase, physical rental, or digital rental to the cart; unavailable physical stock can be reserved.'),
        ('4. Checkout', 'Server validates the cart, creates an order and demo payment record, and creates rental/access records where relevant.'),
        ('5. Operate', 'Staff can fulfil, return, move, or update copies; the server recalculates status and penalties.'),
        ('6. Inform', 'Notifications and history pages expose order, rental, overdue, return, reservation, and digital-access updates.'),
    ], widths=[1.1,5.25], font_size=9.2)

    add_chapter(doc, 6, 'Database design and ER model', 'The data model separates a title from its physical copies so availability and location remain accurate.')
    add_figure(doc, er, 'Figure 6.1  Simplified ER model based on the verified BookHub data contract.', width=6.35)
    doc.add_paragraph('6.1 Core entities', style='Heading 2')
    add_table(doc, ['Entity', 'Purpose and important fields'], [
        ('User', 'Identity, role, status, profile, password/session metadata; PK userId'),
        ('Book', 'Title, ISBN, authors, categories, publisher, prices, availability flags, cover, digital metadata; PK bookId'),
        ('BookCopy', 'Individual physical item, QR/inventory code, book reference, shelf location, status, condition; PK copyId'),
        ('Location', 'Branch → floor → section → rack → shelf hierarchy; self-reference parentLocation; PK locationId'),
        ('Order', 'Customer, item snapshots, totals, fulfilment status, payment status; PK orderId, FK userId'),
        ('Rental', 'Physical or digital rental, price snapshot, start/due/return times, status, penalty; PK rentalId'),
        ('Reservation', 'Title-level waiting queue, position, claim window, status; PK reservationId'),
        ('Review', 'Verified customer rating and text with moderation status; unique user + book'),
        ('Notification', 'Recipient, event type, message, related record, read status; FK recipient'),
    ], widths=[1.35,5.0], font_size=8.8)
    doc.add_paragraph('6.2 Important relationships and constraints', style='Heading 2')
    add_bullets(doc, ['One Book can have many BookCopy records; a BookCopy points to one assignable shelf location.', 'One User can have many Orders, Rentals, Notifications, Reservations, and Reviews.', 'A Review is unique per user and book and is accepted only after matching purchase or rental activity.', 'A physical copy can be sold, rented, or reserved only when its status permits the transition.', 'Digital content requires an authenticated user and an active, unexpired digital entitlement.', 'Orders and rentals snapshot prices and key item details so later catalogue edits do not rewrite history.'])

    add_chapter(doc, 7, 'Core modules and implementation', 'The implementation is organised around the tasks a bookstore actually performs.')
    modules = [
        ('Catalogue and discovery', 'Search, category/section filters, formats, sorting, book cards, details, cover availability, and PDF/online-edition status.'),
        ('Authentication and profiles', 'Registration, sign-in, refresh/logout, account profile, role-aware navigation, and password foundations.'),
        ('Cart, orders, and payments', 'Purchase and rental cart items, quantity controls, demo checkout, order history, and demo payment history.'),
        ('Physical rentals', 'Copy assignment, due dates, returns, overdue refresh, penalties, lost/damaged outcomes, and notifications.'),
        ('Digital library', 'DigitalAccess records, active/expired state, backend checks before opening, and protected reader metadata.'),
        ('Inventory and locations', 'Branches, hierarchical locations, physical copies, QR/inventory codes, condition, movement, and availability.'),
        ('Engagement', 'Wishlist, verified reviews, moderation, reservations/waitlist, notifications, and customer self-service.'),
        ('Admin portal', 'Dashboard metrics, orders, rentals, digital access, customers, payments, inventory, catalogue, sections, and operational actions.'),
    ]
    add_table(doc, ['Module', 'Working in the current application'], modules, widths=[1.65,4.7], font_size=8.9)
    doc.add_paragraph('7.1 Digital reading boundary', style='Heading 2')
    add_body(doc, 'The digital library does not treat a public link as proof of entitlement. The backend checks that the signed-in customer has a matching, active, unexpired DigitalAccess record before returning reader metadata. Some catalogue entries are online editions rather than direct PDF files; the interface labels that distinction so a user is not misled. Production PDFs should be stored privately and opened through short-lived signed URLs.')
    doc.add_paragraph('7.2 Reviews and reservations', style='Heading 2')
    add_body(doc, 'A customer review is visible on the relevant book detail page after the review service accepts the user’s purchase or rental eligibility. Owners or managers can moderate visibility. A reservation is a waitlist entry for a title when no eligible physical copy is available; it is not an instant purchase or rental.')

    add_chapter(doc, 8, 'Interface evidence', 'The following screenshots are selected from the supplied BookHub interface captures and are used only to demonstrate what they visibly show.')
    screenshots = [
        ('C:/Users/Admin/AppData/Local/Temp/codex-clipboard-968edb9b-d80b-4977-ba40-c1f550209092.png', 'Figure 8.1  Home page hero: discovery, rental, digital access, and bookstore positioning.'),
        ('C:/Users/Admin/AppData/Local/Temp/codex-clipboard-435b5bc2-0edf-43e4-b2dc-145d5a3a406c.png', 'Figure 8.2  Homepage section cards organise titles by reading theme.'),
        ('C:/Users/Admin/AppData/Local/Temp/codex-clipboard-16361610-720e-45fa-ac9a-ec0aae5ed07e.png', 'Figure 8.3  Book cards show cover, section, title, author, and review state.'),
        ('C:/Users/Admin/AppData/Local/Temp/codex-clipboard-292398dd-ad7e-4f28-9b91-4eda8d46a108.png', 'Figure 8.4  Book discovery page with search, category, format, and sort controls.'),
        ('C:/Users/Admin/AppData/Local/Temp/codex-clipboard-5008fbb3-8585-40a5-a007-1e0f6be9ac2a.png', 'Figure 8.5  Digital library lists active titles and digital-edition actions.'),
        ('C:/Users/Admin/AppData/Local/Temp/codex-clipboard-5bdb7da7-8086-4bf3-abc1-54043995f3ea.png', 'Figure 8.6  Admin dashboard summarises books, copies, availability, rentals, customers, orders, and revenue.'),
        ('C:/Users/Admin/AppData/Local/Temp/codex-clipboard-83cfe0ae-751e-4978-b08f-87eba67cfd6e.png', 'Figure 8.7  Admin book form includes section, cover, PDF URL, description, and pricing fields.'),
    ]
    for i, (path, cap) in enumerate(screenshots):
        if Path(path).exists():
            add_figure(doc, path, cap, width=6.2 if i in (0,1,3,5) else 5.9)
            if i in (1,3,5): add_page_break(doc)
    add_body(doc, 'The screenshots demonstrate the intended customer and admin experience. They do not, by themselves, prove database connectivity, production deployment, or live payment processing; those claims remain bounded by the implementation notes and project checks.')

    add_chapter(doc, 9, 'Testing, validation, and security', 'The project combines build checks, backend smoke coverage, client linting, and server-side rules.')
    doc.add_paragraph('9.1 Verification approach', style='Heading 2')
    add_table(doc, ['Check', 'Purpose', 'Evidence in project'], [
        ('Frontend build', 'Confirm the Vite client produces a production bundle.', '`npm run build` is part of the project check workflow.'),
        ('Frontend lint', 'Catch common JSX and JavaScript issues.', '`npm run lint` is available; current documentation notes warnings but no blocking errors.'),
        ('Backend smoke test', 'Exercise foundational API and auth boundaries.', '`server npm test` runs the smoke-test script when the backend is available.'),
        ('Project check', 'Combine backend smoke test, frontend lint, and production build.', '`scripts/check-project.ps1` is provided in the repository.'),
        ('Production configuration', 'Detect missing secrets and unsafe configuration before deployment.', '`server npm run check:production` is available.'),
    ], widths=[1.35,2.55,2.9], font_size=8.7)
    doc.add_paragraph('9.2 Security controls', style='Heading 2')
    add_bullets(doc, ['Passwords are hashed with bcryptjs and are never returned by the API.', 'JWT authentication identifies sessions; role and ownership checks protect protected actions.', 'Zod validators, ObjectId validation, sanitization, and central error handling reduce malformed-input risk.', 'Helmet, CORS restrictions, rate limiting, request IDs, and environment-based secrets add server boundaries.', 'Digital access is checked against an active rental by the backend, not by a browser-only flag.', 'Demo payment status is intentionally visible and is not presented as a real transaction.'])
    doc.add_paragraph('9.3 Known verification boundary', style='Heading 2')
    add_body(doc, 'The project is designed to run locally with MongoDB Atlas credentials and the documented environment variables. A live payment provider, external email/SMS provider, and private production file store are not claimed as connected. Any final demonstration should therefore use the clearly labelled demo mode and verify the local environment before presenting.')

    add_chapter(doc, 10, 'Limitations and future scope', 'The project is honest about what is implemented and what should be added before production use.')
    doc.add_paragraph('10.1 Current limitations', style='Heading 2')
    add_bullets(doc, ['Checkout and payment records use a demo boundary; no real money is charged.', 'Digital PDF storage and signed production delivery require a private object-storage integration.', 'Email, SMS, and WhatsApp notifications are not connected; notifications are in-app.', 'Multi-branch transfers, supplier purchasing, and delivery tracking are intentionally deferred.', 'A production deployment needs environment-specific secrets, monitoring, backups, and a final accessibility/security review.'])
    doc.add_paragraph('10.2 Proposed future enhancements', style='Heading 2')
    add_table(doc, ['Priority', 'Enhancement', 'Benefit'], [
        ('High', 'Integrate a real payment gateway with webhook verification and refund handling.', 'Turns demo checkout into a traceable production transaction flow.'),
        ('High', 'Move PDFs and covers to private object storage with signed URLs and download auditing.', 'Protects digital assets while keeping access convenient.'),
        ('High', 'Add automated browser tests and CI checks for search, checkout, rentals, PDF access, and admin permissions.', 'Prevents regressions in the highest-risk workflows.'),
        ('Medium', 'Connect an approved email/SMS provider and background job runner.', 'Makes order, due-date, and reservation updates reach customers outside the app.'),
        ('Medium', 'Add multi-branch transfer and stock reconciliation workflows.', 'Supports growth beyond the initial Rewari store.'),
        ('Low', 'Add analytics for popular sections, rental demand, low stock, and review trends.', 'Helps owners make evidence-based catalogue decisions.'),
    ], widths=[0.75,3.15,2.9], font_size=8.6)

    add_chapter(doc, 11, 'Learning outcomes', 'BookHub connected classroom concepts with a complete, explainable software project.')
    add_table(doc, ['Area', 'Learning outcome'], [
        ('Requirements', 'Converted bookstore tasks into functional and non-functional requirements.'),
        ('Frontend engineering', 'Built reusable React pages, route-aware navigation, forms, cards, filters, loading states, and responsive layouts.'),
        ('Backend engineering', 'Organised Express routes, controllers, services, validators, middleware, and error handling.'),
        ('Database design', 'Separated titles from physical copies and modelled orders, rentals, reservations, reviews, locations, and notifications.'),
        ('Security', 'Applied password hashing, JWT sessions, role authorization, sanitization, rate limiting, and protected access checks.'),
        ('Communication', 'Explained business rules, limitations, screenshots, and future integrations in an academic format.'),
    ], widths=[1.5,5.0], font_size=9.1)
    add_body(doc, 'The central lesson is that a useful software product needs more than a visually attractive interface. It needs a consistent data contract, server-side rules, clear user roles, honest boundaries, and documentation that another person can follow.')

    add_page_break(doc)
    add_title(doc, 'CONCLUSION', 'Conclusion')
    add_body(doc, 'BookHub connects catalogue discovery, physical inventory, purchases, rentals, reservations, digital reading access, reviews, notifications, payments history, and owner operations in one bookstore platform. The architecture keeps the customer experience simple while moving important business decisions to the server.')
    add_body(doc, 'The project demonstrates a practical MERN-stack workflow: React and Vite provide the interface, Express coordinates APIs and services, MongoDB stores operational data, and Mongoose makes the data model explicit. Security and validation boundaries reduce the risk of trusting the browser with sensitive decisions.')
    add_body(doc, 'The implementation is suitable for academic demonstration and continued development. Its next production steps are deliberately identified rather than hidden: real payments, protected object storage for PDFs, external notifications, stronger automated testing, monitoring, and multi-branch operations.')
    add_rule(doc, TEAL, 12)
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; r=p.add_run('Make every title discoverable. Make every copy traceable.'); set_run_font(r,FONT_DISPLAY,14,TEAL,True)

    add_page_break(doc)
    add_title(doc, 'REFERENCES', 'References and project sources')
    refs = [
        'BookHub project README and project check scripts, C:\\Users\\Admin\\Desktop\\Book Store.',
        'BookHub architecture document, docs/architecture.md.',
        'BookHub database design document, docs/database-design.md.',
        'React documentation — https://react.dev/',
        'Vite documentation — https://vite.dev/',
        'Express documentation — https://expressjs.com/',
        'MongoDB documentation — https://www.mongodb.com/docs/',
        'Mongoose documentation — https://mongoosejs.com/docs/',
        'Tailwind CSS documentation — https://tailwindcss.com/docs/',
        'JSON Web Token introduction — https://jwt.io/introduction',
        'The supplied reference report: Social_Pulse_Project_Report_Dhruv_Dashboard_Updated.docx.',
    ]
    add_bullets(doc, refs)
    add_body(doc, 'Project-specific claims in this report are based on the available BookHub source files and documentation. Proposed integrations are labelled as future scope and should not be presented as completed features.')

    add_page_break(doc)
    add_title(doc, 'APPENDIX B', 'Demonstration checklist', 'Use this checklist before presenting the project in class.')
    add_bullets(doc, ['Start MongoDB / confirm the configured MongoDB Atlas connection and environment variables.', 'Start the backend API, then start the Vite client.', 'Open Home, Books, and a Book Details page to demonstrate discovery and search.', 'Show purchase, physical rental, and digital rental options with demo labels.', 'Show Cart → Checkout → Payment History → Notifications.', 'Open Digital Library and explain that access is checked by the backend and expires.', 'Open Admin Dashboard to show inventory, copies, locations, orders, and operational metrics.', 'Explain that real payment, provider messaging, and private PDF storage are future integrations.', 'Run the project check script before the final demonstration if the environment is available.'])
    doc.add_paragraph('Suggested opening line', style='Heading 2')
    add_body(doc, '“Good morning. My project is BookHub, a MERN-stack bookstore and digital-library management system. It combines customer discovery and self-service with the operational controls a local bookstore needs for copies, rentals, digital access, and notifications.”')
    doc.add_paragraph('Suggested closing line', style='Heading 2')
    add_body(doc, '“BookHub is not only a catalogue page; it is a connected workflow. The current version demonstrates the core experience honestly, while the architecture leaves a clear path for secure payments, protected digital assets, notifications, and future branch expansion.”')

    # Reduce visual density: keep only the three genuinely useful technical
    # tables (technology stack, database entities, and future scope) and turn
    # the other summary tables into labelled prose.
    flatten_repetitive_tables(doc)
    for section in doc.sections:
        add_header_footer(section)
    doc.core_properties.title = 'BookHub Project Report'
    doc.core_properties.subject = 'Professional Training Project Report'
    doc.core_properties.author = 'Devender'
    doc.core_properties.keywords = 'BookHub, bookstore, MERN, project report, DCRUST'
    doc.save(OUT)
    print(OUT)


if __name__ == '__main__':
    build()

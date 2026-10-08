import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# -------------------------------------------------------------
# 1. WORD DOCUMENT (.DOCX) GENERATOR
# -------------------------------------------------------------
def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=160, right=160):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def generate_word_doc(output_path):
    doc = docx.Document()
    
    # Page setup
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.9)
        section.right_margin = Inches(0.9)
    
    # Color palette
    PRIMARY = RGBColor(16, 185, 129)     # Emerald #10b981
    DARK = RGBColor(15, 23, 42)          # Slate-900 #0f172a
    SECONDARY = RGBColor(14, 116, 144)   # Cyan-700
    MUTED = RGBColor(100, 116, 139)      # Slate-500
    
    # Header Banner
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(2)
    run_title = p_title.add_run("InterestAccurate™")
    run_title.font.name = "Arial"
    run_title.font.size = Pt(26)
    run_title.font.bold = True
    run_title.font.color.rgb = PRIMARY
    
    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_after = Pt(14)
    run_sub = p_sub.add_run("Commercial Pricing, Packaging & Go-To-Market Sales Strategy")
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(13)
    run_sub.font.bold = True
    run_sub.font.color.rgb = DARK
    
    p_meta = doc.add_paragraph()
    p_meta.paragraph_format.space_after = Pt(18)
    run_meta = p_meta.add_run("Product: Multi-Tenant Loan & Daily Interest SaaS Platform | Target Market: India Micro-Finance")
    run_meta.font.name = "Arial"
    run_meta.font.size = Pt(9.5)
    run_meta.font.italic = True
    run_meta.font.color.rgb = MUTED

    def add_h1(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(16)
        h.paragraph_format.space_after = Pt(6)
        r = h.add_run(text)
        r.font.name = "Arial"
        r.font.size = Pt(15)
        r.font.bold = True
        r.font.color.rgb = DARK
        return h

    def add_h2(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(12)
        h.paragraph_format.space_after = Pt(4)
        r = h.add_run(text)
        r.font.name = "Arial"
        r.font.size = Pt(12)
        r.font.bold = True
        r.font.color.rgb = SECONDARY
        return h

    def add_bullet(bold_prefix, text):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(3)
        r1 = p.add_run(bold_prefix + ": ")
        r1.font.name = "Arial"
        r1.font.size = Pt(10)
        r1.font.bold = True
        r1.font.color.rgb = DARK
        r2 = p.add_run(text)
        r2.font.name = "Arial"
        r2.font.size = Pt(10)
        r2.font.color.rgb = DARK
        return p

    # Section 1
    add_h1("1. Executive Summary & Market Value Proposition")
    p1 = doc.add_paragraph()
    p1.paragraph_format.space_after = Pt(8)
    r = p1.add_run(
        "Private moneylenders, pawn brokers, and daily collection finance agents handle crores in informal cash volume daily. "
        "Yet 90% still rely on paper diaries or error-prone Excel spreadsheets. InterestAccurate solves their three greatest pain points: "
        "(1) manual calculation mistakes in daily/monthly interest, (2) missed follow-ups causing bad debt, and (3) lack of instant borrower payment receipts."
    )
    r.font.name = "Arial"
    r.font.size = Pt(10)

    # Section 2: Model A
    add_h1("2. Model A: Recurring SaaS Subscriptions (Recommended)")
    p_saas_intro = doc.add_paragraph()
    p_saas_intro.paragraph_format.space_after = Pt(8)
    r = p_saas_intro.add_run(
        "Monthly and annual recurring billing provides compounding, predictable monthly recurring revenue (MRR). "
        "Your built-in Developer Super-Admin portal remotely enforces validity dates and automatically manages renewals."
    )
    r.font.name = "Arial"
    r.font.size = Pt(10)

    # Table 1: SaaS Tiers
    table_saas = doc.add_table(rows=4, cols=5)
    table_saas.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_saas.autofit = False

    headers = ["Plan Tier", "Target Client", "Monthly Price", "Annual Upfront", "Included Features"]
    for i, h in enumerate(headers):
        cell = table_saas.cell(0, i)
        cell.text = h
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, 140, 140, 140, 140)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for run in p.runs:
            run.font.name = "Arial"
            run.font.size = Pt(9.5)
            run.font.bold = True
            run.font.color.rgb = RGBColor(255, 255, 255)

    data_saas = [
        ("Starter", "Solo lenders (<50 borrowers)", "₹999 / mo", "₹9,999 / yr\n(Save ₹2,000)", "1 Staff login, Daily/Monthly loans, PDF receipts, Ledger"),
        ("Standard\n(Sweet Spot)", "Growing firms (50–300 borrowers)", "₹1,999 / mo", "₹19,999 / yr\n(Save ₹4,000)", "Multi-user staff, WhatsApp alerts, Overdue tracking, SMS log"),
        ("Pro / Agency", "Large books (>300 borrowers)", "₹3,999 / mo", "₹39,999 / yr\n(Save ₹8,000)", "Unlimited loans, Agent collection tracking, Custom branding, VIP support")
    ]

    for row_idx, row_data in enumerate(data_saas, start=1):
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(row_data):
            cell = table_saas.cell(row_idx, col_idx)
            cell.text = text
            set_cell_background(cell, bg)
            set_cell_margins(cell, 120, 120, 120, 120)
            p = cell.paragraphs[0]
            for run in p.runs:
                run.font.name = "Arial"
                run.font.size = Pt(9)
                if col_idx == 0 or col_idx == 2:
                    run.font.bold = True

    # Section 3: Model B
    add_h1("3. Model B: One-Time License + Annual AMC (For Traditional Lenders)")
    p_onprem = doc.add_paragraph()
    p_onprem.paragraph_format.space_after = Pt(6)
    r = p_onprem.add_run(
        "Many traditional financiers in Tier 2/3 cities prefer 'owning' their system outright rather than committing to monthly debits. "
        "Use this hybrid model to close conservative clients:"
    )
    r.font.name = "Arial"
    r.font.size = Pt(10)

    add_bullet("One-Time Software Setup & Onboarding", "₹18,000 – ₹35,000 (Includes system setup, borrower diary migration, and 1 year included software license).")
    add_bullet("Annual Maintenance Contract (AMC)", "₹6,000 – ₹10,000 / year (Billed starting Year 2 for updates, backups, and license key renewals).")
    add_bullet("Super-Admin Enforcement", "Set license duration to 365 days in Super-Admin view. When AMC is due, the system prompts for renewal.")

    # Section 4: High-Margin Add-Ons
    add_h1("4. High-Margin Revenue Add-Ons & Upsells")
    add_bullet("WhatsApp & SMS Credit Bundles", "Integrate fast2sms / WhatsApp Cloud API. Cost to you: ₹0.15–₹0.20 per message. Resell at ₹0.40–₹0.50 (100%+ profit margin).")
    add_bullet("Historical Data Entry & Ledger Onboarding", "Charge ₹2,500 – ₹5,000 one-time to manually type their paper notebook records into the software. This guarantees zero churn.")
    add_bullet("Custom Letterhead & Receipt Branding", "Charge ₹3,000 – ₹5,000 to customize the PDF receipt format with their proprietary firm logo, stamp watermark, and terms & conditions.")

    # Section 5: Profitability Projections
    add_h1("5. Hosting Cost vs. Profitability Projections")
    p_prof = doc.add_paragraph()
    p_prof.paragraph_format.space_after = Pt(6)
    r = p_prof.add_run(
        "Because InterestAccurate uses a lean Node.js + SQLite architecture, server hosting overhead is nearly zero. "
        "A single ₹500/month VPS easily hosts 100+ active lenders."
    )
    r.font.name = "Arial"
    r.font.size = Pt(10)

    table_prof = doc.add_table(rows=5, cols=5)
    table_prof.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_prof.autofit = False

    prof_headers = ["Active Lenders", "Avg Monthly Fee", "Gross Revenue (MRR)", "Server Cost (VPS)", "Net Profit Margin"]
    for i, h in enumerate(prof_headers):
        cell = table_prof.cell(0, i)
        cell.text = h
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, 120, 120, 120, 120)
        p = cell.paragraphs[0]
        for run in p.runs:
            run.font.name = "Arial"
            run.font.size = Pt(9)
            run.font.bold = True
            run.font.color.rgb = RGBColor(255, 255, 255)

    prof_data = [
        ("5 Lenders", "₹1,999 / mo", "₹9,995 / month", "₹450 / month", "95.5% (₹9,545 / mo)"),
        ("15 Lenders", "₹1,999 / mo", "₹29,985 / month", "₹450 / month", "98.5% (₹29,535 / mo)"),
        ("35 Lenders", "₹1,999 / mo", "₹69,965 / month", "₹750 / month", "98.9% (₹69,215 / mo)"),
        ("100 Lenders", "₹1,999 / mo", "₹1,99,900 / month", "₹1,200 / month", "99.4% (₹1,98,700 / mo)")
    ]

    for row_idx, row_data in enumerate(prof_data, start=1):
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(row_data):
            cell = table_prof.cell(row_idx, col_idx)
            cell.text = text
            set_cell_background(cell, bg)
            set_cell_margins(cell, 110, 110, 110, 110)
            p = cell.paragraphs[0]
            for run in p.runs:
                run.font.name = "Arial"
                run.font.size = Pt(9)
                if col_idx in [0, 2, 4]:
                    run.font.bold = True

    # Section 6: Sales Script
    add_h1("6. Actionable Sales Pitch & Objection Handling Playbook")
    add_bullet("The 'One Default' ROI Closer", "'Sir, if even a single ₹15,000 borrower defaults or delays payment by 3 months because you forgot to track their due date, you have lost more money than this software costs for an entire year. InterestAccurate pays for itself in week one.'")
    add_bullet("Overcoming 'I already use paper notebooks'", "'Paper diaries can be lost, damaged, or manipulated by staff. With this system, every payment produces a clean printed or WhatsApp receipt instantly, and your exact interest accrued is updated automatically every single day.'")
    add_bullet("The 14-Day Risk-Free Trial Close", "'You don't need to pay today. Let me set up your firm name and 5 sample borrowers right now. Use it for 14 days for free. If it doesn't save you at least 1 hour every day, you don't pay a single rupee.'")

    doc.save(output_path)
    print(f"Word document saved to {output_path}")

# -------------------------------------------------------------
# 2. PDF DOCUMENT GENERATOR
# -------------------------------------------------------------
def generate_pdf_doc(output_path):
    # Register Windows fonts
    font_regular = "Helvetica"
    font_bold = "Helvetica-Bold"
    if os.path.exists("C:/Windows/Fonts/arial.ttf") and os.path.exists("C:/Windows/Fonts/arialbd.ttf"):
        pdfmetrics.registerFont(TTFont("ArialCustom", "C:/Windows/Fonts/arial.ttf"))
        pdfmetrics.registerFont(TTFont("ArialCustom-Bold", "C:/Windows/Fonts/arialbd.ttf"))
        font_regular = "ArialCustom"
        font_bold = "ArialCustom-Bold"

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=45,
        leftMargin=45,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        fontName=font_bold,
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#10b981')
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        fontName=font_bold,
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=4
    )
    meta_style = ParagraphStyle(
        'DocMeta',
        fontName=font_regular,
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#64748b'),
        spaceAfter=12
    )
    h1_style = ParagraphStyle(
        'DocH1',
        fontName=font_bold,
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        'DocBody',
        fontName=font_regular,
        fontSize=9,
        leading=13.5,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=6
    )
    bullet_style = ParagraphStyle(
        'DocBullet',
        fontName=font_regular,
        fontSize=8.5,
        leading=13,
        textColor=colors.HexColor('#1e293b'),
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )
    table_cell_style = ParagraphStyle(
        'TableCell',
        fontName=font_regular,
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#1e293b')
    )
    table_header_style = ParagraphStyle(
        'TableHeader',
        fontName=font_bold,
        fontSize=8,
        leading=11,
        textColor=colors.white
    )

    elements = []

    # Title Banner
    elements.append(Paragraph("InterestAccurate™", title_style))
    elements.append(Paragraph("Commercial Pricing, Packaging & Go-To-Market Sales Strategy", subtitle_style))
    elements.append(Paragraph("Product: Multi-Tenant Loan & Daily Interest SaaS Platform | Target Market: India Micro-Finance", meta_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#10b981'), spaceAfter=10))

    # Section 1
    elements.append(Paragraph("1. Executive Summary & Market Opportunity", h1_style))
    elements.append(Paragraph(
        "Private moneylenders, pawn brokers, and daily collection finance agents handle crores in informal cash volume daily. "
        "Yet 90% still rely on paper diaries or error-prone Excel spreadsheets. InterestAccurate solves their three greatest pain points: "
        "<b>(1) calculation errors</b> in daily/monthly interest, <b>(2) missed payment follow-ups</b> resulting in bad debt, and <b>(3) lack of instant borrower receipts</b>.",
        body_style
    ))

    # Section 2: SaaS Table
    elements.append(Paragraph("2. Model A: Recurring SaaS Subscriptions (Recommended)", h1_style))
    elements.append(Paragraph(
        "Recurring subscription models provide predictable, compounding Monthly Recurring Revenue (MRR). "
        "Your built-in Developer Super-Admin portal remotely enforces validity dates and automatically manages customer access.",
        body_style
    ))

    table_data = [
        [
            Paragraph("Plan Tier", table_header_style),
            Paragraph("Target Client", table_header_style),
            Paragraph("Monthly Fee", table_header_style),
            Paragraph("Annual Upfront", table_header_style),
            Paragraph("Key Features Included", table_header_style)
        ],
        [
            Paragraph("<b>Starter</b>", table_cell_style),
            Paragraph("Solo lenders (<50 borrowers)", table_cell_style),
            Paragraph("<b>Rs. 999 / mo</b>", table_cell_style),
            Paragraph("Rs. 9,999 / yr<br/><i>(Save Rs. 2,000)</i>", table_cell_style),
            Paragraph("1 Staff login, Daily/Monthly loans, PDF receipts, Ledger tracking", table_cell_style)
        ],
        [
            Paragraph("<b>Standard</b><br/><i>(Sweet Spot)</i>", table_cell_style),
            Paragraph("Growing firms (50–300 borrowers)", table_cell_style),
            Paragraph("<b>Rs. 1,999 / mo</b>", table_cell_style),
            Paragraph("Rs. 19,999 / yr<br/><i>(Save Rs. 4,000)</i>", table_cell_style),
            Paragraph("Multi-user staff, WhatsApp alerts, Overdue tracking, SMS log", table_cell_style)
        ],
        [
            Paragraph("<b>Pro / Agency</b>", table_cell_style),
            Paragraph("Large books (>300 borrowers)", table_cell_style),
            Paragraph("<b>Rs. 3,999 / mo</b>", table_cell_style),
            Paragraph("Rs. 39,999 / yr<br/><i>(Save Rs. 8,000)</i>", table_cell_style),
            Paragraph("Unlimited loans, Agent collection tracking, Custom branding, VIP support", table_cell_style)
        ]
    ]

    t = Table(table_data, colWidths=[65, 105, 80, 85, 185])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#f8fafc'), colors.white]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 8))

    # Section 3: Model B
    elements.append(Paragraph("3. Model B: One-Time License + Annual AMC (For Traditional Lenders)", h1_style))
    elements.append(Paragraph(
        "Many traditional financiers in Tier 2/3 cities prefer 'owning' their system outright rather than committing to recurring debits. "
        "Use this hybrid model to close conservative clients:",
        body_style
    ))
    elements.append(Paragraph("• <b>One-Time Setup & Lifetime License:</b> Rs. 18,000 – Rs. 35,000 (Includes software installation, manual diary migration, and 1 full year of support).", bullet_style))
    elements.append(Paragraph("• <b>Annual Maintenance Contract (AMC):</b> Rs. 6,000 – Rs. 10,000 / year (Billed starting Year 2 for cloud backups, feature updates, and license renewal).", bullet_style))
    elements.append(Paragraph("• <b>Super-Admin Lockout Control:</b> Set license to 365 days. The Super-Admin view automatically alerts you and flags expired licenses.", bullet_style))

    # Section 4: Add-Ons
    elements.append(Paragraph("4. High-Margin Revenue Add-Ons & Upsells", h1_style))
    elements.append(Paragraph("• <b>WhatsApp & SMS Gateway Credits:</b> Buy SMS at Rs. 0.15–0.20 via fast2sms/WhatsApp API. Sell bundles at Rs. 0.40–0.50 (100%+ pure profit margin).", bullet_style))
    elements.append(Paragraph("• <b>Historical Data Migration:</b> Charge Rs. 2,500 – Rs. 5,000 one-time to manually type their old paper notebooks into the software. This locks the client in for life.", bullet_style))
    elements.append(Paragraph("• <b>Custom Letterhead & Print Layouts:</b> Charge Rs. 3,000 – Rs. 5,000 to customize PDF receipts with their proprietary firm logo, stamp watermark, and terms.", bullet_style))

    # Section 5: Profitability
    elements.append(Paragraph("5. Hosting Cost vs. Profitability Projections", h1_style))
    elements.append(Paragraph(
        "Because InterestAccurate uses a lean Node.js + SQLite architecture, server hosting overhead is nearly zero. "
        "A single Rs. 450/month VPS easily hosts 100+ active lenders with 95%+ net profit margins.",
        body_style
    ))

    prof_table_data = [
        [
            Paragraph("Active Clients", table_header_style),
            Paragraph("Avg Fee", table_header_style),
            Paragraph("Gross MRR", table_header_style),
            Paragraph("Server Cost", table_header_style),
            Paragraph("Net Profit Margin", table_header_style)
        ],
        [
            Paragraph("<b>5 Lenders</b>", table_cell_style),
            Paragraph("Rs. 1,999 / mo", table_cell_style),
            Paragraph("<b>Rs. 9,995 / mo</b>", table_cell_style),
            Paragraph("Rs. 450 / mo", table_cell_style),
            Paragraph("<b>95.5% (Rs. 9,545 / mo)</b>", table_cell_style)
        ],
        [
            Paragraph("<b>15 Lenders</b>", table_cell_style),
            Paragraph("Rs. 1,999 / mo", table_cell_style),
            Paragraph("<b>Rs. 29,985 / mo</b>", table_cell_style),
            Paragraph("Rs. 450 / mo", table_cell_style),
            Paragraph("<b>98.5% (Rs. 29,535 / mo)</b>", table_cell_style)
        ],
        [
            Paragraph("<b>35 Lenders</b>", table_cell_style),
            Paragraph("Rs. 1,999 / mo", table_cell_style),
            Paragraph("<b>Rs. 69,965 / mo</b>", table_cell_style),
            Paragraph("Rs. 750 / mo", table_cell_style),
            Paragraph("<b>98.9% (Rs. 69,215 / mo)</b>", table_cell_style)
        ],
        [
            Paragraph("<b>100 Lenders</b>", table_cell_style),
            Paragraph("Rs. 1,999 / mo", table_cell_style),
            Paragraph("<b>Rs. 1,99,900 / mo</b>", table_cell_style),
            Paragraph("Rs. 1,200 / mo", table_cell_style),
            Paragraph("<b>99.4% (Rs. 1,98,700 / mo)</b>", table_cell_style)
        ]
    ]

    t_prof = Table(prof_table_data, colWidths=[90, 95, 110, 85, 140])
    t_prof.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#f8fafc'), colors.white]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
    ]))
    elements.append(t_prof)
    elements.append(Spacer(1, 8))

    # Section 6: Sales Script
    elements.append(Paragraph("6. Sales Pitch & Objection Handling Playbook", h1_style))
    elements.append(Paragraph("• <b>The 'One Default' ROI Closer:</b> <i>'Sir, if even a single Rs. 15,000 borrower defaults or misses 3 months of interest because you forgot to track their due date, you have lost more money than this software costs for an entire year. InterestAccurate pays for itself in week one.'</i>", bullet_style))
    elements.append(Paragraph("• <b>Overcoming 'I already use paper notebooks':</b> <i>'Paper diaries can be lost, damaged, or manipulated by staff. With this system, every payment produces a clean printed or WhatsApp receipt instantly, and your exact interest accrued is updated automatically every single day.'</i>", bullet_style))
    elements.append(Paragraph("• <b>The 14-Day Risk-Free Trial Close:</b> <i>'You don't need to pay today. Let me set up your firm name and 5 sample borrowers right now. Use it for 14 days for free. If it doesn't save you at least 1 hour every day, you don't pay a single rupee.'</i>", bullet_style))

    doc.build(elements)
    print(f"PDF document saved to {output_path}")

if __name__ == "__main__":
    base_dir = "d:/InterestAccurate"
    docx_file = os.path.join(base_dir, "InterestAccurate_Pricing_Strategy.docx")
    pdf_file = os.path.join(base_dir, "InterestAccurate_Pricing_Strategy.pdf")
    
    generate_word_doc(docx_file)
    generate_pdf_doc(pdf_file)

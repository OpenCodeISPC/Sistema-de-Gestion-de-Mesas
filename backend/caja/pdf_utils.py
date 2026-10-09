# caja/pdf_utils.py
from decimal import Decimal
from datetime import datetime
from io import BytesIO
from typing import Any, Dict, List

from django.utils.text import slugify
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
)


def _to_float(valor):
    if isinstance(valor, Decimal):
        return float(valor)
    try:
        return float(valor)
    except (TypeError, ValueError):
        return 0.0


def _format_currency(valor) -> str:
    return f"".replace(",", "X").replace(".", ",").replace("X", ".")


def generar_pdf_cierre(
    cierre: Dict[str, Any],
    pagos_dia: List[Dict[str, Any]],
    resumen_totales: Dict[str, Any],
) -> BytesIO:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
        title=f"Resumen de cierre de caja - {cierre.get('fecha_cierre')}",
        author="Sistema de Gestión de Mesas y Bares",
    )

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="Titulo",
            parent=styles["Heading1"],
            fontSize=20,
            textColor=colors.HexColor("#1a1a1a"),
            spaceAfter=12,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Subtitulo",
            parent=styles["Heading2"],
            fontSize=14,
            textColor=colors.HexColor("#2f6fed"),
            spaceAfter=10,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Dato",
            parent=styles["BodyText"],
            fontSize=10,
            spaceAfter=4,
        )
    )

    elementos: List[Any] = []

    elementos.append(Paragraph("Sistema de Gestión de Mesas y Bares", styles["Titulo"]))
    elementos.append(
        Paragraph("RESUMEN DE CIERRE DE CAJA", styles["Subtitulo"])
    )
    elementos.append(Spacer(1, 0.3 * cm))

    fecha_cierre = cierre.get("fecha_cierre") or cierre.get("fecha_hora") or ""
    fecha_hora_registro = cierre.get("fecha_hora") or ""

    datos_cierre = [
        ["Fecha de cierre:", fecha_cierre],
        ["Registrado el:", fecha_hora_registro],
        ["Cajero:", cierre.get("nombre_cajero") or "Sin asignar"],
        ["Observaciones:", cierre.get("observaciones") or "Sin observaciones"],
    ]
    tabla_datos = Table(datos_cierre, colWidths=[4.5 * cm, 11 * cm])
    tabla_datos.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f7f9fc")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d8dbe2")),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    elementos.append(tabla_datos)
    elementos.append(Spacer(1, 0.7 * cm))

    elementos.append(Paragraph("Totales por método de pago", styles["Subtitulo"]))

    totales_rows = [
        ["Método de pago", "Monto"],
        ["Efectivo", _format_currency(resumen_totales.get("monto_efectivo", cierre.get("monto_efectivo", 0)))],
        ["Tarjeta", _format_currency(resumen_totales.get("monto_tarjeta", cierre.get("monto_tarjeta", 0)))],
        ["Transferencia", _format_currency(resumen_totales.get("monto_transferencia", cierre.get("monto_transferencia", 0)))],
        ["Otro", _format_currency(resumen_totales.get("monto_otro", cierre.get("monto_otro", 0)))],
        ["TOTAL COBRADO", _format_currency(resumen_totales.get("total_cobrado", cierre.get("total_cobrado", 0)))],
    ]
    tabla_totales = Table(totales_rows, colWidths=[6 * cm, 9.5 * cm])
    tabla_totales.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2f6fed")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d8dbe2")),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#f0f4ff")),
            ]
        )
    )
    elementos.append(tabla_totales)
    elementos.append(Spacer(1, 0.7 * cm))

    elementos.append(Paragraph("Arqueo", styles["Subtitulo"]))
    arqueo_rows = [
        ["Concepto", "Monto"],
        ["Total rendido (efectivo en caja)", _format_currency(cierre.get("total_rendido", 0))],
        ["Diferencia (rendido - efectivo esperado)", _format_currency(cierre.get("diferencia", 0))],
    ]
    tabla_arqueo = Table(arqueo_rows, colWidths=[6 * cm, 9.5 * cm])
    tabla_arqueo.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d8dbe2")),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    elementos.append(tabla_arqueo)
    elementos.append(Spacer(1, 0.7 * cm))

    elementos.append(Paragraph("Detalle de mesas cobradas en el día", styles["Subtitulo"]))

    if not pagos_dia:
        elementos.append(
            Paragraph("No se registraron cobros para esta fecha.", styles["Dato"])
        )
    else:
        cabecera = [
            "N° Pago",
            "Mesa",
            "Pedido",
            "Método",
            "Total pedido",
            "Propina",
            "Importe recibido",
            "Monto cobrado",
            "Cajero",
            "Fecha/hora",
        ]
        filas: List[List[str]] = [cabecera]
        for pago in pagos_dia:
            pedido_info = pago.get("pedido") or {}
            mesa_info = pedido_info.get("mesa") or {}
            filas.append(
                [
                    str(pago.get("id_pago") or ""),
                    str(mesa_info.get("numero") or mesa_info.get("id_mesa") or ""),
                    str(pedido_info.get("id_pedido") or ""),
                    str(pago.get("metodo_pago") or ""),
                    _format_currency(pedido_info.get("total") or 0),
                    _format_currency(pago.get("propina") or 0),
                    _format_currency(pago.get("importe_recibido") or 0),
                    _format_currency(pago.get("monto") or 0),
                    str(pago.get("nombre_cajero") or "Sin asignar"),
                    str(pago.get("fecha_hora") or ""),
                ]
            )
        tabla_pagos = Table(filas, repeatRows=1, colWidths=[1.3 * cm, 1.3 * cm, 1.5 * cm, 2.1 * cm, 2.0 * cm, 1.8 * cm, 2.3 * cm, 2.0 * cm, 2.8 * cm, 3.5 * cm])
        tabla_pagos.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 7),
                    ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#c9ced6")),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        elementos.append(tabla_pagos)

    elementos.append(Spacer(1, 1.2 * cm))
    elementos.append(
        Paragraph(
            f"Generado el {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}",
            styles["Dato"],
        )
    )

    doc.build(elementos)
    buffer.seek(0)
    return buffer

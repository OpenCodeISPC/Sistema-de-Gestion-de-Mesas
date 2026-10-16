# caja/pdf_utils.py
from decimal import Decimal
from datetime import datetime, date
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

# Paleta institucional (misma que styles.css del frontend)
BROWN = colors.HexColor("#8b6f47")
BROWN_DARK = colors.HexColor("#765a38")
BROWN_LIGHT = colors.HexColor("#a98e72")
CREAM = colors.HexColor("#f7f1eb")
CREAM_DARK = colors.HexColor("#f1e3d0")
BORDER = colors.HexColor("#b79570")
BORDER_LIGHT = colors.HexColor("#dfd2c4")
TEXT = colors.HexColor("#161616")


def _a_fecha_hora(valor):
    if isinstance(valor, datetime):
        return valor
    if isinstance(valor, date):
        return datetime(valor.year, valor.month, valor.day)
    texto = str(valor or "").replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(texto)
    except ValueError:
        return None


def _format_fecha(valor) -> str:
    fecha = _a_fecha_hora(valor)
    return fecha.strftime("%d/%m/%Y") if fecha else str(valor or "")


def _format_hora(valor) -> str:
    fecha = _a_fecha_hora(valor)
    return fecha.strftime("%H:%M") if fecha else ""


def _format_fecha_hora(valor) -> str:
    fecha = _a_fecha_hora(valor)
    return fecha.strftime("%d/%m/%Y %H:%M") if fecha else str(valor or "")


def _to_float(valor):
    if isinstance(valor, Decimal):
        return float(valor)
    try:
        return float(valor)
    except (TypeError, ValueError):
        return 0.0


def _format_currency(valor) -> str:
    monto = _to_float(valor)
    return "$ " + f"{monto:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


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
        title=f"Resumen de cierre de caja - {_format_fecha(cierre.get('fecha_cierre'))}",
        author="Sistema de Gestión de Mesas para Bares",
    )

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="Titulo",
            parent=styles["Heading1"],
            fontSize=20,
            textColor=BROWN_DARK,
            spaceAfter=12,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Subtitulo",
            parent=styles["Heading2"],
            fontSize=14,
            textColor=BROWN,
            spaceAfter=10,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Dato",
            parent=styles["BodyText"],
            fontSize=10,
            textColor=TEXT,
            spaceAfter=4,
        )
    )

    elementos: List[Any] = []

    elementos.append(Paragraph("Sistema de Gestión de Mesas para Bares", styles["Titulo"]))
    elementos.append(
        Paragraph("RESUMEN DE CIERRE DE CAJA", styles["Subtitulo"])
    )
    elementos.append(Spacer(1, 0.3 * cm))

    fecha_cierre = _format_fecha(cierre.get("fecha_cierre") or cierre.get("fecha_hora"))
    fecha_hora_registro = _format_fecha_hora(cierre.get("fecha_hora"))

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
                ("BACKGROUND", (0, 0), (0, -1), CREAM),
                ("TEXTCOLOR", (0, 0), (-1, -1), TEXT),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
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
                ("BACKGROUND", (0, 0), (-1, 0), BROWN),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BACKGROUND", (0, -1), (-1, -1), CREAM_DARK),
                ("TEXTCOLOR", (0, -1), (-1, -1), BROWN_DARK),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
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
                ("BACKGROUND", (0, 0), (-1, 0), BROWN_DARK),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
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
            filas.append(
                [
                    str(pago.get("id_pago") or ""),
                    str(pago.get("numero_mesa") or ""),
                    str(pago.get("pedido") or ""),
                    str(pago.get("metodo_pago") or ""),
                    _format_currency(pago.get("total_pedido") or 0),
                    _format_currency(pago.get("propina") or 0),
                    _format_currency(pago.get("importe_recibido") or 0),
                    _format_currency(pago.get("monto") or 0),
                    str(pago.get("nombre_cajero") or "Sin asignar"),
                    _format_fecha_hora(pago.get("fecha_hora")),
                ]
            )
        tabla_pagos = Table(
            filas,
            repeatRows=1,
            # Anchos pensados para que el contenido de 7pt entre sin solaparse y
            # la suma sea <= 18 cm (ancho util de A4 con margenes de 1.5 cm):
            # "Metodo" se ensancha (TRANSFERENCIA ~2.1 cm) y "Fecha/hora" se
            # reduce, evitando que el metodo pise la columna "Total pedido".
            colWidths=[
                1.2 * cm,
                0.85 * cm,
                1.05 * cm,
                2.7 * cm,
                1.7 * cm,
                1.7 * cm,
                2.15 * cm,
                2.0 * cm,
                2.2 * cm,
                2.2 * cm,
            ],
        )
        tabla_pagos.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), BROWN_DARK),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 7),
                    ("GRID", (0, 0), (-1, -1), 0.4, BORDER_LIGHT),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, CREAM]),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("LEFTPADDING", (0, 0), (-1, -1), 3),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 3),
                ]
            )
        )
        elementos.append(tabla_pagos)

    elementos.append(Spacer(1, 1.2 * cm))
    elementos.append(
        Paragraph(
            f"Generado el {datetime.now().strftime('%d/%m/%Y %H:%M')}",
            styles["Dato"],
        )
    )

    doc.build(elementos)
    buffer.seek(0)
    return buffer


def generar_factura_pedido(
    numero_mesa,
    mozo: str,
    fecha_hora,
    detalles: List[Dict[str, Any]],
    subtotal,
    propina,
    total,
) -> BytesIO:
    """Genera el PDF de la factura/detalle de consumo de una mesa.

    `detalles` es una lista de dicts con las claves:
    cantidad, nombre, precio_unitario y subtotal.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
        title=f"Factura - Mesa {numero_mesa}",
        author="Sistema de Gestión de Mesas para Bares",
    )

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="TituloFactura",
            parent=styles["Heading1"],
            fontSize=20,
            textColor=BROWN_DARK,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SubtituloFactura",
            parent=styles["Heading2"],
            fontSize=16,
            textColor=BROWN,
            spaceAfter=12,
            alignment=1,
        )
    )
    styles.add(
        ParagraphStyle(
            name="DatoFactura",
            parent=styles["BodyText"],
            fontSize=10,
            textColor=TEXT,
            spaceAfter=4,
        )
    )

    elementos: List[Any] = []

    elementos.append(Paragraph("Sistema de Gestión de Mesas para Bares", styles["TituloFactura"]))
    elementos.append(Paragraph("FACTURA", styles["SubtituloFactura"]))
    elementos.append(Spacer(1, 0.3 * cm))

    datos = [
        ["Mesa N°:", str(numero_mesa or "-")],
        ["Mozo:", mozo or "Sin asignar"],
        ["Fecha:", _format_fecha_hora(fecha_hora)],
    ]
    tabla_datos = Table(datos, colWidths=[4 * cm, 11.5 * cm])
    tabla_datos.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), CREAM),
                ("TEXTCOLOR", (0, 0), (-1, -1), TEXT),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    elementos.append(tabla_datos)
    elementos.append(Spacer(1, 0.6 * cm))

    cabecera = ["Cant.", "Producto", "P. unitario", "Subtotal"]
    filas: List[List[str]] = [cabecera]
    if detalles:
        for detalle in detalles:
            filas.append(
                [
                    str(detalle.get("cantidad") or ""),
                    str(detalle.get("nombre") or ""),
                    _format_currency(detalle.get("precio_unitario") or 0),
                    _format_currency(detalle.get("subtotal") or 0),
                ]
            )
    else:
        filas.append(["", "Sin productos cargados", "", ""])

    tabla_detalle = Table(filas, repeatRows=1, colWidths=[1.5 * cm, 8.5 * cm, 2.75 * cm, 2.75 * cm])
    tabla_detalle.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BROWN_DARK),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.4, BORDER_LIGHT),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, CREAM]),
                ("ALIGN", (0, 0), (0, -1), "CENTER"),
                ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    elementos.append(tabla_detalle)
    elementos.append(Spacer(1, 0.5 * cm))

    totales_rows = [["Subtotal", "", "", _format_currency(subtotal)]]
    if _to_float(propina) > 0:
        totales_rows.append(["Propina (10%)", "", "", _format_currency(propina)])
    totales_rows.append(["TOTAL A COBRAR", "", "", _format_currency(total)])

    # Se replica la geometria de `tabla_detalle` (mismos colWidths y hAlign) y se
    # fusionan las celdas del concepto, de modo que el bloque de totales coincida
    # en ancho y posicion con la tabla de detalle (los montos quedan alineados
    # bajo la columna "Subtotal").
    estilos_totales = [
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, BORDER_LIGHT),
        ("BACKGROUND", (0, -1), (-1, -1), CREAM_DARK),
        ("TEXTCOLOR", (0, -1), (-1, -1), BROWN_DARK),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
    ]
    for fila in range(len(totales_rows)):
        estilos_totales.append(("SPAN", (0, fila), (2, fila)))

    tabla_totales = Table(
        totales_rows,
        colWidths=[1.5 * cm, 8.5 * cm, 2.75 * cm, 2.75 * cm],
        hAlign="CENTER",
    )
    tabla_totales.setStyle(TableStyle(estilos_totales))
    elementos.append(tabla_totales)

    elementos.append(Spacer(1, 1.2 * cm))
    elementos.append(
        Paragraph("Gracias por su visita.", styles["DatoFactura"])
    )
    elementos.append(
        Paragraph(
            f"Emitido el {datetime.now().strftime('%d/%m/%Y %H:%M')} - Comprobante no fiscal.",
            styles["DatoFactura"],
        )
    )

    doc.build(elementos)
    buffer.seek(0)
    return buffer

import logging
from datetime import datetime, timezone
from decimal import Decimal

from django.conf import settings
from pymongo import MongoClient

logger = logging.getLogger(__name__)

_cliente = None


def _obtener_cliente():
    global _cliente
    if _cliente is None:
        _cliente = MongoClient(
            settings.MONGO_URI,
            serverSelectionTimeoutMS=3000,
        )
    return _cliente


def ping_db():
    try:
        _obtener_cliente().admin.command('ping')
        return True
    except Exception:
        return False


def _a_jsonable(valor):
    """Convierte tipos de Python (Decimal, datetime) a tipos JSON compatibles."""
    if isinstance(valor, Decimal):
        return float(valor)
    if isinstance(valor, datetime):
        return valor.isoformat()
    if isinstance(valor, dict):
        return {clave: _a_jsonable(item) for clave, item in valor.items()}
    if isinstance(valor, (list, tuple, set)):
        return [_a_jsonable(item) for item in valor]
    return valor


def registrar_evento(tipo, actor=None, detalle=None, datos=None, db_name=None):
    """Registra un evento de auditoría como documento en MongoDB.

    Devuelve la fecha del evento si se persistió, o None si MongoDB no
    está disponible (la operación principal no debe fallar jamás).
    """
    try:
        db = _obtener_cliente()[db_name or settings.MONGO_DB_NAME]
        documento = {
            'tipo': tipo,
            'actor': actor,
            'detalle': detalle,
            'datos': _a_jsonable(datos or {}),
            'fecha': datetime.now(timezone.utc).isoformat(),
        }
        db.eventos_auditoria.insert_one(documento)
        return documento['fecha']
    except Exception as exc:
        logger.warning(
            'No se pudo registrar el evento de auditoría en MongoDB: %s', exc
        )
        return None


def listar_eventos(limite=100, tipo=None, db_name=None):
    """Devuelve los últimos eventos de auditoría ordenados por fecha desc."""
    try:
        db = _obtener_cliente()[db_name or settings.MONGO_DB_NAME]
        filtro = {'tipo': tipo} if tipo else {}
        documentos = (
            db.eventos_auditoria.find(filtro)
            .sort('fecha', -1)
            .limit(int(limite))
        )
        return [{**doc, '_id': str(doc['_id'])} for doc in documentos]
    except Exception as exc:
        logger.warning(
            'No se pudieron listar los eventos de auditoría en MongoDB: %s', exc
        )
        return []
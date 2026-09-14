"""
Script de datos de prueba para Caja (seed_demo).

Crea (si no existen) mesas, productos, usuarios y pedidos LISTO/ENTREGADO
para poder probar el módulo de caja desde el frontend sin datos previos.

Re-ejecutable: si la mesa ya tiene un pedido pendiente de cobro, no lo duplica.

Uso (desde la raíz del repo):
    docker exec -i sgmb_backend python manage.py shell < backend/caja/seed_demo.py
"""

from decimal import Decimal

from pedidos.models import DetallePedido, Pedido
from mesas.models import Mesa
from productos.models import Producto
from usuarios.models import Usuario

PENDIENTES_DE_COBRO = ["LISTO", "ENTREGADO"]

SEED = [
    {
        "mesa_numero": 51,
        "mesa_capacidad": 4,
        "pedido_estado": "LISTO",
        "usuario": ("mozo1@demo.com", "Juan", "Perez", "MOZO"),
        "detalles": [
            {"nombre": "Canelones de Mariscos", "precio": Decimal("40000.00"), "cantidad": 2},
            {"nombre": "Cerveza Artesanal IPA", "precio": Decimal("6000.00"), "cantidad": 3},
            {"nombre": "Coca Cola Regular", "precio": Decimal("4000.00"), "cantidad": 2},
        ],
    },
    {
        "mesa_numero": 52,
        "mesa_capacidad": 6,
        "pedido_estado": "LISTO",
        "usuario": ("mozo2@demo.com", "Maria", "Lopez", "MOZO"),
        "detalles": [
            {"nombre": "Milanesa a la Napolitana", "precio": Decimal("25000.00"), "cantidad": 2},
            {"nombre": "Agua Mineral 500ml", "precio": Decimal("3000.00"), "cantidad": 2},
        ],
    },
    {
        "mesa_numero": 53,
        "mesa_capacidad": 4,
        "pedido_estado": "ENTREGADO",
        "usuario": ("mozo3@demo.com", "Carlos", "Gomez", "MOZO"),
        "detalles": [
            {"nombre": "Pizza de Muzzarella", "precio": Decimal("35000.00"), "cantidad": 1},
            {"nombre": "Fernet con Coca", "precio": Decimal("8000.00"), "cantidad": 2},
        ],
    },
]

# Cajero que registra los cobros
Usuario.objects.get_or_create(
    email="cajero@demo.com",
    defaults={"nombre": "Mariano", "apellido": "Casarino", "rol": "CAJERO"},
)

contadores = {
    "mesas": 0,
    "productos": 0,
    "pedidos_nuevos": 0,
    "pedidos_ya_existentes": 0,
}

for datos in SEED:
    mesa, _ = Mesa.objects.get_or_create(
        numero=datos["mesa_numero"],
        defaults={
            "capacidad": datos["mesa_capacidad"],
            "estado": "OCUPADA",
            "ubicacion": "Salon principal",
        },
    )
    contadores["mesas"] += 1

    # Si la mesa ya tiene un pedido pendiente de cobro, no duplico
    ya_tiene_pendiente = Pedido.objects.filter(
        mesa=mesa,
        estado__in=PENDIENTES_DE_COBRO,
    ).exists()
    if ya_tiene_pendiente:
        contadores["pedidos_ya_existentes"] += 1
        print(f"Mesa {mesa.numero}: ya tiene pedido por cobrar, se omite.")
        continue

    email, nombre, apellido, rol = datos["usuario"]
    mozo, _ = Usuario.objects.get_or_create(
        email=email,
        defaults={"nombre": nombre, "apellido": apellido, "rol": rol},
    )

    total = Decimal("0.00")
    detalles = []
    for detalle in datos["detalles"]:
        producto, creado = Producto.objects.get_or_create(
            nombre=detalle["nombre"],
            defaults={
                "descripcion": "Producto de demo para probar caja",
                "precio": detalle["precio"],
                "stock": 50,
                "categoria": "cocina",
                "disponibilidad": True,
            },
        )
        if creado:
            contadores["productos"] += 1
        subtotal = detalle["precio"] * detalle["cantidad"]
        total += subtotal
        detalles.append((producto, detalle["cantidad"], detalle["precio"], subtotal))

    pedido = Pedido.objects.create(
        estado=datos["pedido_estado"],
        total=total,
        mesa=mesa,
        usuario=mozo,
    )
    for producto, cantidad, precio_unitario, subtotal in detalles:
        DetallePedido.objects.create(
            pedido=pedido,
            producto=producto,
            cantidad=cantidad,
            precio_unitario=precio_unitario,
            subtotal=subtotal,
        )

    mesa.estado = "OCUPADA"
    mesa.save()
    contadores["pedidos_nuevos"] += 1

pendientes = Pedido.objects.filter(estado__in=PENDIENTES_DE_COBRO).count()

print("=" * 50)
print("SEED DEMO LISTO")
print(f"  Mesas: {contadores['mesas']}")
print(f"  Productos creados: {contadores['productos']}")
print(f"  Pedidos nuevos: {contadores['pedidos_nuevos']}")
print(f"  Pedidos ya existentes: {contadores['pedidos_ya_existentes']}")
print(f"  Pedidos pendientes de cobro totales: {pendientes}")
print("=" * 50)
#!/usr/bin/env bash
# =============================================================================
# actualizar-entorno.sh
# Deja el entorno Docker local listo tras bajar los cambios del repo.
#
# Uso (desde la raíz del proyecto, donde está compose.yml):
#   bash actualizar-entorno.sh              -> pregunta antes de borrar datos
#   bash actualizar-entorno.sh --si         -> no pregunta, borra el volumen de Postgres
#   bash actualizar-entorno.sh --conservar  -> NO borra el volumen (ver nota abajo)
#
# Nota: si el volumen de Postgres se creó con otras credenciales, hay que
# borrarlo (se pierden los datos locales de prueba; migrate + seed los recrean).
# =============================================================================
set -euo pipefail

ENV_RAIZ=".env"
ENV_BACKEND="backend/.env.desarrollo"
CONTENEDOR_BACKEND="sgmb_backend"
VOLUMEN_PG="datos_postgres_sgmb"
MODO="preguntar"

for arg in "$@"; do
  case "$arg" in
    --si)         MODO="borrar" ;;
    --conservar)  MODO="conservar" ;;
    *) echo "Opción desconocida: $arg"; exit 1 ;;
  esac
done

info()  { echo -e "\n\033[1;34m==>\033[0m $1"; }
ok()    { echo -e "\033[1;32m✔\033[0m $1"; }
warn()  { echo -e "\033[1;33m!\033[0m $1"; }
fallo() { echo -e "\033[1;31m✘\033[0m $1"; exit 1; }

# --- 0. Chequeos previos -----------------------------------------------------
info "Chequeando requisitos"
[ -f "compose.yml" ] || [ -f "docker-compose.yml" ] || fallo "Corré el script desde la raíz del proyecto (donde está compose.yml)."
docker info >/dev/null 2>&1 || fallo "Docker no está corriendo. Abrí Docker Desktop y reintentá."
[ -f "$ENV_BACKEND" ] || fallo "No existe $ENV_BACKEND. Pedile ese archivo a un compañero (no se sube a GitHub)."
ok "Docker activo y archivos base encontrados"

# --- 1. .env de la raíz ------------------------------------------------------
info "Revisando $ENV_RAIZ"
touch "$ENV_RAIZ"

# El truco COMPOSE_ENV_FILES dentro del .env no funciona: se elimina.
if grep -q '^COMPOSE_ENV_FILES=' "$ENV_RAIZ"; then
  sed -i '/^COMPOSE_ENV_FILES=/d' "$ENV_RAIZ"
  warn "Se quitó la línea COMPOSE_ENV_FILES (Compose la ignora dentro del .env)"
fi

# Copia POSTGRES_* desde backend/.env.desarrollo si faltan en el .env de la raíz.
for var in POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB; do
  if ! grep -q "^${var}=" "$ENV_RAIZ"; then
    linea=$(grep -E "^${var}=" "$ENV_BACKEND" | head -n1 | tr -d '\r' || true)
    [ -n "$linea" ] || fallo "$var no está definida en $ENV_BACKEND."
    echo "$linea" >> "$ENV_RAIZ"
    ok "Agregada $var al $ENV_RAIZ"
  fi
done

# Verifica que ambos archivos coincidan (si no, Django no podrá autenticarse).
u_raiz=$(grep -E '^POSTGRES_USER=' "$ENV_RAIZ" | tail -n1 | cut -d= -f2- | tr -d '\r')
p_raiz=$(grep -E '^POSTGRES_PASSWORD=' "$ENV_RAIZ" | tail -n1 | cut -d= -f2- | tr -d '\r')
u_back=$(grep -E '^DB_USER=' "$ENV_BACKEND" | tail -n1 | cut -d= -f2- | tr -d '\r')
p_back=$(grep -E '^DB_PASSWORD=' "$ENV_BACKEND" | tail -n1 | cut -d= -f2- | tr -d '\r')
if [ "$u_raiz" != "$u_back" ] || [ "$p_raiz" != "$p_back" ]; then
  fallo "POSTGRES_USER/PASSWORD del .env no coinciden con DB_USER/DB_PASSWORD de $ENV_BACKEND. Corregilos y reintentá."
fi
ok "Credenciales de Postgres consistentes entre ambos archivos"

# --- 2. Bajar contenedores ---------------------------------------------------
info "Bajando contenedores"
docker compose down
ok "Contenedores detenidos"

# --- 3. Volumen de Postgres --------------------------------------------------
info "Volumen de Postgres"
volumenes=$(docker volume ls -q --filter "name=${VOLUMEN_PG}" || true)

if [ -z "$volumenes" ]; then
  ok "No hay volumen previo, nada que borrar"
elif [ "$MODO" = "conservar" ]; then
  warn "Se conserva el volumen. Si aparece 'password authentication failed', reintentá sin --conservar."
else
  if [ "$MODO" = "preguntar" ]; then
    echo "Se van a borrar estos volúmenes (datos locales de prueba):"
    echo "$volumenes" | sed 's/^/   - /'
    read -r -p "¿Continuar? (s/N): " resp
    [[ "$resp" =~ ^[sS]$ ]] || fallo "Cancelado. Nada fue borrado."
  fi
  echo "$volumenes" | xargs docker volume rm
  ok "Volumen de Postgres eliminado"
fi

# --- 4. Build y arranque -----------------------------------------------------
info "Construyendo imágenes y levantando servicios (puede tardar unos minutos)"
docker compose up --build -d
ok "Servicios iniciados"

# --- 5. Esperar a que el backend esté listo ----------------------------------
info "Esperando al backend (máx. 90 s)"
for i in $(seq 1 45); do
  logs=$(docker logs "$CONTENEDOR_BACKEND" 2>&1 || true)
  if echo "$logs" | grep -q "Application startup complete"; then
    ok "Backend listo"
    echo
    echo "  Frontend: http://localhost:4200"
    echo "  Backend:  http://localhost:8000"
    exit 0
  fi
  if echo "$logs" | grep -q "password authentication failed"; then
    fallo "Postgres rechazó las credenciales. Reintentá con: bash actualizar-entorno.sh --si"
  fi
  sleep 2
done

warn "El backend no confirmó el arranque a tiempo. Últimas líneas del log:"
docker logs --tail 30 "$CONTENEDOR_BACKEND" 2>&1 || true
exit 1

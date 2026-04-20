#!/bin/bash
# Cargar nvm y Node 20
export NVM_DIR="/home/devadmin/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20

# ============================================
# Deploy Frontend Angular - EPMAPA-T
# ============================================

NGINX_DIR="/var/www/erp_epmapat_fe/dist"
BACKUP_DIR="/home/devadmin/backups/frontend"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

# ============================================
# 1. BACKUP del dist actual
# ============================================
backup_dist() {
    log_info "Iniciando backup del dist actual..."

    mkdir -p "$BACKUP_DIR"

    if [ -d "$FRONTEND_DIR/dist" ]; then
        tar -czf "$BACKUP_DIR/dist_backup_$TIMESTAMP.tar.gz" -C "$FRONTEND_DIR" dist
        log_success "Backup creado: $BACKUP_DIR/dist_backup_$TIMESTAMP.tar.gz"
    else
        log_warning "No existe directorio dist, se omite el backup."
    fi
}

# ============================================
# 2. BUILD Angular
# ============================================
build_angular() {
    log_info "Ejecutando ng build..."
    cd "$FRONTEND_DIR" || { log_error "No se puede acceder a $FRONTEND_DIR"; exit 1; }

    if ng build; then
        log_success "ng build completado correctamente."
    else
        log_error "Falló ng build. Abortando deploy."
        exit 1
    fi
}

# ============================================
# 3. COPIAR dist a Nginx
# ============================================
copy_to_nginx() {
    log_info "Copiando dist a Nginx..."

    # Detectar carpeta generada por ng build (browser o nombre del proyecto)
    DIST_BUILD=$(find "$FRONTEND_DIR/dist" -mindepth 1 -maxdepth 1 -type d | head -1)

    if [ -z "$DIST_BUILD" ]; then
        log_error "No se encontró carpeta dentro de dist. Verifica el ng build."
        exit 1
    fi

    log_info "Carpeta detectada: $DIST_BUILD"

    sudo mkdir -p "$NGINX_DIR"
    sudo rm -rf "$NGINX_DIR"/*
    sudo cp -r "$DIST_BUILD"/. "$NGINX_DIR"/

    log_success "Archivos copiados a $NGINX_DIR"
}

# ============================================
# 4. RELOAD Nginx
# ============================================
reload_nginx() {
    log_info "Recargando Nginx..."
    if sudo systemctl reload nginx; then
        log_success "Nginx recargado correctamente."
    else
        log_error "Error al recargar Nginx."
        exit 1
    fi
}

# ============================================
# MAIN
# ============================================
main() {
    log_info "========== DEPLOY FRONTEND EPMAPA-T =========="
    log_info "Timestamp: $TIMESTAMP"

    backup_dist
    build_angular
    copy_to_nginx
    reload_nginx

    echo
    log_success "✅ Deploy completado exitosamente."
    log_info "Frontend disponible en: http://192.168.0.46"
}

trap 'log_error "Script interrumpido por el usuario"; exit 1' INT

main

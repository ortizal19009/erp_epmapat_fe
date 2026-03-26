# Features por dominio

Esta carpeta organiza el frontend por dominios funcionales.

## Dominios
- `admin-central`
- `comercializacion`
- `contabilidad`
- `rrhh`
- `gestion-documental`

## Estructura por dominio
- `pages/` pantallas enrutables
- `components/` componentes internos del dominio
- `services/` servicios del dominio
- `models/` modelos del dominio

## Nota
Durante la migración coexistirá código legacy en `componentes/`, `servicios/` y `modelos/`.
Se migrará de forma incremental para evitar romper rutas existentes.

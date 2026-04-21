# INSTRUCCIONES — Hábitos App

Lee este archivo completo antes de hacer cualquier modificación.

---

## Qué es este proyecto

PWA (Progressive Web App) de rutinas y hábitos personales para uso exclusivo de Esteban Duarte.
Desplegada en GitHub Pages: https://tebanduarte2006.github.io/habitos-app/
Repo anterior (solo referencia de contenido): ~/Rutina-skincare-final

---

## Principio rector

Todo se construye para ser fácil de automatizar. El workflow objetivo:
1. El agente genera el módulo en Notion
2. Esteban lo menciona en la conversación de PWA
3. El agente genera el JSON del módulo
4. Entrega instrucción de una oración a Claude Code
5. Claude Code agrega el módulo, valida, commit y push → app actualizada en ~2 min

---

## Estructura de archivos

```
index.html        ← shell vacío. Solo estructura HTML. Nunca hardcodear contenido aquí.
app.js            ← router principal. Carga módulos, maneja navegación global.
styles.css        ← CSS global + variables. Estética Apple dark. No tocar sin instrucción explícita.
db.js             ← capa IndexedDB. Todos los módulos con datos acumulativos la usan.
sw.js             ← Service Worker. Cache por timestamp. Actualizar en cada deploy.
manifest.json     ← config PWA
INSTRUCCIONES.md  ← este archivo
modules/          ← un JSON por módulo estático o un JS por módulo custom.
renderers/        ← un JS por tipo de sección o por módulo dinámico (gym.js).
```

### Módulos activos actuales

- **gym** (dinámico, `renderers/gym.js`) — Workout Tracker (ver sección Módulo Gym).
- **mental** (interactivo, `modules/mental.js`) — Flow / enfoque.

Los módulos `skincare`, `oral` y `kegel` fueron eliminados el 2026-04-21.

---

## Reglas absolutas — no violar nunca

1. No hardcodear contenido en index.html ni en app.js. El contenido va en modules/*.json o en un renderer dedicado.
2. No modificar styles.css a menos que se indique explícitamente.
3. Cada módulo tiene su propio archivo en modules/ (o renderer en renderers/ si es dinámico). Nunca mezclar contenido de módulos.
4. Cada renderer estático en renderers/ maneja exactamente un tipo de sección; los renderers dinámicos (gym.js) exponen una función `renderXxxModule(container)` registrada con `type: 'dynamic'` en `MODULES_REGISTRY`.
5. Validar JS antes de cada commit: `node -e "require('fs').readFileSync('./app.js','utf8'); console.log('OK')"` y equivalente para cada archivo tocado.
6. Actualizar el timestamp/versión en `sw.js` en cada commit para invalidar el cache del browser.
7. Commit y push al terminar cada tarea. Nunca dejar cambios sin pushear.
8. No modificar `db.js` bajo ninguna circunstancia (stores e índices fijos).

---

## Stack técnico

- HTML + CSS + JS vanilla. Sin frameworks. Sin npm. Sin bundlers.
- IndexedDB (via db.js) para datos acumulativos: gym, flow (mental).
- localStorage solo para preferencias simples (módulos pineados, orden, último día visto).
- JSON externos en modules/ para contenido de módulos estáticos.
- Service Worker con cache por timestamp.
- Deploy: GitHub Pages desde rama main, raíz del repo.

---

## Arquitectura de navegación

**Home screen**
- Header con título "Hábitos".
- Reminders contextuales del día, cada uno es shortcut al módulo correspondiente.

**Barra inferior — Quick Access**
- Máximo 4 módulos pineados. Reordenables.
- Se expande hacia arriba (slide-up) para mostrar grid completo de módulos.
- Al intentar pinear un 5º módulo: mensaje "Límite de módulos pineados alcanzado".
- Orden de módulos pineados guardado en localStorage.

**Navegación entre módulos**
- Swipe borde izquierdo → derecha para volver al home.
- Botón "Hábitos" en header como alternativa.
- Sin botón de back adicional.

---

## Módulo Gym — Workout Tracker

Diseño basado en el template "Benny Builds It — Workout Tracker" (Notion). Tres tabs:

```
[ ▶ Entrenar ]   [ 📚 Ejercicios ]   [ 📈 Progresión ]
```

### Tab 1 · Entrenar (Workout Planner)
- Sin sesión activa: últimas 3 sesiones completadas + CTA "Iniciar sesión".
- Al iniciar: selector de tipo de rutina (Push / Pull / Legs / Full Body / Custom). El nombre se genera `Workout #N · <Tipo>` (editable en el futuro).
- Sesión activa: header con nombre + fecha + cronómetro + status chip, lista de ejercicios con sets, botón "+ Agregar ejercicio", botón "Finalizar sesión".
- Cada set tiene status visible: Pending 🔲 / Done ✅ / Skipped ❌. Toque en el chip cicla los estados.
- Bajo cada ejercicio se muestra el hint "Última vez: X kg × Y reps" consultando sets previos del mismo `ejercicio_id`.
- Timer de descanso: al confirmar un set nuevo, arranca cuenta regresiva (default 90s). Se puede saltar.
- Persistencia: si al entrar existe una `sesion` con `finalizada=false`, se muestra modal con 3 opciones (Reanudar, Guardar como está, Eliminar).

### Tab 2 · Ejercicios (Exercise Library)
- Buscador por nombre + pills de filtro por tipo (Todos / Push / Pull / Core / Legs).
- Lista agrupada por `tipo` (header con count). Ejercicios sin tipo van a grupo "Sin tipo".
- Tocar un ejercicio → vista de detalle con nombre, tipo, músculos y **historial** (una fila por sesión: fecha + count × reps a X kg).
- CTA "+ Crear ejercicio" arriba: nombre (obligatorio) + tipo (único, opcional) + músculo primario (multi-select, al menos 1).

### Tab 3 · Progresión
- Selector de ejercicio → tarjeta con PR (peso máximo), mini-chart de peso máx por sesión (divs + CSS, sin librerías), y tabla Fecha / Mejor set / Volumen.
- Sección "Sesiones completadas" con lista cronológica reversa.
- Botones **Exportar datos** / **Importar datos** (backup JSON). Formato `{ version, exportDate, sesiones, ejercicios, sets }`. Versión actual: 2. Import fusiona por ID (sobrescribe duplicados).

### Schema IndexedDB — stores usados (sin tocar db.js)

```
sesiones   { id, fecha (ISO), finalizada (bool), nombre, timestamp_inicio, duracion_ms, routine_type }
ejercicios { id, nombre (unique), musculo_primario (JSON string array), tipo, fecha_creacion }
sets       { id, sesion_id, ejercicio_id, peso, reps, orden, status }
```

- `status` de set: `"Pending"` | `"Done"` | `"Skipped"`.
- `tipo` de ejercicio: `"Push"` | `"Pull"` | `"Core"` | `"Legs"` | null.
- `musculo_primario` se guarda como `JSON.stringify([...])`. Parsear con `JSON.parse` al leer.
- Datos antiguos sin campos nuevos (`status`, `tipo`, `orden`, `nombre`) siguen funcionando: se renderizan con defaults ("Done", "Sin tipo", etc.).
- Peso en **kg** (el toggle lbs/kg de especificaciones antiguas se eliminó; si vuelve a ser necesario, añadir como preferencia en `localStorage`, no en el record del set).
- Grupos musculares válidos: Pecho, Espalda, Hombros, Bíceps, Tríceps, Piernas, Core, Glúteos.

### Reglas UX

- Mobile-first, botones ≥ 44px. Reutilizar clases `.gym-*`, `.main-tabs`, `.tab-panel`, `.gym-modal-*` existentes en styles.css.
- Usar `createElement(tag, attrs, children)` de app.js — no `innerHTML` para contenido dinámico.
- Sin dependencias externas (ni CDN ni npm).

---

## Cómo agregar un módulo nuevo

1. Crear `modules/[nombre].json` con el contenido del módulo (si es estático) o `modules/[nombre].js` / `renderers/[nombre].js` (si es dinámico).
2. Registrar el módulo en `app.js` (DOMContentLoaded → `registerModule({...})`).
3. Si es `type: 'dynamic'`, exponer `renderXxxModule(container)` y referenciarlo en `render`.
4. Si es `type: 'json'`, crear renderers/tipo.js por cada tipo de sección nuevo.
5. Agregar el `<script>` correspondiente en `index.html`.
6. Validar JS.
7. Agregar el archivo a `ASSETS` en `sw.js` y actualizar el timestamp del cache.
8. `git add -A && git commit -m "feat: módulo [nombre]" && git push`

---

## Estética

Apple Health / Apple Fitness dark mode.
- Fondo base: `#000000`, cards `#1C1C1E`.
- Acento (systemOrange dark): `#FF9F0A` (`--accent`).
- Tipografía: `-apple-system, SF Pro Display/Text, Inter`.
- Separadores: `rgba(255,255,255,0.08)`.
- Radios: tarjetas 14-18px, pills/chips 980px.
- Status chips (Pending/Done/Skipped) con color: gris/acento/rojo.

---

## Comandos útiles

```bash
cd ~/habitos-app
git status
git add -A && git commit -m "mensaje" && git push
node -e "require('fs').readFileSync('./renderers/gym.js','utf8'); console.log('OK')"
grep "CACHE" sw.js
```

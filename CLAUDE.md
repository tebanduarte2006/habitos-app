# CLAUDE.md — Hábitos App

> **Cargado automáticamente al inicio de cada sesión de Claude Code.** Este archivo es la fuente de verdad operativa: estructura del proyecto, reglas absolutas, schema de DB y workflow de deploy. `INSTRUCCIONES.md` es complementario y describe la **arquitectura conceptual y filosofía** del proyecto.
>
> **Antes de escribir cualquier código:** lee este archivo COMPLETO. Antes de hacer commit: actualiza la sección "Historial de cambios estructurales" siguiendo la skill `habitos-changelog`.

---

## 1. Contexto del usuario y del proyecto

- **Usuario:** Esteban Duarte (esteban.duarte.h@gmail.com). Principiante en Git/GitHub — explicar siempre los pasos de deploy con detalle.
- **Producto:** PWA personal de rutinas y hábitos. Solo la usa Esteban.
- **Producción:** https://tebanduarte2006.github.io/habitos-app/
- **Repo local:** `~/habitos-app-1` · rama: `main` · remote: `https://github.com/tebanduarte2006/habitos-app.git`
- **Auth GitHub:** ya configurada con `gh auth login` (HTTPS + osxkeychain). `git push origin main` funciona sin prompts.

---

## 2. Stack

HTML + CSS + JS vanilla. Sin npm. Sin frameworks. Sin bundlers. Sin dependencias externas (ni CDN).
- **Datos persistentes:** IndexedDB vía `db.js`.
- **Preferencias simples:** localStorage.
- **Service Worker:** `sw.js`, cache por timestamp.
- **Deploy:** GitHub Pages desde `main` (raíz del repo). ~1-2 min de propagación.

---

## 3. Estructura de archivos

```
index.html        Shell HTML. Solo estructura, nunca contenido hardcodeado.
app.js            Router + MODULES_REGISTRY. createElement(tag, attrs, children).
styles.css        CSS global + variables Apple dark. NO TOCAR sin instrucción explícita.
db.js             Capa IndexedDB. NO TOCAR (stores e índices fijos).
sw.js             Service Worker. Bumpear CACHE en cada deploy.
manifest.json     Config PWA.
CLAUDE.md         Este archivo (reglas + schema + changelog).
INSTRUCCIONES.md  Filosofía, principio rector, arquitectura conceptual.
modules/          Un JSON por módulo estático, o un JS por módulo interactivo.
renderers/        Un JS por tipo de sección (estáticos) o por módulo dinámico (gym.js).
.claude/skills/   Skills locales del proyecto (ej. habitos-changelog).
```

### Módulos activos

| id | tipo | archivo | notas |
|----|------|---------|-------|
| `gym` | dynamic | `renderers/gym.js` | Workout Tracker (Benny). Rebuild 2026-04-21. |
| `mental` | interactive | `modules/mental.js` | **NO TOCAR** jamás. |

**Eliminados 2026-04-21** (no reintroducir): `skincare`, `oral`, `kegel`.
**Stores deprecados** (existen en DB pero sin UI): `cardio_tipos`, `cardio_registros`.

---

## 4. Reglas absolutas (no violar nunca)

1. **`db.js` — NO MODIFICAR.** Stores e índices son fijos.
2. **`styles.css` — NO MODIFICAR** salvo instrucción explícita. Reutilizar clases existentes (`.gym-*`, `.main-tabs`, `.tab-panel`, `.gym-modal-*`, `.gym-suggestions`, `.gym-suggestion-item`).
3. **`modules/mental.js` y stores `flow_*` — NO TOCAR** bajo ninguna circunstancia.
4. **Sin `innerHTML` para datos de usuario.** Usar `createElement(tag, attrs, children)` de `app.js`.
5. **Sin dependencias externas** (ni npm, ni CDN, ni `<link>` a fuentes externas, ni `<script src>` remoto).
6. **Cada cambio que toque módulos, schema, o UX → actualizar `CLAUDE.md` (sección 9 — Historial) en el mismo commit.** Ver skill `habitos-changelog`.
7. **Validar JS antes de cada commit:**
   ```bash
   node -e "new Function(require('fs').readFileSync('./renderers/gym.js','utf8')); console.log('OK')"
   ```
8. **Bumpear `CACHE` en `sw.js`** en cada deploy (formato `habitos-YYYYMMDD-N`). Agregar archivos nuevos al array `ASSETS`.
9. **Commit + push al terminar cada tarea.** Nunca dejar cambios locales sin pushear.
10. **No `--amend`, no `--force-push`, no `--no-verify`** salvo instrucción explícita del usuario.

---

## 5. IndexedDB — schema completo (NO tocar db.js)

```
sesiones   { id (AI), fecha (ISO), finalizada (bool), nombre?, timestamp_inicio?,
             duracion_ms?, routine_type? }
             índices: fecha, finalizada

ejercicios { id (AI), nombre (unique), musculo_primario (JSON string array),
             tipo?, fecha_creacion? }
             índices: nombre, musculo_primario

sets       { id (AI), sesion_id, ejercicio_id, peso (kg), reps,
             orden?, status? }
             índices: sesion_id, ejercicio_id

preferencias              { clave }                    ← global, libre
flow_sessions             { id, fecha }                ← Mental, NO TOCAR
flow_distracciones        { id, sesion_id, ... }       ← Mental, NO TOCAR
flow_distraccion_catalogo { id, nombre, ... }          ← Mental, NO TOCAR
cardio_tipos              { id }                       ← deprecado
cardio_registros          { id, sesion_id }            ← deprecado
```

### Convenciones

- **`status` en sets:** `"Pending"` | `"Done"` | `"Skipped"` (campo aditivo — sets viejos sin él se renderizan como `"Done"`).
- **`tipo` en ejercicios:** **free-text** = nombre de la rutina en que se usó por última vez (ej. `"Upper"`, `"Push"`, `"Leg Day"`) | `null`. Antes era enum fijo (Push/Pull/Core/Legs) — ya no.
- **`routine_type` en sesiones:** **free-text** definido por el usuario al iniciar sesión. Es la "variable" que une sesión + ejercicios. Al adjuntar un ejercicio a una sesión, su `tipo` se sobreescribe con el `routine_type` actual.
- **`musculo_primario`:** `JSON.stringify(["Pecho", ...])` → leer con `gymParseMuscleArr()` en `gym.js`.
- **Peso:** canónico en DB siempre **kg**. Display siempre **lbs**. Cada add-set row tiene toggle por-input lbs/kg (default lbs); el programa convierte a kg antes de guardar (`gymInputToKg`).
- **Grupos musculares base** (`GYM_MUSCLE_GROUPS`): Pecho/Pecho superior/Pecho inferior, Espalda/Dorsales/Trapecio/Romboides/Lumbar, Hombros/frontal/lateral/posterior, Bíceps/Tríceps/Antebrazo, Core/Abdominales/Oblicuos, Piernas/Cuádriceps/Isquiotibiales/Gemelos/Aductores/Abductores/Tibial, Glúteos, Cuello. **Pool real** = base + cualquier músculo descubierto en `ejercicios.musculo_primario` de la DB. El picker permite escribir cualquier músculo custom.

---

## 6. Módulo Gym — UX (Benny Builds It Workout Tracker)

Implementado en `renderers/gym.js`. Entry point: `renderGymModule(container)` (registrado en `app.js` como `type: 'dynamic'`).

### Tabs

```
[ ▶ Entrenar ]   [ 📚 Ejercicios ]   [ 📈 Progresión ]
```

### Tab 1 · Entrenar (Workout Planner)

- **Sin sesión activa:** últimas 3 sesiones finalizadas + CTA "▶ Iniciar sesión".
- **Al iniciar:** modal con input free-text + autocomplete de rutinas previas (descubiertas de `sesiones.routine_type` ∪ `ejercicios.tipo`). Sin presets fijos. Nombre auto: `Workout #N · <nombre>`.
- **Sesión activa:** header (nombre + fecha + cronómetro) + lista de ejercicio-cards + "+ Agregar ejercicio" + "Finalizar sesión". Sin chip de status global. Sin toggle global de unidad.
- **Cada set:** `Set #N | peso lbs × reps | chip status | ×-delete`. Chip clicable cicla Pending🔲 → Done✅ → Skipped❌ → Pending.
- **Add-set row:** `[Peso] [lbs/kg toggle] [Reps] [+ Set]`. Toggle por-input default lbs.
- **Última sesión (expandible):** bajo el nombre del ejercicio hay un `<details>` "▸ Última sesión". Al expandirse muestra todos los sets de la sesión previa más reciente para ese ejercicio: encabezado con la fecha + filas `Set #N · X lbs × Y reps`. Si no hay datos previos: **"N/A — sin registros previos"**. Lógica en `gymGetLastSessionSetsForEjercicio()`: agrupa sets por `sesion_id`, ordena sesiones por `timestamp_inicio` (descendente), excluye la sesión actual y los placeholders Pending 0/0.
- **Rest timer:** 90s al confirmar un set, interruptible, vibración al terminar.
- **Modal de reanudación** si hay sesión con `finalizada=false`: Reanudar / Guardar como está / Eliminar.
- **Placeholder de ejercicio:** al adjuntar un ejercicio a la sesión se crea un set `{ peso:0, reps:0, status:"Pending" }` para mantener el vínculo en DB. Está **oculto en la UI** (filtrado en `gymBuildExerciseCard`). Se limpia al finalizar la sesión (`gymConfirmFinalize`).

### Tab 2 · Ejercicios (Exercise Library)

- Search input + filter pills **dinámicas**: "Todos" + una pill por cada rutina existente (descubiertas de `ejercicios.tipo` ∪ `sesiones.routine_type`).
- Lista agrupada por `tipo`. Sin tipo → "Sin tipo" (al final).
- Tap en ejercicio → detalle: nombre, tipo, músculos, historial por sesión (fecha + count × reps a X lbs, desc por fecha).
- **CTA "+ Crear ejercicio"** abre el modal con tres campos:
  1. **Nombre** (obligatorio).
  2. **Rutina** (free-text, opcional, con autocomplete). Prellenado con `sesion.routine_type` cuando se crea desde una sesión activa.
  3. **Músculo primario (search-picker)** — multi-select, ≥1 requerido:
     - Input de búsqueda "Buscar o crear músculo…".
     - Encima del input: chips de los músculos seleccionados (`tap × para quitar`).
     - Debajo del input: lista de sugerencias filtrada por el término. Pool = `GYM_MUSCLE_GROUPS` base + músculos descubiertos en DB (dedupe case-insensitive, sorted).
     - Si el término no coincide con ningún músculo conocido, aparece **"+ Crear '&lt;término&gt;'"** que añade el custom al pool y a los seleccionados.

### Tab 3 · Progresión

- Selector de ejercicio → PR card (peso máx + reps) + mini-chart CSS (divs, últimas 12 sesiones) + tabla Fecha/Mejor set/Volumen.
- Sección "Sesiones completadas": lista cronológica reversa (nombre, fecha, count sets, duración).
- **Export:** descarga `habitos-gym-backup-YYYY-MM-DD.json` con `{ version:2, exportDate, sesiones, ejercicios, sets }`.
- **Import:** lee JSON, valida estructura, modal de confirmación, fusiona por ID (sobrescribe duplicados).

---

## 7. app.js — MODULES_REGISTRY

```js
// DOMContentLoaded — orden de registro:
registerModule({ id:'gym',    label:'Gym',    icon:'💪', type:'dynamic',     render: renderGymModule })
registerModule({ id:'mental', label:'Mental', icon:'🧠', type:'interactive' })
```

`loadModule` maneja: `type:'json'` (fetch `modules/<id>.json`), `type:'interactive'` (switch por id), `type:'dynamic'` o `mod.render` (función directa).

---

## 8. Estética (NO tocar styles.css sin instrucción)

Apple Fitness dark mode:
- Fondo: `#000` · Cards: `#1C1C1E` · Cards-2: `#2C2C2E`
- Acento: `#FF9F0A` (`--accent`) · Danger: `#FF453A` · Info: `#0A84FF`
- Texto: `#FFF` / `rgba(255,255,255,.60)` / `.30` / `.18`
- Separadores: `rgba(255,255,255,.08)`
- Radios: `--radius-md: 14px`, `--radius-lg: 18px`, pills/chips: `980px`
- Font: `-apple-system, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif`
- Botones touch-friendly: min 44px height

---

## 9. Workflow deploy (paso a paso)

```bash
cd ~/habitos-app-1
# 1. Hacer cambios
# 2. Validar JS de cada archivo tocado
node -e "new Function(require('fs').readFileSync('./renderers/gym.js','utf8')); console.log('OK')"
# 3. Bumpear CACHE en sw.js (formato habitos-YYYYMMDD-N)
# 4. Si hay archivos nuevos → agregar a ASSETS en sw.js
# 5. Actualizar sección "Historial de cambios estructurales" en CLAUDE.md
#    (ver skill habitos-changelog para formato)
# 6. Commit
git add -A
git commit -m "feat/fix/chore: descripción concisa"
# 7. Push
git push origin main
# 8. Esperar 1-2 min → GitHub Pages redespliega
# 9. En el celular: cerrar PWA por completo y reabrirla para invalidar cache
```

---

## 10. Cómo agregar un módulo nuevo

1. Crear `modules/<nombre>.json` (estático) **o** `renderers/<nombre>.js` (dinámico).
2. `registerModule({...})` en `DOMContentLoaded` de `app.js`.
3. Agregar `<script>` correspondiente en `index.html`.
4. Agregar la ruta a `ASSETS` en `sw.js` + bumpear `CACHE`.
5. Validar JS → commit → push.
6. Actualizar `CLAUDE.md` (Historial + tabla de módulos) y `INSTRUCCIONES.md` si la arquitectura conceptual cambia.

---

## 11. Historial de cambios estructurales

> **Formato (obligatorio).** Una fila por cambio. Si el commit aún no existe, usa `(pending)` y reemplázalo por el SHA tras el push. Ver skill `habitos-changelog` para guía completa.
>
> | Fecha | Commits | Cambio |
> |-------|---------|--------|
> | YYYY-MM-DD | `sha1` | Descripción concisa: qué cambió, dónde, por qué. Mencionar `sw.js → habitos-YYYYMMDD-N`. |

| Fecha | Commits | Cambio |
|-------|---------|--------|
| 2026-04-21 | `6dffb44`, `da82ec2`, `9e08b26`, `862766b` | Rebuild gym con template Benny Workout Tracker. Eliminados skincare/oral/kegel. Status chips Pending/Done/Skipped en sets. Rest timer. Export/Import v2. CLAUDE.md creado. INSTRUCCIONES.md reescrito. `sw.js → habitos-20260421-1`. Auth GitHub configurada con `gh auth login`. |
| 2026-04-21 | `dff4da5` | Rutinas free-text (sin presets Push/Pull/Legs/Full Body/Custom). `routine_type` y `tipo` ahora son free-text con autocomplete. Pills de Ejercicios dinámicas. Display global en lbs (sin toggle global). Toggle lbs/kg por-input en cada add-set row con conversión a kg. `sw.js → habitos-20260421-3`. |
| 2026-04-21 | `ce1cbd0` | Limpieza de UI gym: removido chip Pending del header. Placeholder Pending 0/0 dejó de renderizarse. Lista de músculos primarios expandida a 26 grupos + descubrimiento dinámico desde DB + input "+ Otro músculo…". `sw.js → habitos-20260421-4`. |
| 2026-04-27 | `47ed725` | **Tab Entrenar:** reemplazado el hint "Última vez:" por un `<details>` expandible "▸ Última sesión" en cada ejercicio-card que lista todos los sets de la sesión previa más reciente (fecha + Set #N · X lbs × Y reps), o "N/A — sin registros previos". Nueva función `gymGetLastSessionSetsForEjercicio()`. **Modal Nuevo ejercicio:** reemplazado el grid largo de músculos por un search-picker (input + chips de seleccionados + sugerencias filtradas + opción "+ Crear &lt;término&gt;" para custom). Pool = `GYM_MUSCLE_GROUPS` base + descubiertos en DB. **Docs:** CLAUDE.md reorganizado en secciones numeradas; INSTRUCCIONES.md alineado con estado actual. **Skill nueva:** `.claude/skills/habitos-changelog/SKILL.md`. `sw.js → habitos-20260427-1`. |

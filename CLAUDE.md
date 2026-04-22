# CLAUDE.md — Hábitos App

Cargado automáticamente por Claude Code al inicio de cada sesión. Referencia rápida para todos los agentes (Code + Cowork). **Fuente de verdad completa:** `INSTRUCCIONES.md`.

Usuario: **Esteban Duarte** — principiante en Git/GitHub. Siempre explicar pasos de deploy.
PWA en producción: https://tebanduarte2006.github.io/habitos-app/
Repo local: `~/habitos-app-1` | Rama principal: `main` | Remote: `https://github.com/tebanduarte2006/habitos-app.git`
Auth GitHub configurada con `gh auth login` (HTTPS + osxkeychain). Push funciona con `git push origin main`.

---

## Stack

HTML + CSS + JS vanilla · Sin npm · Sin frameworks · Sin bundlers
IndexedDB (db.js) para datos · localStorage para preferencias simples
Service Worker con cache por versión/timestamp · Deploy: GitHub Pages desde `main`

---

## Módulos activos

| id | tipo | archivo | notas |
|----|------|---------|-------|
| `gym` | dynamic | `renderers/gym.js` | Rebuild completo 2026-04-21. Benny Workout Tracker. |
| `mental` | interactive | `modules/mental.js` | **NO TOCAR** jamás. |

**Eliminados 2026-04-21:** `skincare` (json), `oral` (json), `kegel` (js). No reintroducir.
**Deprecados (stores en DB, sin UI):** `cardio_tipos`, `cardio_registros`.

---

## Reglas absolutas

1. **`db.js` — NO MODIFICAR** bajo ninguna circunstancia.
2. **`styles.css` — NO MODIFICAR** salvo instrucción explícita. Reutilizar clases `.gym-*`, `.main-tabs`, `.tab-panel`, `.gym-modal-*`.
3. **`modules/mental.js` y stores `flow_*` — NO TOCAR.**
4. Sin `innerHTML` para datos de usuario. Usar `createElement(tag, attrs, children)` de `app.js`.
5. Sin dependencias externas (ni CDN, ni npm).
6. Cada cambio que toque módulos, schema o UX → actualizar `INSTRUCCIONES.md` y `CLAUDE.md` en el mismo commit.
7. Validar JS antes de commit: `node -e "new Function(require('fs').readFileSync('./archivo.js','utf8')); console.log('OK')"`.
8. Bumpear `CACHE` en `sw.js` en cada deploy. Agregar nuevos archivos al array `ASSETS`.
9. Commit + push al terminar cada tarea. Nunca dejar sin pushear.
10. No `--amend`, no `--force push` salvo instrucción explícita.

---

## IndexedDB — schema completo (NO tocar db.js)

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

preferencias       { clave }                    ← global, libre
flow_sessions      { id, fecha }                ← Mental, NO TOCAR
flow_distracciones { id, sesion_id, ... }       ← Mental, NO TOCAR
flow_distraccion_catalogo { id, nombre, ... }   ← Mental, NO TOCAR
cardio_tipos       { id }                       ← Deprecado, no usar
cardio_registros   { id, sesion_id }            ← Deprecado, no usar
```

**Convenciones:**
- `status` en sets: `"Pending"` | `"Done"` | `"Skipped"` (aditivo — sets viejos sin campo se renderizan como `"Done"`)
- `tipo` en ejercicios: **free-text** = nombre de la rutina en que se usó por última vez (ej. `"Upper"`, `"Push"`, `"Leg Day"`) | `null`. Antes era enum fijo Push/Pull/Core/Legs — ya no.
- `routine_type` en sesiones: **free-text** definido por el usuario al iniciar sesión. Es la "variable" que une sesión + ejercicios. Al adjuntar un ejercicio a una sesión, su `tipo` se sobreescribe con el `routine_type` actual.
- `musculo_primario`: `JSON.stringify(["Pecho", ...])` → parsear con `gymParseMuscleArr()` en gym.js
- Grupos musculares válidos: Pecho, Espalda, Hombros, Bíceps, Tríceps, Piernas, Core, Glúteos
- Peso canónico en DB siempre **kg**. Display siempre **lbs**. Cada input `+ Set` tiene toggle lbs/kg para indicar la unidad de entrada (default lbs); el programa convierte a kg para guardar.

---

## Módulo Gym — UX (Benny Builds It Workout Tracker)

Implementado en `renderers/gym.js`. Entry point: `renderGymModule(container)` — llamado desde `app.js` via `mod.render`.

### 3 tabs

```
[ ▶ Entrenar ]   [ 📚 Ejercicios ]   [ 📈 Progresión ]
```

**Tab 1 · Entrenar (Workout Planner)**
- Sin sesión activa: últimas 3 sesiones finalizadas + CTA "▶ Iniciar sesión"
- Al iniciar: modal con **input free-text** + autocomplete de rutinas previas (descubiertas de `sesiones.routine_type` ∪ `ejercicios.tipo`). El usuario escribe el nombre que quiera ("Upper", "Push", lo que sea). Nombre auto de la sesión: `Workout #N · <nombre>`. **Sin presets fijos.**
- Sesión activa: header (nombre + fecha + cronómetro + status chip) + lista de ejercicio-cards + "+ Agregar ejercicio" + "Finalizar sesión". **Sin toggle global de unidad** (se removió del header).
- Cada set: `Set #N | peso lbs × reps | chip status | ×-delete`. Chip es clicable: cicla Pending🔲 → Done✅ → Skipped❌
- **Add-set row:** `[Peso] [lbs/kg toggle] [Reps] [+ Set]`. Toggle por-input default lbs; al pulsar cambia a kg; el peso se convierte a kg antes de guardar (`gymInputToKg`).
- Bajo nombre del ejercicio: hint "Última vez: X kg × Y reps" (consulta `sets` anteriores del mismo `ejercicio_id`)
- Rest timer: al confirmar set nuevo, cuenta regresiva 90s (interruptible). Vibración al terminar.
- Modal de reanudación si hay sesión con `finalizada=false`: Reanudar / Guardar como está / Eliminar
- Ejercicio en sesión: sets placeholder status=Pending creados al agregar; se borran los 0/0 al finalizar

**Tab 2 · Ejercicios (Exercise Library)**
- Search input + filter pills **dinámicas**: "Todos" + una pill por cada rutina existente (descubiertas de `ejercicios.tipo` ∪ `sesiones.routine_type`). Sin presets fijos.
- Lista agrupada por `tipo` (header con count). Sin tipo → "Sin tipo" (al final)
- Tap en ejercicio → detalle: nombre, tipo, músculos, historial por sesión (fecha + count×reps a X lbs, desc por fecha)
- CTA "+ Crear ejercicio": nombre (obligatorio) + **rutina** (input free-text con autocomplete, opcional) + músculo primario (multi-select, ≥1 requerido). Cuando se crea desde una sesión activa, la rutina viene prellenada con `sesion.routine_type`.

**Tab 3 · Progresión**
- Selector de ejercicio → PR card (peso máx + reps) + mini-chart CSS (divs, últimas 12 sesiones) + tabla Fecha/Mejor set/Volumen
- Sección "Sesiones completadas": lista cronológica reversa con nombre, fecha, count sets, duración
- **Export:** descarga `habitos-gym-backup-YYYY-MM-DD.json` → `{ version:2, exportDate, sesiones, ejercicios, sets }`
- **Import:** lee JSON, valida estructura, modal confirmación, fusiona por ID (sobrescribe duplicados)

---

## app.js — MODULES_REGISTRY (estado actual)

```js
// DOMContentLoaded — orden de registro:
registerModule({ id:'gym',    label:'Gym',    icon:'💪', type:'dynamic',      render: renderGymModule })
registerModule({ id:'mental', label:'Mental', icon:'🧠', type:'interactive'   })
```

`loadModule` maneja: `type:'json'` (fetch modules/id.json), `type:'interactive'` (switch por id), `type:'dynamic'` / función `mod.render`.

---

## sw.js — cache actual

```js
var CACHE = "habitos-20260421-3";
var ASSETS = ["./","./index.html","./styles.css","./app.js","./db.js",
              "./manifest.json","./renderers/gym.js","./modules/gym.json","./modules/mental.js"];
```

**Al hacer deploy:** cambiar timestamp en CACHE (ej. `"20260421-1"` → `"20260421-2"`) y agregar nuevos archivos a ASSETS.

---

## index.html — scripts cargados

```html
<script src="db.js"></script>
<!-- renderers estáticos: checklist, scenario_picker, alert, rules,
     metric_grid, day_selector, phase_tracker, permit_table, divider -->
<script src="renderers/gym.js"></script>
<script src="modules/mental.js"></script>
<script src="app.js"></script>
```

---

## Estética (NO tocar styles.css sin instrucción)

Apple Fitness dark mode:
- Fondo base: `#000` | Cards: `#1C1C1E` | Cards 2: `#2C2C2E`
- Acento: `#FF9F0A` (var `--accent`) | Danger: `#FF453A` | Info: `#0A84FF`
- Texto: `#FFF` / `rgba(255,255,255,.60)` / `.30` / `.18`
- Separadores: `rgba(255,255,255,.08)`
- Radios: `--radius-md: 14px`, `--radius-lg: 18px`, pills/chips: `980px`
- Font: `-apple-system, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif`
- Botones touch-friendly: min 44px height

---

## Workflow deploy (paso a paso para futuros agentes)

```bash
cd ~/habitos-app-1
# 1. Hacer cambios
# 2. Validar JS
node -e "new Function(require('fs').readFileSync('./renderers/gym.js','utf8')); console.log('OK')"
# 3. Bumpear cache en sw.js
# 4. Actualizar INSTRUCCIONES.md y CLAUDE.md
# 5. Commit
git add -A
git commit -m "feat/fix/chore: descripción"
# 6. Push (auth ya configurada con gh)
git push origin main
# 7. Esperar 1-2 min → GitHub Pages redespliega
# 8. En el celular: cerrar PWA completamente y reabrir
```

---

## Cómo agregar un módulo nuevo

1. Crear `modules/[nombre].json` (estático) o `renderers/[nombre].js` (dinámico)
2. Agregar `registerModule({...})` en `DOMContentLoaded` de `app.js`
3. Agregar `<script>` en `index.html`
4. Agregar ruta a `ASSETS` en `sw.js` + bumpear CACHE
5. Validar JS → commit → push
6. Actualizar `INSTRUCCIONES.md` y `CLAUDE.md`

---

## Historial de cambios estructurales

| Fecha | Commits | Cambio |
|-------|---------|--------|
| 2026-04-21 | `6dffb44`, `da82ec2`, `9e08b26`, `862766b` | Rebuild gym con template Benny Workout Tracker. Eliminados skincare/oral/kegel. Status chips Pending/Done/Skipped en sets. Rest timer. Export/Import v2. CLAUDE.md creado. INSTRUCCIONES.md reescrito. sw.js bumped a `20260421-1`. Auth GitHub configurada con `gh auth login`. |
| 2026-04-21 | (pending) | Rutinas free-text definidas por usuario (sin presets Push/Pull/Legs/Full Body/Custom). `routine_type` y `tipo` ahora son free-text con autocomplete. Pills de Ejercicios dinámicas. Display global en lbs (sin toggle global). Toggle lbs/kg por-input en cada add-set row con conversión a kg para guardar. sw.js → `20260421-3`. |

# CLAUDE.md

Este archivo se carga automáticamente al inicio de cada sesión de Claude Code (y se referencia también desde agentes Cowork). Contiene el contexto mínimo necesario para trabajar en esta PWA sin tener que preguntar al usuario.

**Fuente de verdad detallada:** `INSTRUCCIONES.md` — leerlo completo antes de la primera edición de cada sesión.

---

## Qué es

PWA personal de hábitos. HTML + CSS + JS vanilla, sin npm, sin frameworks. Deploy: GitHub Pages desde `main`. URL: https://tebanduarte2006.github.io/habitos-app/

Usuario único: Esteban Duarte (principiante en Git/GitHub — explicar pasos de deploy siempre).

---

## Módulos activos

| id     | tipo         | archivo                  | estado |
| ------ | ------------ | ------------------------ | ------ |
| gym    | dynamic      | `renderers/gym.js`       | activo — rebuild Benny Workout Tracker (2026-04-21) |
| mental | interactive  | `modules/mental.js`      | activo — NO TOCAR salvo instrucción explícita |

**Eliminados el 2026-04-21:** `skincare` (.json), `oral` (.json), `kegel` (.js). No reintroducir sin pedido explícito.

---

## Reglas absolutas

1. **No modificar `db.js`.** Schema IndexedDB fijo.
2. **No modificar `styles.css`** salvo instrucción explícita. Reutilizar clases existentes (`.gym-*`, `.main-tabs`, `.tab-panel`, `.gym-modal-*`).
3. **No hardcodear contenido** en `index.html` ni `app.js`. Usar `modules/*.json` o un renderer dedicado.
4. **Sin dependencias externas** — ni CDN ni npm.
5. **Cada cambio en la PWA** que toque módulos, schema o UX debe reflejarse en `INSTRUCCIONES.md` en la misma sesión.
6. **Validar JS** antes de cada commit: `node -e "new Function(require('fs').readFileSync('./archivo.js','utf8')); console.log('OK')"`.
7. **Bumpear `CACHE`** en `sw.js` en cada deploy, y añadir nuevos archivos al array `ASSETS`.
8. **Commit + push al terminar cada tarea.** Nunca dejar cambios sin pushear.
9. **No `--amend`, no `--force push`** salvo instrucción explícita del usuario.
10. **`modules/mental.js` y stores `flow_*`:** NO TOCAR.

---

## Schema IndexedDB (sólo lectura / escritura aditiva)

```
sesiones   { id, fecha, finalizada, nombre?, timestamp_inicio?, duracion_ms?, routine_type? }
ejercicios { id, nombre (unique), musculo_primario (JSON string array), tipo?, fecha_creacion? }
sets       { id, sesion_id, ejercicio_id, peso, reps, orden?, status? }
preferencias { clave, ... }          ← global
flow_sessions, flow_distracciones, flow_distraccion_catalogo  ← mental, NO TOCAR
cardio_tipos, cardio_registros       ← en desuso tras rebuild gym 2026-04-21, no usar
```

- `status` de set: `"Pending"` | `"Done"` | `"Skipped"`.
- `tipo` de ejercicio: `"Push"` | `"Pull"` | `"Core"` | `"Legs"` | null.
- `musculo_primario`: `JSON.stringify(["Pecho", ...])`. Parsear al leer.
- Grupos válidos: Pecho, Espalda, Hombros, Bíceps, Tríceps, Piernas, Core, Glúteos.
- Peso en **kg** (toggle lbs/kg retirado en el rebuild).

---

## Gym — UX (Benny Workout Tracker)

3 tabs: `▶ Entrenar` / `📚 Ejercicios` / `📈 Progresión`.

- **Entrenar**: start screen con últimas 3 sesiones + CTA. Sesión activa = header (nombre + fecha + timer + status chip) + exercise cards + add exercise + finalizar. Set rows con chip Pending 🔲 / Done ✅ / Skipped ❌ (toque cicla). Rest timer configurable (default 90s). Resume-prompt al volver si hay sesión `finalizada=false`.
- **Ejercicios**: search + pills Push/Pull/Core/Legs. Lista agrupada por tipo. Detail view con historial completo por sesión. Crear ejercicio: nombre + tipo (opcional) + músculos (multi, ≥1).
- **Progresión**: selector → PR card + mini-chart (divs + CSS) + tabla Fecha/Mejor set/Volumen. Lista de sesiones completadas. **Export / Import JSON** (formato `{ version:2, exportDate, sesiones, ejercicios, sets }`).

---

## Estética

Apple Fitness dark:
- Fondo: `#000`, cards `#1C1C1E`.
- Acento: `#FF9F0A` (var `--accent`).
- Tipografía: `-apple-system, SF Pro, Inter`.
- Radios: 14-18px cards, 980px pills/chips.
- Separadores: `rgba(255,255,255,0.08)`.

---

## Comandos útiles

```bash
cd ~/habitos-app
git status
git add -A && git commit -m "mensaje" && git push
node -e "new Function(require('fs').readFileSync('./renderers/gym.js','utf8')); console.log('OK')"
grep "CACHE" sw.js
```

---

## Workflow de deploy

1. Hacer cambios.
2. Validar JS/JSON.
3. Bumpear `CACHE` en `sw.js`.
4. Reflejar cambio en `INSTRUCCIONES.md` si toca módulos/schema/UX.
5. Commit con mensaje tipo `feat:` / `fix:` / `chore:`.
6. `git push`. GitHub Pages redespliega en 1-2 min.
7. Cerrar y reabrir la PWA en móvil para invalidar el service worker.

---

## Historial de cambios estructurales

- **2026-04-21** — Rebuild gym con template Benny Builds It Workout Tracker. Eliminados skincare/oral/kegel. Cardio deprecado. `INSTRUCCIONES.md` y `CLAUDE.md` actualizados. Status chips Pending/Done/Skipped añadidos a sets (aditivo). Export/Import bump a version 2. Ver commits `6dffb44` y `da82ec2`.

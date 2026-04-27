# INSTRUCCIONES — Hábitos App

> Documento conceptual: **filosofía, principio rector y arquitectura del proyecto.**
> Las **reglas operativas, schema de DB, workflow de deploy y changelog** viven en `CLAUDE.md`. Lee ambos antes de cualquier modificación.

---

## Qué es este proyecto

PWA personal de rutinas y hábitos para Esteban Duarte (uso individual).
Producción: https://tebanduarte2006.github.io/habitos-app/

---

## Principio rector

Todo se construye para ser **fácil de automatizar**. El workflow objetivo:

1. El agente genera contenido del módulo (en Notion u otra fuente).
2. Esteban menciona el módulo en una conversación con Claude Code.
3. El agente genera el JSON / renderer del módulo.
4. Entrega instrucción de una oración a Claude Code.
5. Claude Code agrega el módulo, valida, hace commit y push → PWA actualizada en ~2 min.

Toda decisión de diseño debe favorecer este flujo: archivos chicos, módulos aislados, contenido como datos (JSON) en lugar de hardcoded en HTML/JS.

---

## Estructura conceptual

```
index.html        Shell vacío. Solo estructura HTML, nunca contenido.
app.js            Router principal + MODULES_REGISTRY.
styles.css        CSS global + variables. Estética Apple dark. NO TOCAR.
db.js             Capa IndexedDB. NO TOCAR.
sw.js             Service Worker. Bumpear CACHE en cada deploy.
manifest.json     Config PWA.
modules/          Un JSON por módulo estático, o un JS por módulo interactivo.
renderers/        Un JS por tipo de sección (estáticos) o por módulo dinámico.
CLAUDE.md         Reglas operativas + schema + changelog (auto-loaded).
INSTRUCCIONES.md  Este archivo (filosofía + arquitectura conceptual).
.claude/skills/   Skills locales del proyecto.
```

### Módulos activos

- **gym** (`renderers/gym.js`, dinámico) — Workout Tracker. Ver sección **Módulo Gym** más abajo y CLAUDE.md §6 para UX detallada.
- **mental** (`modules/mental.js`, interactivo) — Flow / enfoque. **NO TOCAR** jamás.

Eliminados el 2026-04-21 (no reintroducir): `skincare`, `oral`, `kegel`.

---

## Reglas absolutas (resumen — lista completa en CLAUDE.md §4)

1. No hardcodear contenido en `index.html` ni en `app.js`. Todo contenido vive en `modules/` o en un renderer dedicado.
2. No modificar `styles.css` ni `db.js` ni `modules/mental.js` salvo instrucción explícita.
3. Un módulo = un archivo. Nunca mezclar contenido de módulos.
4. Validar JS antes de cada commit con `new Function(...)`.
5. Bumpear `CACHE` en `sw.js` en cada deploy (formato `habitos-YYYYMMDD-N`).
6. Cada cambio estructural se registra en CLAUDE.md §11 (Historial). Ver skill `habitos-changelog`.
7. Commit + push al terminar cada tarea. Sin `--amend`, sin `--force-push`, sin `--no-verify`.
8. Sin dependencias externas (npm, CDN, fuentes web).

---

## Stack técnico

- HTML + CSS + JS vanilla. Sin frameworks, sin npm, sin bundlers.
- IndexedDB (vía `db.js`) para datos acumulativos (gym, mental).
- localStorage para preferencias simples (módulos pineados, orden, último día visto).
- JSON externos en `modules/` para módulos estáticos.
- Service Worker con cache versionado por timestamp.
- Deploy: GitHub Pages desde rama `main`, raíz del repo.

---

## Arquitectura de navegación

**Home screen**
- Header con título "Hábitos".
- Reminders contextuales del día, cada uno es shortcut al módulo correspondiente.

**Barra inferior — Quick Access**
- Máximo 4 módulos pineados. Reordenables.
- Se expande hacia arriba (slide-up) para mostrar grid completo de módulos.
- Al intentar pinear un 5º módulo: mensaje "Límite de módulos pineados alcanzado".
- Orden de pineados guardado en localStorage.

**Navegación entre módulos**
- Swipe borde izquierdo → derecha para volver al home.
- Botón "Hábitos" en header como alternativa.
- Sin botón de back adicional.

---

## Módulo Gym — visión conceptual

Diseño basado en el template **"Benny Builds It — Workout Tracker"** (Notion). Tres tabs:

```
[ ▶ Entrenar ]   [ 📚 Ejercicios ]   [ 📈 Progresión ]
```

Idea central del módulo: **llevar la progresión de cada ejercicio**. Toda decisión de UX debe optimizar para que Esteban vea, en el momento de entrenar, qué hizo la última vez (peso, reps, todos los sets) y pueda compararlo fácilmente con lo que está haciendo hoy.

- **Entrenar** = sesión activa con cronómetro, sets en vivo, expandible "Última sesión" por ejercicio para comparar progresión.
- **Ejercicios** = biblioteca + creación con search-picker de músculos.
- **Progresión** = PR + chart + export/import backup.

Para detalle de comportamiento, schema de IndexedDB y reglas de implementación: **ver CLAUDE.md §5 y §6**.

---

## Cómo agregar un módulo nuevo (resumen)

Procedimiento detallado en CLAUDE.md §10. En síntesis:

1. Crear archivo en `modules/` (estático) o `renderers/` (dinámico).
2. `registerModule({...})` en `app.js`.
3. `<script>` en `index.html`.
4. Agregar a `ASSETS` en `sw.js` + bumpear `CACHE`.
5. Validar JS → commit → push.
6. Actualizar CLAUDE.md (changelog + tabla de módulos).

---

## Estética

Apple Health / Apple Fitness dark mode. Detalles de tokens y clases en CLAUDE.md §8.
- Fondo `#000`, cards `#1C1C1E`, acento `#FF9F0A` (`--accent`).
- Tipografía: SF Pro / system-ui.
- Pills/chips: radius `980px`. Cards: `14-18px`.
- Botones mínimo 44px de alto (touch-friendly).

---

## Comandos útiles

```bash
cd ~/habitos-app-1
git status
git add -A && git commit -m "mensaje" && git push
node -e "new Function(require('fs').readFileSync('./renderers/gym.js','utf8')); console.log('OK')"
grep "CACHE" sw.js
```

---
name: habitos-changelog
description: Registra cada cambio estructural de la PWA Hábitos en CLAUDE.md y mantiene INSTRUCCIONES.md alineado. Usar SIEMPRE antes de hacer commit en `~/habitos-app-1` cuando el cambio toque módulos, schema de DB, UX, sw.js, app.js, renderers/*, o agregue/elimine archivos. NO usar para typos en docs ni cambios solo de estilo CSS (que de todos modos no se permiten sin instrucción).
---

# habitos-changelog — cómo registrar cambios en la PWA Hábitos

Esta skill garantiza que cualquier agente que trabaje en `~/habitos-app-1` deje un rastro uniforme y entendible en `CLAUDE.md` y `INSTRUCCIONES.md`. El usuario (Esteban) es principiante en Git y depende de este rastro para entender qué pasó cuándo y por qué.

---

## Cuándo invocar esta skill

**SIEMPRE** antes de `git commit` si el cambio entra en alguna de estas categorías:

- Modificación de `app.js`, `index.html`, `sw.js`, o de cualquier archivo en `renderers/` o `modules/`.
- Agregar / eliminar / renombrar un módulo.
- Cambio en convenciones de IndexedDB (nuevos campos aditivos, nuevos valores de enum free-text, etc. — recordando que `db.js` no se toca).
- Cambio en la UX de un tab (gym Entrenar / Ejercicios / Progresión, mental, etc.).
- Cambio en la estética que **el usuario haya autorizado explícitamente** (styles.css normalmente no se toca).
- Refactor que afecte cómo se cargan los módulos.

**No invocar** para:
- Typos en docs, formato Markdown.
- Cambios meramente locales no commiteados aún (no sirven para el changelog).

---

## Qué hacer (paso a paso)

### 1. Leer el estado actual antes de tocar nada

```bash
cat CLAUDE.md | head -40
grep -n "## 11. Historial" -A 20 CLAUDE.md
```

Identifica la sección `## 11. Historial de cambios estructurales` en `CLAUDE.md`.

### 2. Aplicar cambios al código

Hacer la edición. Validar JS:

```bash
node -e "new Function(require('fs').readFileSync('./<archivo-tocado>.js','utf8')); console.log('OK')"
```

### 3. Bumpear `sw.js`

Abrir `sw.js`, cambiar `CACHE = "habitos-" + "YYYYMMDD-N"` al timestamp actual con `N` incrementado si ya existe ese día. Si se agregaron archivos nuevos, añadirlos al array `ASSETS`.

### 4. Actualizar CLAUDE.md

#### 4a. Sección "Historial de cambios estructurales" (§11) — obligatorio

Agregar **una nueva fila** al final de la tabla con este formato exacto:

```
| YYYY-MM-DD | `(pending)` | <Descripción concisa>. <Qué cambió, dónde, por qué>. `sw.js → habitos-YYYYMMDD-N`. |
```

Reglas para la descripción:
- **Una sola fila** por commit (o grupo de commits relacionados).
- Empieza con la **zona** afectada en negrita: `**Tab Entrenar:**`, `**Modal Nuevo ejercicio:**`, `**DB:**`, `**Module Gym:**`, `**Docs:**`, `**Skill nueva:**`.
- Mencionar **archivos clave** y **funciones nuevas o modificadas** (ej. `gymGetLastSessionSetsForEjercicio()`).
- Mencionar **el porqué** si no es obvio (ej. "para que Esteban compare progresión sin abrir Tab 3").
- Cerrar siempre con la línea `sw.js → habitos-YYYYMMDD-N`.
- Si toca docs/skills, mencionarlo (`Docs: CLAUDE.md §X actualizado` / `Skill nueva: .claude/skills/<nombre>/SKILL.md`).

Ejemplo bueno:

> | 2026-04-27 | `(pending)` | **Tab Entrenar:** reemplazado el hint "Última vez:" por un `<details>` expandible "▸ Última sesión" en cada ejercicio-card que lista todos los sets de la sesión previa más reciente (fecha + Set #N · X lbs × Y reps), o "N/A" si no hay datos. Nueva función `gymGetLastSessionSetsForEjercicio()` en `renderers/gym.js`. **Razón:** ver progresión sin salir de Entrenar. `sw.js → habitos-20260427-1`. |

#### 4b. Otras secciones de CLAUDE.md — solo si aplica

- **§3 (Estructura de archivos / Módulos activos):** actualizar si se agrega o elimina un módulo.
- **§5 (Schema IndexedDB):** actualizar si se introduce un campo aditivo nuevo o cambia una convención (free-text vs enum, unidades, etc.).
- **§6 (Módulo Gym):** actualizar si la UX de un tab cambia. Ser específico sobre estado actual, no listar el cambio dos veces (eso va en §11).
- **§4 (Reglas absolutas):** rara vez. Solo si el usuario eleva una nueva regla.

### 5. Actualizar INSTRUCCIONES.md — solo si aplica

`INSTRUCCIONES.md` describe **arquitectura conceptual y filosofía**. Actualízalo solo si:
- Se agrega/elimina un módulo (sección "Módulos activos").
- Cambia el principio rector o el flujo de automatización.
- Cambia la arquitectura de navegación.

Si solo cambió la implementación interna de un tab, INSTRUCCIONES.md **no se toca**.

### 6. Commit con todo junto

Stage de todo a la vez (código + sw.js + CLAUDE.md + INSTRUCCIONES.md si aplica + skill si aplica) en un único commit:

```bash
git add -A
git commit -m "feat(<scope>): <descripción concisa>"
```

Convención de scope: `gym`, `mental`, `app`, `sw`, `docs`, `skill`.

### 7. Después del push: rellenar el `(pending)` con el SHA real

```bash
git push origin main
git log -1 --format="%h"   # copia el sha corto
```

Edita la fila recién agregada en CLAUDE.md §11 reemplazando `(pending)` por `` `sha-corto` ``. Hacer un segundo commit:

```bash
git add CLAUDE.md
git commit -m "docs: registra sha en changelog"
git push origin main
```

> **Excepción:** si el cambio es muy chico, está permitido dejar `(pending)` y rellenarlo en el siguiente commit que ya toque docs.

---

## Checklist final (copiable)

Antes de cerrar el commit, verifica:

- [ ] JS validado con `new Function(...)`.
- [ ] `sw.js` con CACHE bumpeado al timestamp del día.
- [ ] Si hay archivos nuevos: agregados a `ASSETS` en `sw.js`.
- [ ] CLAUDE.md §11 con la fila nueva (formato exacto).
- [ ] CLAUDE.md §3/§5/§6 actualizados si la realidad cambió.
- [ ] INSTRUCCIONES.md actualizado solo si cambió arquitectura conceptual.
- [ ] Un único commit reúne código + cache + docs.
- [ ] `git push origin main` ejecutado.
- [ ] `(pending)` reemplazado por SHA en un commit follow-up.

---

## Antipatrones (no hacer)

- **No** dejar el changelog para "después" — el siguiente agente no sabrá qué pasó.
- **No** describir el cambio en términos vagos ("mejoré el gym"). Especifica zona, función, archivo y razón.
- **No** repetir literalmente el commit message en el changelog: el changelog es más rico en contexto (qué, dónde, por qué).
- **No** mover reglas operativas a INSTRUCCIONES.md ni filosofía a CLAUDE.md. Cada doc tiene su rol:
  - **CLAUDE.md** = qué hacer y cómo (operativo, auto-loaded).
  - **INSTRUCCIONES.md** = por qué y para qué (conceptual).
- **No** crear archivos `CHANGELOG.md` u otros docs paralelos. Todo el rastro vive en CLAUDE.md §11.

---

## Plantilla rápida (copiable)

```markdown
| YYYY-MM-DD | `(pending)` | **<Zona afectada>:** <qué cambió específicamente, qué función/archivo>. **Razón:** <por qué, en una frase>. `sw.js → habitos-YYYYMMDD-N`. |
```

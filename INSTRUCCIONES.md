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
index.html ← shell vacío. Solo estructura HTML. Nunca hardcodear contenido aquí. app.js ← router principal. Carga módulos, maneja navegación global. styles.css ← CSS global + variables. Estética Apple dark. No tocar sin instrucción explícita. db.js ← capa IndexedDB. Todos los módulos con datos acumulativos la usan. sw.js ← Service Worker. Cache por timestamp. Actualizar timestamp en cada deploy. manifest.json ← config PWA INSTRUCCIONES.md ← este archivo modules/ ← un JSON por módulo. Fuente de verdad del contenido. renderers/ ← un JS por tipo de sección. app.js los llama dinámicamente.



---

## Reglas absolutas — no violar nunca

1. No hardcodear contenido en index.html ni en app.js. El contenido va en modules/*.json.
2. No modificar styles.css a menos que se indique explícitamente.
3. Cada módulo tiene su propio archivo en modules/. Nunca mezclar contenido de módulos.
4. Cada renderer en renderers/ maneja exactamente un tipo de sección.
5. Validar JS antes de cada commit: node -e "require('fs').readFileSync('./app.js','utf8'); console.log('OK')"
6. Actualizar el timestamp en sw.js en cada commit para invalidar el cache del browser.
7. Commit y push al terminar cada tarea. Nunca dejar cambios sin pushear.

---

## Stack técnico

- HTML + CSS + JS vanilla. Sin frameworks. Sin npm. Sin bundlers.
- IndexedDB (via db.js) para datos acumulativos: gym, historial, preferencias.
- localStorage solo para preferencias simples que no requieren historial.
- JSON externos en modules/ para contenido de módulos estáticos (skincare, oral, etc.).
- Service Worker con cache por timestamp.
- Deploy: GitHub Pages desde rama main, raíz del repo.

---

## Arquitectura de navegación

**Home screen**
- Header con título "Hábitos" que se minimiza al hacer scroll
- El título es también botón de menú (abre grid completo de módulos)
- Reminders contextuales del día, cada uno es shortcut al módulo correspondiente

**Barra inferior — Quick Access**
- Máximo 4 módulos pineados. Reordenables.
- Se expande hacia arriba (slide-up) para mostrar grid completo de módulos
- Al intentar pinear un 5to módulo: mensaje "Límite de módulos pineados alcanzado"
- Orden de módulos pineados guardado en localStorage

**Navegación entre módulos**
- Swipe borde izquierdo → derecha para volver al home
- Botón "Hábitos" en header como alternativa
- Sin botón de back adicional

---

## Módulo Gym — schema IndexedDB

**sesiones:** id · nombre · fecha · timestamp_inicio · duracion_ms · nota · finalizada(bool)
**ejercicios:** id · nombre · musculo_primario · fecha_creacion
**sets:** id · sesion_id · ejercicio_id · orden · reps · peso_lbs

Comportamiento clave:
- Toggle lbs/kg al ingresar peso → siempre se guarda en lbs
- Cronómetro: guarda timestamp_inicio. Al reabrir: calcula ahora - timestamp_inicio
- Sesión sin finalizar: modal con 3 opciones (ajustar hora, guardar como está, eliminar)
- Auto-guardado continuo de cada set
- Músculo primario obligatorio al crear ejercicio nuevo

---

## Cómo agregar un módulo nuevo

1. Crear modules/[nombre].json con el contenido del módulo
2. Registrar el módulo en app.js (array MODULES_REGISTRY)
3. Si el módulo usa un tipo de sección nuevo, crear renderers/[tipo].js
4. Validar JS
5. Actualizar timestamp en sw.js
6. git add -A && git commit -m "feat: módulo [nombre]" && git push

---

## Estética

Apple Health / Apple Fitness dark mode.
- Fondo: #000000
- Acento: #32d74b (verde Apple Fitness)
- Tipografía: -apple-system, SF Pro
- Separadores: 0.5px rgba(84,84,88,0.65)
- Bordes: border-radius 16px (tarjetas), 980px (pills/botones)
- Checkboxes: circulares con animación ring

---

## Comandos útiles
```bash
cd ~/habitos-app
git status
git add -A && git commit -m "mensaje" && git push
node -e "require('fs').readFileSync('./app.js','utf8'); console.log('OK')"
grep "CACHE" sw.js
```

---

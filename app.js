// app.js — Router principal de Hábitos
// Carga módulos, maneja navegación global.

const MODULES_REGISTRY = [];

function registerModule(mod) {
  MODULES_REGISTRY.push(mod);
}

function renderHomeScreen() {
  const home = document.getElementById('home-screen');
  home.innerHTML = `
    <header class="home-header">
      <div class="home-date">${formatDate()}</div>
      <h1 class="home-title" id="home-title-btn">Hábitos</h1>
    </header>
    <div class="home-reminders" id="home-reminders">
      <p class="no-reminders">Cargando...</p>
    </div>
  `;
  renderBottomBar();
}

function renderBottomBar() {
  const bar = document.getElementById('bottom-bar');
  bar.innerHTML = '<p style="color:var(--t2);font-size:13px;">Módulos próximamente</p>';
}

function formatDate() {
  const d = new Date();
  const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`;
}

document.addEventListener('DOMContentLoaded', () => {
  renderHomeScreen();
});

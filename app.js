/**
 * SRE UNI - SISTEMA DE RESERVA DE AMBIENTES DE ESTUDIO
 * App completa reescrita — funcional, sin errores de modal, con localStorage
 */

// ============================================================
// DATOS SEMILLA
// ============================================================
const SEED_USERS = [
  { email: 'admin@uni.edu.pe',   password: 'admin', name: 'Admin',       role: 'admin' },
  { email: '20220101a@uni.pe',   password: 'uni',   name: 'Estudiante 1',role: 'estudiante' },
  { email: '20220102a@uni.pe',password: 'uni',  name: 'Estudiante 2',role: 'estudiante' }
];

const SEED_SPACES = [
  { id:'s1', name:'Cubículo 101 - Biblioteca Central', faculty:'FIIS', type:'Cubículo',    capacity:4,  features:['Pizarra','Pantalla TV','Aire Acondicionado'], imageUrl: './Imagenes/BibliotecaCentral.JPG' },
  { id:'s2', name:'Cubículo 102 - Biblioteca Central', faculty:'FIIS', type:'Cubículo',    capacity:4,  features:['Pizarra','Pantalla TV'],                      imageUrl:'./Imagenes/BibliotecaCentral.JPG' },
  { id:'s3', name:'Laboratorio de Simulación L3',      faculty:'FIIS', type:'Laboratorio', capacity:15, features:['PCs de alta gama','Proyector','Pizarra'],       imageUrl:'./Imagenes/LaboratorioSimulacion.jpg' },
  { id:'s4', name:'Aula de Estudio A4 - Pabellón V',   faculty:'FIC',  type:'Aula',        capacity:20, features:['Pizarra','Proyector'],                          imageUrl:'./Imagenes/SalaPabellones.jpg' },
  { id:'s5', name:'Cubículo 302 - Pabellón Q',         faculty:'FIM',  type:'Cubículo',    capacity:6,  features:['Pizarra','Enchufes'],                           imageUrl:'./Imagenes/SalaPabellones.jpg' },
  { id:'s6', name:'Laboratorio de Redes R1',           faculty:'FIEE', type:'Laboratorio', capacity:25, features:['Equipos Cisco','Proyector','PCs'],              imageUrl:'./Imagenes/LaboratorioRedes.jpg' },
  { id:'s7', name:'Sala de Asesorías Académicas',      faculty:'FIIS', type:'Aula',        capacity:8,  features:['Pizarra','Proyector','Pantalla TV'],            imageUrl:'./Imagenes/SalaAsesoría.jpg' }
];

function todayStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

const SEED_RESERVATIONS = [
  { id:'r1', userId:'20220101a@uni.pe', spaceId:'s1', date:todayStr(-1), timeSlot:'10:00 - 12:00', status:'completed' },
  { id:'r2', userId:'20220101a@uni.pe', spaceId:'s3', date:todayStr(1),  timeSlot:'14:00 - 16:00', status:'active' },
  { id:'r3', userId:'20220101a@uni.pe', spaceId:'s5', date:todayStr(1),  timeSlot:'08:00 - 10:00', status:'active' }
];

const SEED_RATINGS = [
  { id:'rat1', spaceId:'s1', userId:'20220101a@uni.pe', stars:5, comment:'Excelente cubículo, pantalla muy útil.' },
  { id:'rat2', spaceId:'s3', userId:'20220101a@uni.pe', stars:4, comment:'Las PCs son rápidas.' }
];

const TIME_SLOTS = [
  '08:00 - 10:00','10:00 - 12:00','12:00 - 14:00',
  '14:00 - 16:00','16:00 - 18:00','18:00 - 20:00','20:00 - 22:00'
];

// ============================================================
// STORE — PERSISTENCIA EN localStorage
// ============================================================
const store = {
  users:        [],
  spaces:       [],
  reservations: [],
  ratings:      [],
  currentUser:  null,

  init() {
    // Solo poblar si no existe aún
    if (!localStorage.getItem('sre_users'))        localStorage.setItem('sre_users',        JSON.stringify(SEED_USERS));
    if (!localStorage.getItem('sre_spaces'))       localStorage.setItem('sre_spaces',       JSON.stringify(SEED_SPACES));
    if (!localStorage.getItem('sre_reservations')) localStorage.setItem('sre_reservations', JSON.stringify(SEED_RESERVATIONS));
    if (!localStorage.getItem('sre_ratings'))      localStorage.setItem('sre_ratings',      JSON.stringify(SEED_RATINGS));

    this.load();
    this.currentUser = JSON.parse(sessionStorage.getItem('sre_user') || 'null');
  },

  load() {
    this.users        = JSON.parse(localStorage.getItem('sre_users'));
    this.spaces       = JSON.parse(localStorage.getItem('sre_spaces'));
    this.reservations = JSON.parse(localStorage.getItem('sre_reservations'));
    this.ratings      = JSON.parse(localStorage.getItem('sre_ratings'));
  },

  save(key) {
    localStorage.setItem('sre_' + key, JSON.stringify(this[key]));
  },

  login(user) {
    this.currentUser = user;
    sessionStorage.setItem('sre_user', JSON.stringify(user));
  },

  logout() {
    this.currentUser = null;
    sessionStorage.removeItem('sre_user');
  },

  spaceStats(spaceId) {
    const rs = this.ratings.filter(r => r.spaceId === spaceId);
    const avg = rs.length ? rs.reduce((s,r) => s + r.stars, 0) / rs.length : 0;
    return { avg: parseFloat(avg.toFixed(1)), count: rs.length };
  }
};

// ============================================================
// MODAL — BUG FIX: quitar/poner hidden correctamente
// ============================================================
let modalCleanup = null;

function openModal(title, bodyHtml) {
  const overlay = document.getElementById('global-modal');
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  overlay.classList.remove('hidden');   // ← corrección crítica
  overlay.classList.add('active');
  lucide.createIcons();
}

function closeModal() {
  const overlay = document.getElementById('global-modal');
  overlay.classList.remove('active');
  overlay.classList.add('hidden');       // ← vuelve a ocultar
  if (modalCleanup) { modalCleanup(); modalCleanup = null; }
}

window.closeModal = closeModal;

// ============================================================
// TOASTS
// ============================================================
function toast(title, msg, type = 'success') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  const icon = type === 'danger' ? 'alert-triangle' : type === 'warning' ? 'alert-circle' : 'check-circle';
  t.innerHTML = `<i data-lucide="${icon}"></i>
    <div class="toast-content"><div class="toast-title">${title}</div><div class="toast-message">${msg}</div></div>
    <button class="toast-close" onclick="this.parentElement.remove()"><i data-lucide="x"></i></button>`;
  c.appendChild(t);
  lucide.createIcons();
  setTimeout(() => { if (t.parentNode) t.style.transform = 'translateX(120%)'; setTimeout(() => t.remove(), 350); }, 4000);
}

// ============================================================
// ROUTER
// ============================================================
const ROUTES = {
  login:    renderLogin,
  register: renderRegister,
  explore:  renderExplore,
  bookings: renderBookings,
  admin:    renderAdmin,
  reports:  renderReports
};

function router() {
  let hash = window.location.hash.replace('#', '');

  // Sin sesión → solo puede ver login o register
  if (!store.currentUser) {
    if (hash === 'register') renderRegister();
    else { window.location.hash = '#login'; renderLogin(); }
    return;
  }

  // Con sesión en rutas de auth → redirigir
  if (!hash || hash === 'login' || hash === 'register') {
    window.location.hash = store.currentUser.role === 'admin' ? '#admin' : '#explore';
    return;
  }

  // Admin no puede ver rutas de estudiante
  if (store.currentUser.role === 'admin' && (hash === 'explore' || hash === 'bookings')) {
    window.location.hash = '#admin'; return;
  }

  // Estudiante no puede ver rutas de admin
  if (store.currentUser.role !== 'admin' && (hash === 'admin' || hash === 'reports')) {
    toast('Acceso Denegado', 'No tienes permisos de administrador.', 'danger');
    window.location.hash = '#explore'; return;
  }

  updateNav();
  const fn = ROUTES[hash];
  if (fn) fn();
}

window.addEventListener('hashchange', router);

// ============================================================
// ARRANQUE DE LA APP
// ============================================================
store.init();

// Cerrar modal al clickear fuera
document.getElementById('global-modal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

updateNav();
router();

// ============================================================
// NAVEGACIÓN
// ============================================================
function updateNav() {
  const header     = document.getElementById('main-header');
  const navExplore = document.getElementById('nav-explore');
  const navBook    = document.getElementById('nav-bookings');
  const navAdmin   = document.getElementById('nav-admin');
  const navReports = document.getElementById('nav-reports');
  const nameEl     = document.getElementById('header-user-name');
  const roleEl     = document.getElementById('header-user-role');
  const avatarEl   = document.getElementById('user-avatar');

  if (!store.currentUser) { header.classList.add('hidden'); return; }

  header.classList.remove('hidden');
  nameEl.textContent   = store.currentUser.role === 'admin' ? 'Admin' : store.currentUser.name;
  roleEl.textContent   = store.currentUser.role === 'admin' ? 'Administrador' : 'Estudiante UNI';
  avatarEl.textContent = store.currentUser.role === 'admin' ? 'A' : store.currentUser.name.charAt(0).toUpperCase();

  const isAdmin = store.currentUser.role === 'admin';
  navExplore.classList.toggle('hidden', isAdmin);
  navBook.classList.toggle('hidden', isAdmin);
  navAdmin.classList.toggle('hidden', !isAdmin);
  navReports.classList.toggle('hidden', !isAdmin);

  // Resaltar link activo
  const hash = window.location.hash.replace('#','');
  [navExplore, navBook, navAdmin, navReports].forEach(n => n.classList.remove('active'));
  if (hash === 'explore')  navExplore.classList.add('active');
  if (hash === 'bookings') navBook.classList.add('active');
  if (hash === 'admin')    navAdmin.classList.add('active');
  if (hash === 'reports')  navReports.classList.add('active');

  document.getElementById('logout-btn').onclick = () => {
    store.logout();
    toast('Sesión Cerrada', 'Hasta pronto.', 'warning');
    window.location.hash = '#login';
  };

  // Menú móvil
  const menuBtn = document.getElementById('mobile-menu-btn');
  const navMenu = document.getElementById('nav-menu');
  menuBtn.onclick = (e) => { e.stopPropagation(); navMenu.classList.toggle('active'); };
  document.addEventListener('click', () => navMenu.classList.remove('active'), { once: true });
}

// ============================================================
// VISTA: LOGIN
// ============================================================
function renderLogin() {
  document.getElementById('main-header').classList.add('hidden');
  document.getElementById('app').innerHTML = `
    <div class="auth-wrapper">
      <div class="auth-sidebar">
        <div class="auth-sidebar-header">
          <div class="auth-logo-circle"><i data-lucide="graduation-cap"></i></div>
          <span class="auth-sidebar-title">SRE UNI</span>
        </div>
        <div class="auth-sidebar-body">
          <h2 class="auth-welcome-title">Estudia a tu ritmo en ambientes ideales.</h2>
          <p class="auth-welcome-text">Portal exclusivo para estudiantes de la <strong>Universidad Nacional de Ingeniería</strong>.</p>
          <div class="auth-features-list">
            <div class="auth-feature-item"><i data-lucide="check-circle"></i> Evita duplicidad de reservas.</div>
            <div class="auth-feature-item"><i data-lucide="check-circle"></i> Consulta disponibilidad en tiempo real.</div>
            <div class="auth-feature-item"><i data-lucide="check-circle"></i> Cancela y gestiona tu historial.</div>
          </div>
        </div>
        <div class="auth-sidebar-footer">Facultad de Ingeniería Industrial y de Sistemas • FIIS</div>
      </div>
      <div class="auth-form-container">
        <div class="auth-form-header">
          <h1 class="auth-form-title">Iniciar Sesión</h1>
          <p class="auth-form-subtitle">Ingresa con tus credenciales institucionales de la UNI.</p>
        </div>
        <form id="login-form">
          <div class="form-group">
            <label class="form-label">Correo Institucional</label>
            <div class="input-with-icon">
              <input id="li-email" type="email" class="form-input" placeholder="ejemplo@uni.pe" required>
              <i data-lucide="mail"></i>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Contraseña</label>
            <div class="input-with-icon">
              <input id="li-pass" type="password" class="form-input" placeholder="••••••••" required>
              <i data-lucide="lock"></i>
            </div>
          </div>
          <button type="submit" class="auth-btn">Ingresar al Sistema <i data-lucide="arrow-right"></i></button>
        </form>
        <div class="auth-toggle">¿No tienes cuenta? <span class="auth-toggle-link" onclick="window.location.hash='#register'">Regístrate aquí</span></div>
        <div class="demo-credentials">
          <div class="demo-title"><i data-lucide="key-round"></i> Cuentas Demo:</div>
          <div class="demo-grid">
            <div class="demo-account" onclick="document.getElementById('li-email').value='admin@uni.edu.pe';document.getElementById('li-pass').value='admin'">
              <span class="demo-role">Administrador</span><span>admin@uni.edu.pe / admin</span>
            </div>
            <div class="demo-account" onclick="document.getElementById('li-email').value='20220101a@uni.pe';document.getElementById('li-pass').value='uni'">
              <span class="demo-role">Estudiante</span><span>20220101a@uni.pe / uni</span>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  lucide.createIcons();

  document.getElementById('login-form').onsubmit = (e) => {
    e.preventDefault();
    const email = document.getElementById('li-email').value.trim().toLowerCase();
    const pass  = document.getElementById('li-pass').value;
    const user  = store.users.find(u => u.email.toLowerCase() === email && u.password === pass);
    if (user) {
      store.login(user);
      toast(`¡Bienvenido, ${user.role === 'admin' ? 'Admin' : user.name}!`, 'Inicio de sesión exitoso.');
      window.location.hash = user.role === 'admin' ? '#admin' : '#explore';
    } else {
      toast('Error', 'Correo o contraseña incorrectos.', 'danger');
    }
  };
}

// ============================================================
// VISTA: REGISTRO
// ============================================================
function renderRegister() {
  document.getElementById('main-header').classList.add('hidden');
  document.getElementById('app').innerHTML = `
    <div class="auth-wrapper">
      <div class="auth-sidebar">
        <div class="auth-sidebar-header">
          <div class="auth-logo-circle"><i data-lucide="graduation-cap"></i></div>
          <span class="auth-sidebar-title">SRE UNI</span>
        </div>
        <div class="auth-sidebar-body">
          <h2 class="auth-welcome-title">Únete a la comunidad de estudio.</h2>
          <p class="auth-welcome-text">Crea tu cuenta con tu correo institucional UNI.</p>
          <div class="auth-features-list">
            <div class="auth-feature-item"><i data-lucide="shield-check"></i> Solo dominios @uni.edu.pe o @uni.pe</div>
            <div class="auth-feature-item"><i data-lucide="clock"></i> Reservas en menos de un minuto.</div>
          </div>
        </div>
        <div class="auth-sidebar-footer">FIIS — Implementación de Sistemas SI903U</div>
      </div>
      <div class="auth-form-container">
        <div class="auth-form-header">
          <h1 class="auth-form-title">Crear Cuenta</h1>
          <p class="auth-form-subtitle">Regístrate con tu correo oficial de la UNI.</p>
        </div>
        <form id="reg-form">
          <div class="form-group">
            <label class="form-label">Nombre Completo</label>
            <div class="input-with-icon">
              <input id="rg-name" type="text" class="form-input" placeholder="Tu nombre" required>
              <i data-lucide="user"></i>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Correo Institucional</label>
            <div class="input-with-icon">
              <input id="rg-email" type="email" class="form-input" placeholder="ejemplo@uni.edu.pe" required>
              <i data-lucide="mail"></i>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Contraseña (mín. 4 caracteres)</label>
            <div class="input-with-icon">
              <input id="rg-pass" type="password" class="form-input" placeholder="••••••••" required minlength="4">
              <i data-lucide="lock"></i>
            </div>
          </div>
          <button type="submit" class="auth-btn">Crear Cuenta <i data-lucide="user-plus"></i></button>
        </form>
        <div class="auth-toggle">¿Ya tienes cuenta? <span class="auth-toggle-link" onclick="window.location.hash='#login'">Inicia sesión aquí</span></div>
      </div>
    </div>`;
  lucide.createIcons();

  document.getElementById('reg-form').onsubmit = (e) => {
    e.preventDefault();
    const name  = document.getElementById('rg-name').value.trim();
    const email = document.getElementById('rg-email').value.trim().toLowerCase();
    const pass  = document.getElementById('rg-pass').value;
    const dom   = email.split('@')[1];
    if (dom !== 'uni.pe' && dom !== 'uni.edu.pe') {
      toast('Correo inválido', 'Solo se aceptan correos @uni.pe o @uni.edu.pe.', 'danger'); return;
    }
    if (store.users.some(u => u.email.toLowerCase() === email)) {
      toast('Ya registrado', 'Este correo ya existe en el sistema.', 'danger'); return;
    }
    store.users.push({ email, password: pass, name, role: 'estudiante' });
    store.save('users');
    toast('¡Registro exitoso!', 'Ahora puedes iniciar sesión.', 'success');
    window.location.hash = '#login';
  };
}

// ============================================================
// VISTA: EXPLORAR AMBIENTES
// ============================================================
function renderExplore() {
  const total     = store.spaces.length;
  const occupied  = store.reservations.filter(r => r.date === todayStr() && r.status === 'active').map(r => r.spaceId);
  const available = total - new Set(occupied).size;

  document.getElementById('app').innerHTML = `
    <div class="section-header">
      <div class="section-title-wrapper">
        <h1 class="section-title">Explorar Ambientes de Estudio</h1>
        <p class="section-subtitle">Encuentra y reserva cubículos, laboratorios y aulas disponibles.</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card stat-primary">
        <div class="stat-icon-box"><i data-lucide="door-open"></i></div>
        <div class="stat-info-box"><span class="stat-value">${total}</span><span class="stat-label">Total Ambientes</span></div>
      </div>
      <div class="stat-card stat-success">
        <div class="stat-icon-box"><i data-lucide="check-circle-2"></i></div>
        <div class="stat-info-box"><span class="stat-value">${available}</span><span class="stat-label">Disponibles Hoy</span></div>
      </div>
      <div class="stat-card stat-gold">
        <div class="stat-icon-box"><i data-lucide="trophy"></i></div>
        <div class="stat-info-box"><span class="stat-value">FIIS</span><span class="stat-label">Facultad Destacada</span></div>
      </div>
    </div>

    <div class="booking-guide-card">
      <div class="guide-title"><i data-lucide="info"></i> ¿Cómo reservar tu espacio?</div>
      <div class="guide-steps">
        <div class="guide-step"><span class="step-number">1</span><span>Busca y filtra el ambiente que necesitas.</span></div>
        <div class="guide-step"><span class="step-number">2</span><span>Presiona "Reservar Ambiente" y elige fecha y horario.</span></div>
        <div class="guide-step"><span class="step-number">3</span><span>Confirma y recibe tu comprobante de reserva.</span></div>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-row">
        <div class="search-box">
          <input type="text" id="search-input" class="search-input" placeholder="Buscar por nombre, facultad o equipamiento...">
          <i data-lucide="search"></i>
        </div>
        <select id="filter-type" class="filter-select">
          <option value="">Todos los Tipos</option>
          <option value="Cubículo">Cubículos</option>
          <option value="Laboratorio">Laboratorios</option>
          <option value="Aula">Aulas de Estudio</option>
        </select>
        <select id="filter-cap" class="filter-select">
          <option value="">Cualquier Capacidad</option>
          <option value="small">Pequeña (1–5)</option>
          <option value="medium">Mediana (6–10)</option>
          <option value="large">Grande (11+)</option>
        </select>
      </div>
      <div class="filter-tags">
        <span class="filter-tag active" data-fac="">Todas</span>
        <span class="filter-tag" data-fac="FIIS">FIIS</span>
        <span class="filter-tag" data-fac="FIM">FIM</span>
        <span class="filter-tag" data-fac="FIC">FIC</span>
        <span class="filter-tag" data-fac="FIEE">FIEE</span>
      </div>
    </div>

    <div class="spaces-grid" id="spaces-grid"></div>`;

  lucide.createIcons();
  renderCards();

  document.getElementById('search-input').oninput  = renderCards;
  document.getElementById('filter-type').onchange  = renderCards;
  document.getElementById('filter-cap').onchange   = renderCards;
  document.querySelectorAll('.filter-tag').forEach(t => {
    t.onclick = () => { document.querySelectorAll('.filter-tag').forEach(x => x.classList.remove('active')); t.classList.add('active'); renderCards(); };
  });
}

function renderCards() {
  const query = document.getElementById('search-input').value.toLowerCase();
  const type  = document.getElementById('filter-type').value;
  const cap   = document.getElementById('filter-cap').value;
  const fac   = (document.querySelector('.filter-tag.active') || {}).dataset.fac || '';
  const occupied = new Set(store.reservations.filter(r => r.date === todayStr() && r.status === 'active').map(r => r.spaceId));

  const filtered = store.spaces.filter(s => {
    if (query && !s.name.toLowerCase().includes(query) && !s.faculty.toLowerCase().includes(query) && !s.features.join(' ').toLowerCase().includes(query)) return false;
    if (type && s.type !== type) return false;
    if (fac  && s.faculty !== fac) return false;
    if (cap === 'small'  && s.capacity > 5)  return false;
    if (cap === 'medium' && (s.capacity < 6 || s.capacity > 10)) return false;
    if (cap === 'large'  && s.capacity < 11) return false;
    return true;
  });

  const grid = document.getElementById('spaces-grid');
  if (!grid) return;

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state">
      <div class="empty-icon-box"><i data-lucide="search-code"></i></div>
      <h3 class="empty-title">Sin resultados</h3>
      <p class="empty-text">Ningún ambiente coincide con tu búsqueda. Intenta otros filtros.</p>
    </div>`;
    lucide.createIcons(); return;
  }

  grid.innerHTML = filtered.map(s => {
    const stats   = store.spaceStats(s.id);
    const busy    = occupied.has(s.id);
    const stars   = Array.from({length:5}, (_,i) => `<i data-lucide="star" ${i < Math.round(stats.avg) ? 'style="fill:var(--color-gold);color:var(--color-gold);"' : ''}></i>`).join('');
    const isImg   = s.imageUrl && (s.imageUrl.startsWith('data:image') || s.imageUrl.startsWith('Imagenes/'));
    const imgHtml = isImg
      ? `<img src="${s.imageUrl}" alt="${s.name}" class="space-card-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
         <span class="img-fallback-icon" style="display:none;width:100%;height:100%;align-items:center;justify-content:center;"><i data-lucide="building-2" style="width:60px;height:60px;"></i></span>`
      : `<i data-lucide="${s.imageUrl || 'book-open'}" style="width:72px;height:72px;"></i>`;

    return `<div class="space-card">
      <div class="space-image-box">
        ${imgHtml}
        <span class="space-faculty-badge">${s.faculty}</span>
        <span class="space-badge ${busy ? 'badge-unavailable':'badge-available'}">${busy ? 'Ocupado Hoy':'Disponible'}</span>
      </div>
      <div class="space-info">
        <span class="space-type">${s.type}</span>
        <h3 class="space-name">${s.name}</h3>
        <div class="space-rating-row">
          <div class="stars-container">${stars}</div>
          <span class="rating-value">${stats.avg.toFixed(1)}</span>
          <span class="rating-count">(${stats.count} evaluaciones)</span>
        </div>
        <div class="space-features">
          <div class="feature-item"><i data-lucide="users"></i> ${s.capacity} personas</div>
          ${s.features.slice(0,3).map(f => `<div class="feature-item"><i data-lucide="check-circle-2"></i> ${f}</div>`).join('')}
        </div>
        <div class="space-action-row">
          <button class="reserve-btn" onclick="openBooking('${s.id}')">
            <i data-lucide="calendar"></i> Reservar Ambiente
          </button>
        </div>
      </div>
    </div>`;
  }).join('');

  lucide.createIcons();
}

// ============================================================
// RESERVAS — MODAL DE RESERVA
// ============================================================
window.openBooking = function(spaceId) {
  const space = store.spaces.find(s => s.id === spaceId);
  if (!space) return;

  openModal('Reservar Ambiente de Estudio', `
    <div class="booking-form">
      <div class="modal-info-header">
        <div class="modal-info-icon"><i data-lucide="building-2"></i></div>
        <div class="modal-info-text">
          <span class="modal-info-name">${space.name}</span>
          <span class="modal-info-meta">Facultad: ${space.faculty} • Capacidad: ${space.capacity} pers.</span>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">1. Seleccionar Fecha</label>
        <input type="date" id="bk-date" class="form-input" style="padding-left:1rem;" value="${todayStr()}" min="${todayStr()}">
      </div>
      <div class="slots-container">
        <label class="slots-label">2. Horarios Disponibles</label>
        <div class="slots-grid" id="bk-slots"></div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" id="bk-confirm" disabled onclick="confirmBooking('${spaceId}')">
          <i data-lucide="check"></i> Confirmar Reserva
        </button>
      </div>
    </div>`);

  renderSlots(spaceId, todayStr());
  document.getElementById('bk-date').oninput = (e) => renderSlots(spaceId, e.target.value);
};

function renderSlots(spaceId, date) {
  const container = document.getElementById('bk-slots');
  if (!container) return;
  const taken = new Set(store.reservations.filter(r => r.spaceId === spaceId && r.date === date && r.status === 'active').map(r => r.timeSlot));

  window._selectedSlot = null;
  const confirmBtn = document.getElementById('bk-confirm');
  if (confirmBtn) confirmBtn.disabled = true;

  container.innerHTML = TIME_SLOTS.map(slot => {
    const busy = taken.has(slot);
    return `<button class="slot-btn" ${busy ? 'disabled' : ''} onclick="selectSlot(this,'${slot}')">
      <span>${slot}</span>
      <span class="slot-status-lbl">${busy ? 'Ocupado' : 'Disponible'}</span>
    </button>`;
  }).join('');
  lucide.createIcons();
}

window.selectSlot = function(btn, slot) {
  document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  window._selectedSlot = slot;
  const confirmBtn = document.getElementById('bk-confirm');
  if (confirmBtn) confirmBtn.disabled = false;
};

window.confirmBooking = function(spaceId) {
  const space = store.spaces.find(s => s.id === spaceId);
  const date  = document.getElementById('bk-date').value;
  const slot  = window._selectedSlot;
  if (!date || !slot) { toast('Completa todos los campos', 'Elige fecha y horario.', 'danger'); return; }

  // Verificación doble de colisión
  if (store.reservations.some(r => r.spaceId === spaceId && r.date === date && r.timeSlot === slot && r.status === 'active')) {
    toast('Horario Ocupado', 'Ese horario acaba de ser reservado.', 'danger');
    renderSlots(spaceId, date); return;
  }

  const newRes = { id: 'r' + Date.now(), userId: store.currentUser.email, spaceId, date, timeSlot: slot, status: 'active' };
  store.reservations.push(newRes);
  store.save('reservations');

  openModal('¡Reserva Confirmada!', `
    <div class="success-animation-card">
      <div class="success-circle"><i data-lucide="check"></i></div>
      <h3 class="success-title">¡Reserva Exitosa!</h3>
      <p class="success-text">Tu espacio ha sido bloqueado y guardado en memoria local.</p>
      <div class="booking-receipt">
        <div class="receipt-row"><span class="receipt-label">Código:</span><span class="receipt-value">${newRes.id}</span></div>
        <div class="receipt-row"><span class="receipt-label">Ambiente:</span><span class="receipt-value">${space.name}</span></div>
        <div class="receipt-row"><span class="receipt-label">Facultad:</span><span class="receipt-value">${space.faculty}</span></div>
        <div class="receipt-row"><span class="receipt-label">Fecha:</span><span class="receipt-value">${date}</span></div>
        <div class="receipt-row"><span class="receipt-label">Horario:</span><span class="receipt-value">${slot}</span></div>
      </div>
      <button class="btn btn-primary" style="width:100%;margin-top:1rem;" onclick="closeModal();window.location.hash='#bookings'">
        Ver Mis Reservas <i data-lucide="arrow-right"></i>
      </button>
    </div>`);

  toast('Reserva Registrada', `${space.name} reservado para el ${date}.`);
  renderCards(); // actualizar disponibilidad en el fondo
};

// ============================================================
// VISTA: MIS RESERVAS
// ============================================================
function renderBookings() {
  const myRes = store.reservations
    .filter(r => r.userId.toLowerCase() === store.currentUser.email.toLowerCase())
    .sort((a,b) => { if (a.status === 'active' && b.status !== 'active') return -1; if (b.status === 'active') return 1; return b.date.localeCompare(a.date); });

  document.getElementById('app').innerHTML = `
    <div class="section-header">
      <div class="section-title-wrapper">
        <h1 class="section-title">Mis Reservas</h1>
        <p class="section-subtitle">Gestiona tus reservas activas, cancela o califica espacios usados.</p>
      </div>
    </div>
    <div class="bookings-list" id="bookings-list"></div>`;

  const list = document.getElementById('bookings-list');
  if (!myRes.length) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-icon-box"><i data-lucide="calendar"></i></div>
      <h3 class="empty-title">Sin reservas</h3>
      <p class="empty-text">Aún no has realizado ninguna reserva.</p>
      <button class="btn btn-primary" onclick="window.location.hash='#explore'">Explorar Ambientes</button>
    </div>`;
    lucide.createIcons(); return;
  }

  list.innerHTML = myRes.map(res => {
    const sp = store.spaces.find(s => s.id === res.spaceId) || { name:'Ambiente eliminado', faculty:'N/A', type:'N/A' };
    const statusMap = { active:{cls:'status-active',txt:'Activa'}, cancelled:{cls:'status-cancelled',txt:'Cancelada'}, completed:{cls:'status-completed',txt:'Completada'} };
    const { cls, txt } = statusMap[res.status] || { cls:'status-active', txt:'Activa' };

    const dateObj = new Date(res.date + 'T00:00:00');
    const friendly = dateObj.toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'short' });

    let actions = '';
    if (res.status === 'active') {
      actions = `<button class="btn-cancel" onclick="askCancel('${res.id}')">Cancelar Reserva</button>`;
    } else if (res.status === 'completed') {
      const rated = store.ratings.some(r => r.spaceId === res.spaceId && r.userId === store.currentUser.email);
      actions = rated
        ? `<span style="font-size:0.8rem;color:var(--color-success);font-weight:700;">✓ Calificado</span>`
        : `<button class="btn-rate" onclick="openRating('${res.spaceId}')"><i data-lucide="star"></i> Calificar</button>`;
    }

    return `<div class="booking-item-card">
      <div class="booking-avatar-box"><i data-lucide="building"></i></div>
      <div class="booking-details-col">
        <h3 class="booking-space-name">${sp.name}</h3>
        <div class="booking-meta-row">
          <span><i data-lucide="tag"></i> ${sp.type}</span>
          <span><i data-lucide="compass"></i> ${sp.faculty}</span>
        </div>
      </div>
      <div class="booking-time-col">
        <span class="booking-date-txt">${friendly}</span>
        <span class="booking-hours-txt"><i data-lucide="clock"></i> ${res.timeSlot}</span>
      </div>
      <div class="booking-action-col">
        <span class="status-badge ${cls}">${txt}</span>
        ${actions}
      </div>
    </div>`;
  }).join('');
  lucide.createIcons();
}

window.askCancel = function(resId) {
  const res = store.reservations.find(r => r.id === resId);
  if (!res) return;
  const sp = store.spaces.find(s => s.id === res.spaceId) || { name: 'Ambiente' };
  openModal('Cancelar Reserva', `
    <div style="text-align:center;">
      <i data-lucide="alert-triangle" style="width:48px;height:48px;color:var(--color-danger);margin-bottom:1rem;"></i>
      <p style="font-size:1rem;font-weight:600;margin-bottom:1.5rem;">
        ¿Confirmas la cancelación de tu reserva en <strong>${sp.name}</strong>?<br>
        El espacio quedará disponible para otros estudiantes.
      </p>
      <div class="modal-actions" style="justify-content:center;border:none;padding:0;">
        <button class="btn btn-secondary" onclick="closeModal()">Mantener Reserva</button>
        <button class="btn btn-primary" style="background:var(--color-danger);" onclick="doCancel('${resId}')">Sí, Cancelar</button>
      </div>
    </div>`);
};

window.doCancel = function(resId) {
  const res = store.reservations.find(r => r.id === resId);
  if (!res) return;
  res.status = 'cancelled';
  store.save('reservations');
  closeModal();
  toast('Reserva Cancelada', 'El espacio fue liberado exitosamente.', 'warning');
  renderBookings();
};

// ============================================================
// CALIFICACIONES
// ============================================================
let _stars = 5;

window.openRating = function(spaceId) {
  const sp = store.spaces.find(s => s.id === spaceId);
  if (!sp) return;
  _stars = 5;

  openModal('Calificar Ambiente', `
    <div style="text-align:center;display:flex;flex-direction:column;gap:1rem;">
      <p style="font-size:1rem;color:var(--color-dark-light);font-weight:500;">
        Tu experiencia en:<br><strong>${sp.name}</strong>
      </p>
      <div class="rating-interactive" id="star-row">
        ${[1,2,3,4,5].map(i => `<span class="star-interactive ${i<=5?'active':''}" onclick="setStar(${i})">★</span>`).join('')}
      </div>
      <div class="form-group" style="text-align:left;">
        <label class="form-label">Comentario (opcional)</label>
        <textarea id="rt-comment" class="feedback-textarea" placeholder="Comparte tu experiencia..."></textarea>
      </div>
      <div class="modal-actions" style="border:none;padding-top:0;">
        <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="submitRating('${spaceId}')">Enviar Calificación</button>
      </div>
    </div>`);
  setStar(5);
};

window.setStar = function(n) {
  _stars = n;
  document.querySelectorAll('.star-interactive').forEach((s, i) => {
    s.classList.toggle('active', i < n);
    s.style.color = i < n ? 'var(--color-gold)' : 'var(--color-gray-border)';
  });
};

window.submitRating = function(spaceId) {
  const comment = document.getElementById('rt-comment').value.trim();
  store.ratings.push({ id: 'rat' + Date.now(), spaceId, userId: store.currentUser.email, stars: _stars, comment: comment || 'Sin comentarios.' });
  store.save('ratings');
  closeModal();
  toast('¡Gracias por tu calificación!', 'Tu opinión quedó guardada.', 'success');
  renderBookings();
};

// ============================================================
// VISTA: ADMIN — PANEL
// ============================================================
function renderAdmin() {
  const total   = store.reservations.length;
  const active  = store.reservations.filter(r => r.status === 'active').length;
  const rate    = store.spaces.length ? Math.round(active / (store.spaces.length * TIME_SLOTS.length) * 100) : 0;
  const avgRat  = store.ratings.length ? (store.ratings.reduce((s,r) => s + r.stars, 0) / store.ratings.length).toFixed(1) : '0.0';

  document.getElementById('app').innerHTML = `
    <div class="section-header">
      <div class="section-title-wrapper">
        <h1 class="section-title">Panel de Administración</h1>
        <p class="section-subtitle">Gestión de ambientes, métricas y auditoría del sistema.</p>
      </div>
    </div>

    <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);">
      <div class="stat-card stat-primary">
        <div class="stat-icon-box"><i data-lucide="book-open"></i></div>
        <div class="stat-info-box"><span class="stat-value">${store.spaces.length}</span><span class="stat-label">Ambientes</span></div>
      </div>
      <div class="stat-card stat-success">
        <div class="stat-icon-box"><i data-lucide="calendar"></i></div>
        <div class="stat-info-box"><span class="stat-value">${total}</span><span class="stat-label">Reservas Totales</span></div>
      </div>
      <div class="stat-card stat-gold">
        <div class="stat-icon-box"><i data-lucide="pie-chart"></i></div>
        <div class="stat-info-box"><span class="stat-value">${rate}%</span><span class="stat-label">Ocupación</span></div>
      </div>
      <div class="stat-card stat-primary" style="border-color:rgba(212,175,55,0.25)">
        <div class="stat-icon-box" style="background:var(--color-warning-bg);color:var(--color-gold);"><i data-lucide="star"></i></div>
        <div class="stat-info-box"><span class="stat-value">${avgRat}</span><span class="stat-label">Puntaje Promedio</span></div>
      </div>
    </div>

    <div class="admin-grid">
      <div class="admin-section-card">
        <div class="card-header-row">
          <h2 class="card-title">Ambientes Registrados</h2>
          <button class="btn btn-primary" onclick="openCreateModal()">
            <i data-lucide="plus"></i> Nuevo Ambiente
          </button>
        </div>
        <div class="table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Ambiente</th><th>Tipo</th><th>Capacidad</th><th>Puntaje</th><th>Equipamiento</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody id="admin-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>`;

  lucide.createIcons();
  renderAdminTable();
}

function renderAdminTable() {
  const tbody = document.getElementById('admin-tbody');
  if (!tbody) return;
  tbody.innerHTML = store.spaces.map(s => {
    const st = store.spaceStats(s.id);
    return `<tr>
      <td>
        <div class="table-space-cell">
          <div class="table-space-icon"><i data-lucide="building"></i></div>
          <div class="table-space-details">
            <span class="table-space-name">${s.name}</span>
            <span class="table-space-fac">${s.faculty}</span>
          </div>
        </div>
      </td>
      <td><span style="font-weight:700;color:var(--color-primary)">${s.type}</span></td>
      <td><strong>${s.capacity} pers.</strong></td>
      <td>
        <div style="display:flex;align-items:center;gap:4px;font-weight:700;">
          <i data-lucide="star" style="width:14px;height:14px;fill:var(--color-gold);color:var(--color-gold);"></i>
          ${st.avg.toFixed(1)} <span style="font-size:0.75rem;color:var(--color-dark-light);">(${st.count})</span>
        </div>
      </td>
      <td><div style="display:flex;flex-wrap:wrap;gap:4px;">${s.features.map(f => `<span style="font-size:0.75rem;background:var(--color-gray-bg);padding:2px 6px;border-radius:4px;">${f}</span>`).join('')}</div></td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon btn-edit" onclick="openEditModal('${s.id}')"><i data-lucide="edit-3"></i></button>
          <button class="btn-icon btn-delete" onclick="askDelete('${s.id}')"><i data-lucide="trash-2"></i></button>
        </div>
      </td>
    </tr>`;
  }).join('');
  lucide.createIcons();
}

// ============================================================
// CRUD AMBIENTES
// ============================================================
function spaceFormHtml(s = {}) {
  const hasImg   = s.imageUrl && (s.imageUrl.startsWith('data:image') || s.imageUrl.startsWith('Imagenes/'));
  const previewHtml = hasImg
    ? `<div style="margin-top:8px;border-radius:8px;overflow:hidden;max-height:120px;border:1.5px solid var(--color-gray-border);">
         <img src="${s.imageUrl}" alt="Vista previa" style="width:100%;max-height:120px;object-fit:cover;" onerror="this.parentElement.style.display='none'">
       </div>
       <span style="font-size:0.8rem;color:var(--color-success);font-weight:600;display:block;margin-top:4px;">✓ Imagen actual guardada. Sube una nueva para reemplazarla.</span>`
    : '';
  return `
    <div class="form-group">
      <label class="form-label">Nombre del Ambiente</label>
      <input id="cf-name" type="text" class="form-input" style="padding-left:1rem;" placeholder="Ej: Cubículo 201 - FIIS" value="${s.name||''}" required>
    </div>
    <div class="form-grid-2">
      <div class="form-group">
        <label class="form-label">Facultad</label>
        <select id="cf-faculty" class="filter-select" style="width:100%;">
          ${['FIIS','FIM','FIC','FIEE','FC'].map(f => `<option value="${f}" ${s.faculty===f?'selected':''}>${f}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Tipo de Espacio</label>
        <select id="cf-type" class="filter-select" style="width:100%;">
          ${['Cubículo','Laboratorio','Aula'].map(t => `<option value="${t}" ${s.type===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-grid-2">
      <div class="form-group">
        <label class="form-label">Capacidad (personas)</label>
        <input id="cf-capacity" type="number" class="form-input" style="padding-left:1rem;" min="1" value="${s.capacity||''}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Icono (si no sube imagen)</label>
        <select id="cf-icon" class="filter-select" style="width:100%;">
          <option value="book-open" ${!hasImg&&s.imageUrl==='book-open'?'selected':''}>Libro (Cubículo)</option>
          <option value="monitor"   ${!hasImg&&s.imageUrl==='monitor'?'selected':''}>PC (Laboratorio)</option>
          <option value="users"     ${!hasImg&&s.imageUrl==='users'?'selected':''}>Personas (Aula)</option>
          <option value="server"    ${!hasImg&&s.imageUrl==='server'?'selected':''}>Servidor (Redes)</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Subir Imagen del Ambiente (opcional)</label>
      <input id="cf-file" type="file" class="form-input" accept="image/*" style="padding:0.5rem 1rem;">
      ${previewHtml}
    </div>
    <div class="form-group">
      <label class="form-label">Equipamiento (separado por comas)</label>
      <input id="cf-features" type="text" class="form-input" style="padding-left:1rem;" placeholder="Pizarra, Proyector, Enchufes" value="${(s.features||[]).join(', ')}" required>
    </div>`;
}

function collectFormData(keepOldImage) {
  return new Promise((resolve) => {
    const name     = document.getElementById('cf-name').value.trim();
    const faculty  = document.getElementById('cf-faculty').value;
    const type     = document.getElementById('cf-type').value;
    const capacity = parseInt(document.getElementById('cf-capacity').value);
    const icon     = document.getElementById('cf-icon').value;
    const features = document.getElementById('cf-features').value.split(',').map(f => f.trim()).filter(Boolean);
    const file     = document.getElementById('cf-file').files[0];

    if (!name || !capacity) { toast('Datos incompletos', 'Completa nombre y capacidad.', 'danger'); resolve(null); return; }

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ name, faculty, type, capacity, features, imageUrl: e.target.result });
      reader.readAsDataURL(file);
    } else {
      resolve({ name, faculty, type, capacity, features, imageUrl: keepOldImage || icon });
    }
  });
}

window.openCreateModal = function() {
  openModal('Registrar Nuevo Ambiente', `
    <form id="create-form" class="crud-form">
      ${spaceFormHtml()}
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary"><i data-lucide="save"></i> Guardar Ambiente</button>
      </div>
    </form>`);

  document.getElementById('create-form').onsubmit = async (e) => {
    e.preventDefault();
    const data = await collectFormData(null);
    if (!data) return;
    store.spaces.push({ id: 's' + Date.now(), ...data });
    store.save('spaces');
    closeModal();
    toast('Ambiente creado', `"${data.name}" fue registrado exitosamente.`);
    renderAdmin();
  };
};

window.openEditModal = function(spaceId) {
  const space = store.spaces.find(s => s.id === spaceId);
  if (!space) return;

  openModal('Editar Ambiente', `
    <form id="edit-form" class="crud-form">
      ${spaceFormHtml(space)}
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary"><i data-lucide="save"></i> Guardar Cambios</button>
      </div>
    </form>`);

  document.getElementById('edit-form').onsubmit = async (e) => {
    e.preventDefault();
    const data = await collectFormData(space.imageUrl);
    if (!data) return;
    Object.assign(space, data);
    store.save('spaces');
    closeModal();
    toast('Cambios guardados', `"${space.name}"`);
    renderAdmin();
  };
};

window.askDelete = function(spaceId) {
  const sp = store.spaces.find(s => s.id === spaceId);
  if (!sp) return;
  openModal('Eliminar Ambiente', `
    <div style="text-align:center;">
      <i data-lucide="alert-triangle" style="width:48px;height:48px;color:var(--color-danger);margin-bottom:1rem;"></i>
      <p style="font-size:1rem;font-weight:600;margin-bottom:1.5rem;">
        ¿Eliminar permanentemente "<strong>${sp.name}</strong>"?<br>
        También se eliminarán sus reservas y calificaciones.
      </p>
      <div class="modal-actions" style="justify-content:center;border:none;padding:0;">
        <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" style="background:var(--color-danger);" onclick="doDelete('${spaceId}')">Eliminar</button>
      </div>
    </div>`);
};

window.doDelete = function(spaceId) {
  store.spaces       = store.spaces.filter(s => s.id !== spaceId);
  store.reservations = store.reservations.filter(r => r.spaceId !== spaceId);
  store.ratings      = store.ratings.filter(r => r.spaceId !== spaceId);
  store.save('spaces'); store.save('reservations'); store.save('ratings');
  closeModal();
  toast('Ambiente eliminado', 'Los datos fueron borrados.', 'warning');
  renderAdmin();
};

// ============================================================
// VISTA: REPORTES
// ============================================================
function renderReports() {
  document.getElementById('app').innerHTML = `
    <div class="section-header">
      <div class="section-title-wrapper">
        <h1 class="section-title">Reportes e Historial</h1>
        <p class="section-subtitle">Auditoría completa de todas las reservas del sistema.</p>
      </div>
    </div>

    <div class="reports-filter-bar">
      <div class="reports-inputs">
        <div class="search-box" style="min-width:250px;">
          <input type="text" id="rp-search" class="search-input" placeholder="Buscar por usuario, ambiente...">
          <i data-lucide="search"></i>
        </div>
        <select id="rp-status" class="filter-select">
          <option value="">Todos los Estados</option>
          <option value="active">Activas</option>
          <option value="completed">Completadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
      </div>
      <div class="reports-actions">
        <button class="btn btn-secondary" onclick="window.print()"><i data-lucide="printer"></i> Imprimir</button>
      </div>
    </div>

    <div class="admin-section-card" style="padding:1.5rem;">
      <div class="table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th><th>Estudiante</th><th>Ambiente</th><th>Facultad</th><th>Fecha</th><th>Horario</th><th>Estado</th>
            </tr>
          </thead>
          <tbody id="rp-tbody"></tbody>
        </table>
      </div>
    </div>`;

  lucide.createIcons();
  renderReportTable();
  document.getElementById('rp-search').oninput = renderReportTable;
  document.getElementById('rp-status').onchange = renderReportTable;
}

function renderReportTable() {
  const tbody  = document.getElementById('rp-tbody');
  const search = document.getElementById('rp-search').value.toLowerCase();
  const status = document.getElementById('rp-status').value;
  if (!tbody) return;

  let rows = [...store.reservations].reverse().filter(res => {
    const sp   = store.spaces.find(s => s.id === res.spaceId) || { name:'Eliminado', faculty:'N/A' };
    const user = store.users.find(u => u.email.toLowerCase() === res.userId.toLowerCase()) || { name:'Usuario' };
    const matchQ = !search || res.userId.toLowerCase().includes(search) || user.name.toLowerCase().includes(search) || sp.name.toLowerCase().includes(search);
    const matchS = !status || res.status === status;
    return matchQ && matchS;
  });

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--color-dark-light);">Sin registros para los filtros seleccionados.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(res => {
    const sp   = store.spaces.find(s => s.id === res.spaceId) || { name:'Eliminado', faculty:'N/A' };
    const user = store.users.find(u => u.email.toLowerCase() === res.userId.toLowerCase()) || { name:'Usuario' };
    const stMap = { active:{cls:'status-active',txt:'Activa'}, cancelled:{cls:'status-cancelled',txt:'Cancelada'}, completed:{cls:'status-completed',txt:'Completada'} };
    const { cls, txt } = stMap[res.status] || { cls:'status-active', txt:'Activa' };
    return `<tr>
      <td><code style="font-size:0.8rem;color:var(--color-primary);font-weight:700;">${res.id}</code></td>
      <td><div style="display:flex;flex-direction:column;"><span style="font-weight:700;">${user.name}</span><span style="font-size:0.75rem;color:var(--color-dark-light);">${res.userId}</span></div></td>
      <td><strong>${sp.name}</strong></td>
      <td><span style="font-size:0.8rem;background:var(--color-primary-light);color:var(--color-primary);font-weight:700;padding:2px 8px;border-radius:4px;">${sp.faculty}</span></td>
      <td>${res.date}</td>
      <td><strong>${res.timeSlot}</strong></td>
      <td><span class="status-badge ${cls}">${txt}</span></td>
    </tr>`;
  }).join('');
}

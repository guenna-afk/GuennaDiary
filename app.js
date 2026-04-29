/* ═══════════════════════════════════════════
   GUENNA AGENDA — JAVASCRIPT
═══════════════════════════════════════════ */

'use strict';

// ── STORAGE KEY ─────────────────────────────
const KEY = 'guenna_agenda_v1';

// ── STATE ───────────────────────────────────
let state = loadState();
let selectedDate = todayStr(); // "YYYY-MM-DD"
let calYear, calMonth;

function defaultState() {
  return {
    todayTasks: [],     // [{ id, name, time?, done }]
    backlog: [],        // [{ id, name, priority, done, note? }]
    calEvents: {},      // { "YYYY-MM-DD": [{ id, name, time? }] }
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
  } catch { return defaultState(); }
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function todayStr() {
  const d = new Date();
  return ymd(d.getFullYear(), d.getMonth(), d.getDate());
}

function ymd(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// ── MONTHS / WEEKDAYS ───────────────────────
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const DAYS_ES = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

// ── INIT ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  calYear  = now.getFullYear();
  calMonth = now.getMonth();

  startClock();
  renderTodayMeta();
  renderCalendar();
  renderTodayTasks();
  renderBacklog();
  setupButtons();
  setupFilters();
  setupModal();
});

// ── CLOCK ───────────────────────────────────
function startClock() {
  function tick() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2,'0');
    const m = String(now.getMinutes()).padStart(2,'0');
    const s = String(now.getSeconds()).padStart(2,'0');
    document.getElementById('clock').textContent = `${h}:${m}:${s}`;
  }
  tick();
  setInterval(tick, 1000);
}

// ── TODAY META ──────────────────────────────
function renderTodayMeta() {
  const now = new Date();
  const dayNum   = now.getDate();
  const weekday  = DAYS_ES[((now.getDay() + 6) % 7)];
  const monthYear= MONTHS_ES[now.getMonth()].toUpperCase() + ' ' + now.getFullYear();

  document.getElementById('todayDayNum').textContent  = dayNum;
  document.getElementById('todayWeekday').textContent  = weekday.toUpperCase();
  document.getElementById('todayMonthYear').textContent = monthYear;
  document.getElementById('todayLabel').textContent = weekday + ', ' + dayNum + ' de ' + MONTHS_ES[now.getMonth()];
}

// ── CALENDAR ────────────────────────────────
function renderCalendar() {
  document.getElementById('calTitle').textContent =
    MONTHS_ES[calMonth].toUpperCase() + ' ' + calYear;

  const container = document.getElementById('calDays');
  container.innerHTML = '';

  // First day of month (Monday=0)
  const firstDay = new Date(calYear, calMonth, 1);
  const startDow = (firstDay.getDay() + 6) % 7; // Mon=0

  const daysInMon = new Date(calYear, calMonth + 1, 0).getDate();
  const prevDays  = new Date(calYear, calMonth, 0).getDate();
  const today     = todayStr();

  let cells = [];

  // Prev month
  for (let i = startDow - 1; i >= 0; i--) {
    cells.push({ day: prevDays - i, type: 'other-month', date: null });
  }

  // Current month
  for (let d = 1; d <= daysInMon; d++) {
    const dateStr = ymd(calYear, calMonth, d);
    cells.push({ day: d, type: 'current', date: dateStr });
  }

  // Fill remaining rows
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    cells.push({ day: i, type: 'other-month', date: null });
  }

  cells.forEach(cell => {
    const div = document.createElement('div');
    div.className = 'cal-day';
    div.textContent = cell.day;

    if (cell.type === 'other-month') {
      div.classList.add('other-month');
    } else {
      if (cell.date === today) div.classList.add('today');
      if (cell.date === selectedDate) div.classList.add('selected');
      if (state.calEvents[cell.date]?.length) div.classList.add('has-event');

      div.addEventListener('click', () => {
        selectedDate = cell.date;
        renderCalendar();
        renderSelectedDay();
      });
    }

    container.appendChild(div);
  });

  renderSelectedDay();
}

function renderSelectedDay() {
  const parts = selectedDate.split('-');
  const d = parseInt(parts[2]);
  const m = parseInt(parts[1]) - 1;
  const y = parseInt(parts[0]);
  const dayName = DAYS_ES[((new Date(y, m, d).getDay() + 6) % 7)];
  document.getElementById('selDayLabel').textContent =
    dayName.toUpperCase() + ' ' + d + ' DE ' + MONTHS_ES[m].toUpperCase();

  const list = document.getElementById('calEvents');
  list.innerHTML = '';
  const events = state.calEvents[selectedDate] || [];

  if (!events.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">◻</div>Sin eventos</div>';
    return;
  }

  events.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  events.forEach(ev => {
    const item = document.createElement('div');
    item.className = 'cal-event-item';
    item.innerHTML = `
      <span class="cal-event-time">${ev.time || '—'}</span>
      <span class="cal-event-name">${esc(ev.name)}</span>
      <button class="delete-small" data-id="${ev.id}">×</button>
    `;
    item.querySelector('.delete-small').onclick = () => {
      state.calEvents[selectedDate] = (state.calEvents[selectedDate] || [])
        .filter(e => e.id !== ev.id);
      save();
      renderCalendar();
    };
    list.appendChild(item);
  });
}

// ── TODAY TASKS ─────────────────────────────
function renderTodayTasks() {
  const list = document.getElementById('todayTasksList');
  list.innerHTML = '';

  if (!state.todayTasks.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">◻</div>Sin tareas para hoy</div>';
    return;
  }

  // Sort: undone first, then by time
  const sorted = [...state.todayTasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return (a.time || '99:99').localeCompare(b.time || '99:99');
  });

  sorted.forEach(task => {
    const item = document.createElement('div');
    item.className = 'task-item' + (task.done ? ' done' : '');
    item.innerHTML = `
      <input type="checkbox" class="task-check" ${task.done ? 'checked' : ''} data-id="${task.id}">
      <div class="task-body">
        <span class="task-name">${esc(task.name)}</span>
        <div class="task-meta">
          ${task.time ? `<span class="task-time">${task.time}</span>` : ''}
        </div>
      </div>
      <button class="task-delete" data-id="${task.id}">×</button>
    `;

    item.querySelector('.task-check').onchange = (e) => {
      const t = state.todayTasks.find(t => t.id === e.target.dataset.id);
      if (t) { t.done = e.target.checked; save(); renderTodayTasks(); }
    };

    item.querySelector('.task-delete').onclick = (e) => {
      state.todayTasks = state.todayTasks.filter(t => t.id !== e.target.dataset.id);
      save(); renderTodayTasks();
    };

    list.appendChild(item);
  });
}

// ── BACKLOG ─────────────────────────────────
let activeFilter = 'all';

function renderBacklog() {
  const list = document.getElementById('backlogList');
  list.innerHTML = '';

  let items = [...state.backlog];
  if (activeFilter !== 'all') items = items.filter(t => t.priority === activeFilter);

  if (!items.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">◻</div>Sin pendientes</div>';
    return;
  }

  const prioOrder = { alta: 0, media: 1, baja: 2, '': 3 };
  items.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return (prioOrder[a.priority] ?? 3) - (prioOrder[b.priority] ?? 3);
  });

  items.forEach(task => {
    const item = document.createElement('div');
    item.className = 'task-item' + (task.done ? ' done' : '');
    item.innerHTML = `
      <input type="checkbox" class="task-check" ${task.done ? 'checked' : ''} data-id="${task.id}">
      <div class="task-body">
        <span class="task-name">${esc(task.name)}</span>
        <div class="task-meta">
          ${task.priority ? `<span class="task-prio prio-${task.priority}">${task.priority}</span>` : ''}
          ${task.note ? `<span class="task-time">${esc(task.note)}</span>` : ''}
        </div>
      </div>
      <button class="task-delete" data-id="${task.id}">×</button>
    `;

    item.querySelector('.task-check').onchange = (e) => {
      const t = state.backlog.find(t => t.id === e.target.dataset.id);
      if (t) { t.done = e.target.checked; save(); renderBacklog(); }
    };

    item.querySelector('.task-delete').onclick = (e) => {
      state.backlog = state.backlog.filter(t => t.id !== e.target.dataset.id);
      save(); renderBacklog();
    };

    list.appendChild(item);
  });
}

function setupFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderBacklog();
    });
  });
}

// ── BUTTONS ─────────────────────────────────
function setupButtons() {
  // Calendar prev/next
  document.getElementById('prevMonth').onclick = () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar();
  };

  document.getElementById('nextMonth').onclick = () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
  };

  // Add cal event
  document.getElementById('addCalEvent').onclick = () => {
    openModal('NUEVO EVENTO', [
      { name: 'name', label: 'Evento', type: 'text', placeholder: 'Nombre del evento' },
      { name: 'time', label: 'Hora (opcional)', type: 'time' },
    ], fields => {
      if (!fields.name.trim()) return;
      if (!state.calEvents[selectedDate]) state.calEvents[selectedDate] = [];
      state.calEvents[selectedDate].push({
        id: uid(),
        name: fields.name.trim(),
        time: fields.time || null,
      });
      save();
      renderCalendar();
    });
  };

  // Add today task
  document.getElementById('addTodayTask').onclick = () => {
    openModal('TAREA DE HOY', [
      { name: 'name', label: 'Tarea', type: 'text', placeholder: 'Describe la tarea...' },
      { name: 'time', label: 'Hora (opcional)', type: 'time' },
    ], fields => {
      if (!fields.name.trim()) return;
      state.todayTasks.push({
        id: uid(),
        name: fields.name.trim(),
        time: fields.time || null,
        done: false,
      });
      save();
      renderTodayTasks();
    });
  };

  // Add backlog task
  document.getElementById('addBacklogTask').onclick = () => {
    openModal('NUEVO PENDIENTE', [
      { name: 'name', label: 'Tarea', type: 'text', placeholder: 'Describe la tarea...' },
      { name: 'priority', label: 'Prioridad', type: 'select',
        options: [{ v: '', l: 'Sin prioridad' }, { v: 'alta', l: 'Alta' }, { v: 'media', l: 'Media' }, { v: 'baja', l: 'Baja' }] },
      { name: 'note', label: 'Nota (opcional)', type: 'text', placeholder: 'Contexto, link, etc.' },
    ], fields => {
      if (!fields.name.trim()) return;
      state.backlog.push({
        id: uid(),
        name: fields.name.trim(),
        priority: fields.priority || '',
        note: fields.note?.trim() || '',
        done: false,
      });
      save();
      renderBacklog();
    });
  };
}

// ── MODAL ───────────────────────────────────
let _cb = null;

function openModal(title, fields, cb) {
  _cb = cb;
  document.getElementById('modalTitle').textContent = title;
  const container = document.getElementById('modalFields');
  container.innerHTML = '';

  fields.forEach(f => {
    const wrap = document.createElement('div');
    wrap.className = 'm-field';
    const lbl = document.createElement('label');
    lbl.textContent = f.label;
    wrap.appendChild(lbl);

    if (f.type === 'select') {
      const sel = document.createElement('select');
      sel.name = f.name;
      f.options.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.v; opt.textContent = o.l;
        sel.appendChild(opt);
      });
      wrap.appendChild(sel);
    } else {
      const inp = document.createElement('input');
      inp.type = f.type;
      inp.name = f.name;
      inp.placeholder = f.placeholder || '';
      wrap.appendChild(inp);
    }

    container.appendChild(wrap);
  });

  document.getElementById('modal').classList.remove('hidden');
  setTimeout(() => container.querySelector('input, select')?.focus(), 50);
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  _cb = null;
}

function setupModal() {
  document.getElementById('modalClose').onclick  = closeModal;
  document.getElementById('modalCancel').onclick = closeModal;

  document.getElementById('modal').onclick = (e) => {
    if (e.target === document.getElementById('modal')) closeModal();
  };

  document.getElementById('modalSave').onclick = () => {
    if (!_cb) return;
    const fields = {};
    document.querySelectorAll('#modalFields input, #modalFields select, #modalFields textarea')
      .forEach(el => { fields[el.name] = el.value; });
    _cb(fields);
    closeModal();
  };

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Enter' && !document.getElementById('modal').classList.contains('hidden')) {
      const active = document.activeElement;
      if (active?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        document.getElementById('modalSave').click();
      }
    }
  });
}

// ── UTILS ───────────────────────────────────
function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

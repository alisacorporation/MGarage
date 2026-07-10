/**
 * MGarage — ui.js
 * All page rendering, forms, modals and toasts.
 */

const $app = () => document.getElementById('app');
const $modalRoot = () => document.getElementById('modalRoot');

const money = (n) => Math.round(n || 0).toLocaleString('de-DE') + ' €';
const fmtDate = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
};
const todayISO = () => new Date().toISOString().slice(0, 10);

const WORK_PRESETS = [
  { name: 'Диагностика', price: 25 },
  { name: 'Замена', price: 0 },
  { name: 'Снятие панели', price: 0 },
  { name: 'Установка', price: 0 },
  { name: 'Ремонт', price: 0 },
  { name: 'Покраска', price: 0 },
];

const genId = () => 'wi_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);

function getJobWorkItems(job) {
  if (Array.isArray(job.workItems) && job.workItems.length) {
    return job.workItems;
  }
  // legacy migration from old checkReplace/checkDiagnostics booleans
  const items = [];
  if (job.checkDiagnostics) items.push({ id: genId(), name: 'Диагностика', price: 25 });
  if (job.checkReplace) items.push({ id: genId(), name: 'Замена', price: 0 });
  return items;
}

function sumWorkItems(items) {
  return items.reduce((s, i) => s + (Number(i.price) || 0), 0);
}

function toast(message, type = 'success') {
  const root = document.getElementById('toast-root');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(-10px)';
    el.style.transition = 'all .25s ease';
    setTimeout(() => el.remove(), 260);
  }, 2200);
}

function closeModal() {
  $modalRoot().innerHTML = '';
}

function openModal(html, { center = false } = {}) {
  $modalRoot().innerHTML = `
    <div class="modal-overlay" id="modalOverlay">
      <div class="modal-sheet ${center ? 'modal-center' : ''}">
        <div class="modal-handle"></div>
        ${html}
      </div>
    </div>`;
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'modalOverlay') closeModal();
  });
}

// ---------------------------------------------------------
// Router
// ---------------------------------------------------------

const Router = {
  current: 'home',
  async navigate(route) {
    Router.current = route;
    document.querySelectorAll('.nav-item').forEach((el) => {
      el.classList.toggle('active', el.dataset.route === route);
    });
    $app().scrollTop = 0;
    window.scrollTo(0, 0);
    switch (route) {
      case 'home': return renderHome();
      case 'history': return renderHistory();
      case 'new': return renderJobForm();
      case 'stats': return renderStats();
      case 'backup': return renderBackup();
      default: return renderHome();
    }
  },
};

// ---------------------------------------------------------
// Home
// ---------------------------------------------------------

async function renderHome() {
  const jobs = await DB.getAll(DB.STORES.jobs);
  const cars = await DB.getAll(DB.STORES.cars);

  const today = todayISO();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 6 * 86400000).toISOString().slice(0, 10);
  const monthStr = today.slice(0, 7);

  const sum = (arr, f) => arr.reduce((s, j) => s + (Number(j[f]) || 0), 0);

  const todayJobs = jobs.filter((j) => j.date === today);
  const weekJobs = jobs.filter((j) => j.date >= weekAgo);
  const monthJobs = jobs.filter((j) => (j.date || '').startsWith(monthStr));

  const totalRevenue = sum(jobs, 'cost');
  const totalProfit = sum(jobs, 'cost') - sum(jobs, 'expenses');

  const recent = Search.sortJobsByDateDesc(jobs).slice(0, 6);

  $app().innerHTML = `
    <h1 class="page-title">Главная</h1>
    <div class="page-sub">Обзор мастерской</div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Сегодня</div>
        <div class="kpi-value accent">${money(sum(todayJobs, 'cost'))}</div>
        <div class="kpi-delta">${todayJobs.length} работ</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Неделя</div>
        <div class="kpi-value">${money(sum(weekJobs, 'cost'))}</div>
        <div class="kpi-delta">${weekJobs.length} работ</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Месяц</div>
        <div class="kpi-value">${money(sum(monthJobs, 'cost'))}</div>
        <div class="kpi-delta">${monthJobs.length} работ</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Машин в базе</div>
        <div class="kpi-value">${cars.length}</div>
        <div class="kpi-delta">всего в гараже</div>
      </div>
    </div>

    <div class="section-label">Итого</div>
    <div class="card">
      <div class="flex-between">
        <div>
          <div class="kpi-label">Общий доход</div>
          <div class="kpi-value accent" style="margin-top:8px">${money(totalRevenue)}</div>
        </div>
        <div style="text-align:right">
          <div class="kpi-label">Общая прибыль</div>
          <div class="kpi-value" style="margin-top:8px">${money(totalProfit)}</div>
        </div>
      </div>
    </div>

    <div class="section-label">Последние работы</div>
    <div id="recentJobs"></div>
  `;

  const recentRoot = document.getElementById('recentJobs');
  if (recent.length === 0) {
    recentRoot.innerHTML = emptyStateHTML('Пока нет записей', 'Добавьте первую работу через кнопку «+»');
  } else {
    recentRoot.innerHTML = recent.map(jobCardHTML).join('');
    attachJobCardHandlers(recentRoot);
  }
}

function emptyStateHTML(title, sub) {
  return `
    <div class="empty-state">
      <svg viewBox="0 0 24 24"><path d="M4 12l1.5-6h13L20 12M4 12v6a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h10v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-6M4 12h16M7 15h.01M17 15h.01"/></svg>
      <div class="empty-state-title">${title}</div>
      <div class="empty-state-sub">${sub}</div>
    </div>`;
}

function jobCardHTML(job) {
  const profit = (Number(job.cost) || 0) - (Number(job.expenses) || 0);
  const initials = (job.brand || '?').slice(0, 2).toUpperCase();
  return `
    <div class="job-card" data-job-id="${job.id}">
      <div class="job-thumb">${job.thumb ? `<img src="${job.thumb}" alt="">` : initials}</div>
      <div class="job-info">
        <div class="job-title">${escapeHTML(job.brand || 'Без марки')} ${escapeHTML(job.model || '')}</div>
        <div class="job-meta">${escapeHTML(job.plate || job.vin || 'Без номера')} · ${escapeHTML(job.client || 'Без клиента')}</div>
        <div class="job-date">${fmtDate(job.date)}</div>
      </div>
      <div class="job-price">
        <div class="job-cost">${money(job.cost)}</div>
        <div class="job-profit ${profit < 0 ? 'neg' : ''}">${profit >= 0 ? '+' : ''}${money(profit)}</div>
      </div>
    </div>`;
}

function attachJobCardHandlers(root) {
  root.querySelectorAll('.job-card').forEach((el) => {
    el.addEventListener('click', () => openJobDetail(Number(el.dataset.jobId)));
  });
}

function escapeHTML(s) {
  return (s || '').toString().replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// ---------------------------------------------------------
// History
// ---------------------------------------------------------

let historyState = { query: '', brandFilter: '' };

async function renderHistory() {
  const jobs = Search.sortJobsByDateDesc(await DB.getAll(DB.STORES.jobs));
  const brands = Search.uniqueValues(jobs, 'brand');

  $app().innerHTML = `
    <h1 class="page-title">История</h1>
    <div class="page-sub">${jobs.length} записей в журнале</div>

    <div class="search-bar">
      <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      <input type="text" id="searchInput" placeholder="Марка, номер, VIN, клиент..." value="${escapeHTML(historyState.query)}" />
    </div>

    <div class="filter-chips" id="brandChips">
      <div class="chip ${historyState.brandFilter === '' ? 'active' : ''}" data-brand="">Все марки</div>
      ${brands.map((b) => `<div class="chip ${historyState.brandFilter === b ? 'active' : ''}" data-brand="${escapeHTML(b)}">${escapeHTML(b)}</div>`).join('')}
    </div>

    <div id="jobList" style="margin-top:14px"></div>
  `;

  const listRoot = document.getElementById('jobList');

  function refreshList() {
    let filtered = Search.searchJobs(jobs, historyState.query);
    filtered = Search.filterJobsByField(filtered, 'brand', historyState.brandFilter);
    if (filtered.length === 0) {
      listRoot.innerHTML = emptyStateHTML('Ничего не найдено', 'Попробуйте изменить поиск или фильтр');
    } else {
      listRoot.innerHTML = filtered.map(jobCardHTML).join('');
      attachJobCardHandlers(listRoot);
    }
  }

  document.getElementById('searchInput').addEventListener('input', (e) => {
    historyState.query = e.target.value;
    refreshList();
  });

  document.getElementById('brandChips').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    historyState.brandFilter = chip.dataset.brand;
    document.querySelectorAll('#brandChips .chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    refreshList();
  });

  refreshList();
}

// ---------------------------------------------------------
// Job detail modal
// ---------------------------------------------------------

async function openJobDetail(jobId) {
  const job = await DB.get(DB.STORES.jobs, jobId);
  if (!job) return;
  const photos = await DB.getPhotosByJob(jobId);
  const before = photos.find((p) => p.type === 'before');
  const after = photos.find((p) => p.type === 'after');
  const profit = (Number(job.cost) || 0) - (Number(job.expenses) || 0);
  const items = getJobWorkItems(job);

  openModal(`
    <div class="modal-title">${escapeHTML(job.brand)} ${escapeHTML(job.model)}</div>
    <div class="text-dim" style="font-size:13px;margin-bottom:14px">${fmtDate(job.date)} · ${escapeHTML(job.generation || '')} ${escapeHTML(job.body || '')}</div>

    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-label">Стоимость</div><div class="kpi-value accent">${money(job.cost)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Прибыль</div><div class="kpi-value ${profit < 0 ? 'accent-red' : ''}">${money(profit)}</div></div>
    </div>

    <div class="divider"></div>

    <div class="stat-list">
      <div class="stat-row"><span class="stat-row-label">VIN</span><span class="stat-row-value">${escapeHTML(job.vin || '—')}</span></div>
      <div class="stat-row"><span class="stat-row-label">Госномер</span><span class="stat-row-value">${escapeHTML(job.plate || '—')}</span></div>
      <div class="stat-row"><span class="stat-row-label">Пробег</span><span class="stat-row-value">${job.mileage ? job.mileage + ' км' : '—'}</span></div>
      <div class="stat-row"><span class="stat-row-label">Клиент</span><span class="stat-row-value">${escapeHTML(job.client || '—')}</span></div>
      <div class="stat-row"><span class="stat-row-label">Телефон</span><span class="stat-row-value">${escapeHTML(job.phone || '—')}</span></div>
      <div class="stat-row"><span class="stat-row-label">Расходы</span><span class="stat-row-value">${money(job.expenses)}</span></div>
    </div>

    ${items.length ? `
      <div class="section-label">Выполненные работы</div>
      <div class="stat-list">
        ${items.map((i) => `<div class="stat-row"><span class="stat-row-label">${escapeHTML(i.name || 'Без названия')}</span><span class="stat-row-value">${money(i.price)}</span></div>`).join('')}
      </div>
    ` : ''}

    ${job.description ? `<div class="divider"></div><div class="text-dim" style="font-size:13.5px;line-height:1.5">${escapeHTML(job.description)}</div>` : ''}

    ${(before || after) ? `
      <div class="section-label">Фото</div>
      <div class="photo-compare">
        <div class="photo-compare-item">${before ? `<img src="${before.data}"><span class="tag">До</span>` : ''}</div>
        <div class="photo-compare-item">${after ? `<img src="${after.data}"><span class="tag">После</span>` : ''}</div>
      </div>
    ` : ''}

    <div class="btn-row" style="margin-top:22px">
      <button class="btn btn-ghost" id="printJobBtn">Печать</button>
      <button class="btn btn-ghost" id="editJobBtn">Изменить</button>
    </div>
    <div class="btn-row" style="margin-top:10px">
      <button class="btn btn-danger" id="deleteJobBtn">Удалить</button>
    </div>
  `, { center: true });

  document.getElementById('printJobBtn').addEventListener('click', () => printJobReceipt(job, items));

  document.getElementById('editJobBtn').addEventListener('click', () => {
    closeModal();
    Router.navigate('new');
    setTimeout(() => renderJobForm(job), 0);
  });

  document.getElementById('deleteJobBtn').addEventListener('click', () => confirmDeleteJob(job));
}

function printJobReceipt(job, items) {
  const total = items.length ? sumWorkItems(items) : (Number(job.cost) || 0);
  const printArea = document.getElementById('printArea');
  printArea.innerHTML = `
    <div class="print-header">
      <div class="print-logo">MGarage</div>
      <div class="print-date">${fmtDate(job.date)}</div>
    </div>
    <h2>${escapeHTML(job.brand)} ${escapeHTML(job.model)} ${escapeHTML(job.generation || '')}</h2>
    <table class="print-table">
      <tr><td>VIN</td><td>${escapeHTML(job.vin || '—')}</td></tr>
      <tr><td>Госномер</td><td>${escapeHTML(job.plate || '—')}</td></tr>
      <tr><td>Пробег</td><td>${job.mileage ? job.mileage + ' км' : '—'}</td></tr>
      <tr><td>Клиент</td><td>${escapeHTML(job.client || '—')}</td></tr>
      <tr><td>Телефон</td><td>${escapeHTML(job.phone || '—')}</td></tr>
    </table>
    <h3>Выполненные работы</h3>
    <table class="print-table">
      ${items.length ? items.map((i) => `<tr><td>${escapeHTML(i.name || 'Работа')}</td><td>${money(i.price)}</td></tr>`).join('') : '<tr><td>Стоимость</td><td>' + money(job.cost) + '</td></tr>'}
      <tr class="print-total"><td>Итого</td><td>${money(total)}</td></tr>
    </table>
    ${job.description ? `<h3>Описание</h3><p>${escapeHTML(job.description)}</p>` : ''}
  `;
  window.print();
}

function confirmDeleteJob(job) {
  openModal(`
    <div class="modal-title">Удалить запись?</div>
    <div class="text-dim" style="font-size:13.5px;margin-bottom:20px">
      Работа «${escapeHTML(job.brand)} ${escapeHTML(job.model)}» от ${fmtDate(job.date)} будет удалена без возможности восстановления.
    </div>
    <div class="btn-row">
      <button class="btn btn-ghost" id="cancelDelete">Отмена</button>
      <button class="btn btn-danger" id="confirmDelete">Удалить</button>
    </div>
  `, { center: true });

  document.getElementById('cancelDelete').addEventListener('click', closeModal);
  document.getElementById('confirmDelete').addEventListener('click', async () => {
    await DB.deleteJobCascade(job.id);
    closeModal();
    toast('Запись удалена');
    Router.navigate(Router.current === 'new' ? 'history' : Router.current);
  });
}

// ---------------------------------------------------------
// New / Edit job form
// ---------------------------------------------------------

function fileToCompressedDataURL(file, maxDim = 1000, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => { img.src = reader.result; };
    reader.onerror = reject;
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function renderJobForm(existingJob = null) {
  const isEdit = !!existingJob;
  let photoBefore = null;
  let photoAfter = null;

  if (isEdit) {
    const photos = await DB.getPhotosByJob(existingJob.id);
    photoBefore = photos.find((p) => p.type === 'before') || null;
    photoAfter = photos.find((p) => p.type === 'after') || null;
  }

  const j = existingJob || {};

  $app().innerHTML = `
    <h1 class="page-title">${isEdit ? 'Изменить работу' : 'Новая работа'}</h1>
    <div class="page-sub">${isEdit ? 'Обновите данные записи' : 'Заполните карточку ремонта'}</div>

    <form id="jobForm">
      <div class="section-label">Автомобиль</div>

      <div class="form-row">
        <div class="form-group">
          <label class="field-label">Дата</label>
          <input type="date" name="date" value="${j.date || todayISO()}" required />
        </div>
        <div class="form-group">
          <label class="field-label">Пробег, км</label>
          <input type="number" name="mileage" placeholder="120000" value="${j.mileage ?? ''}" inputmode="numeric" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="field-label">Марка</label>
          <select id="brandSelect"></select>
          <input type="text" id="brandCustom" placeholder="Введите марку" class="hidden" style="margin-top:8px" />
        </div>
        <div class="form-group">
          <label class="field-label">Модель</label>
          <select id="modelSelect"></select>
          <input type="text" id="modelCustom" placeholder="Введите модель" class="hidden" style="margin-top:8px" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="field-label">Поколение / серия</label>
          <select id="genSelect" class="hidden"></select>
          <input type="text" id="genCustom" placeholder="Например, G80" />
        </div>
        <div class="form-group">
          <label class="field-label">Кузов</label>
          <select id="bodySelect"></select>
          <input type="text" id="bodyCustom" placeholder="Введите тип кузова" class="hidden" style="margin-top:8px" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="field-label">VIN</label>
          <input type="text" name="vin" placeholder="WBS..." value="${escapeHTML(j.vin)}" style="text-transform:uppercase" />
        </div>
        <div class="form-group">
          <label class="field-label">Госномер</label>
          <input type="text" name="plate" placeholder="А123ВС77" value="${escapeHTML(j.plate)}" style="text-transform:uppercase" />
        </div>
      </div>

      <div class="section-label">Клиент</div>

      <div class="form-row">
        <div class="form-group">
          <label class="field-label">Клиент</label>
          <input type="text" name="client" placeholder="Имя" value="${escapeHTML(j.client)}" />
        </div>
        <div class="form-group">
          <label class="field-label">Телефон</label>
          <input type="tel" name="phone" placeholder="+7 900 000-00-00" value="${escapeHTML(j.phone)}" />
        </div>
      </div>

      <div class="section-label">Финансы</div>

      <div class="form-row">
        <div class="form-group">
          <label class="field-label">Стоимость, €</label>
          <input type="number" name="cost" placeholder="150" value="${j.cost ?? ''}" inputmode="numeric" id="costInput" required />
        </div>
        <div class="form-group">
          <label class="field-label">Расходы, €</label>
          <input type="number" name="expenses" placeholder="40" value="${j.expenses ?? ''}" inputmode="numeric" id="expensesInput" />
        </div>
      </div>

      <div class="card" style="padding:14px 16px;margin-bottom:14px">
        <div class="flex-between">
          <span class="text-dim" style="font-size:13px">Прибыль автоматически</span>
          <span class="kpi-value accent" id="profitPreview" style="font-size:19px">${money((j.cost || 0) - (j.expenses || 0))}</span>
        </div>
      </div>

      <div class="section-label">Описание</div>
      <div class="form-group">
        <textarea name="description" placeholder="Что было сделано...">${escapeHTML(j.description)}</textarea>
      </div>

      <div class="section-label">Выполненные работы</div>
      <div class="filter-chips" id="presetChips">
        ${WORK_PRESETS.map((p) => `<div class="chip" data-name="${escapeHTML(p.name)}" data-price="${p.price}">${escapeHTML(p.name)}${p.price ? ' · ' + p.price + ' €' : ''}</div>`).join('')}
        <div class="chip" id="customItemChip">+ Своя работа</div>
      </div>
      <div id="workItemsList" style="margin-top:6px"></div>
      <div class="card" style="padding:14px 16px;margin-bottom:14px">
        <div class="flex-between">
          <span class="text-dim" style="font-size:13px">Итого по работам</span>
          <span class="kpi-value accent" id="itemsSum" style="font-size:17px">0 €</span>
        </div>
      </div>

      <div class="section-label">Фотографии</div>
      <div class="photo-upload-row">
        <div class="photo-drop ${photoBefore ? 'has-image' : ''}" id="dropBefore">
          <img src="${photoBefore ? photoBefore.data : ''}" style="${photoBefore ? '' : 'display:none'}" />
          <div class="photo-drop-label"><svg viewBox="0 0 24 24"><path d="M4 12l1.5-6h13L20 12M4 12v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6M4 12h16"/></svg>Фото ДО</div>
          <button type="button" class="photo-drop-remove" data-target="before">✕</button>
          <input type="file" accept="image/*" capture="environment" id="fileBefore" style="position:absolute;inset:0;opacity:0;cursor:pointer" />
        </div>
        <div class="photo-drop ${photoAfter ? 'has-image' : ''}" id="dropAfter">
          <img src="${photoAfter ? photoAfter.data : ''}" style="${photoAfter ? '' : 'display:none'}" />
          <div class="photo-drop-label"><svg viewBox="0 0 24 24"><path d="M4 12l1.5-6h13L20 12M4 12v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6M4 12h16"/></svg>Фото ПОСЛЕ</div>
          <button type="button" class="photo-drop-remove" data-target="after">✕</button>
          <input type="file" accept="image/*" capture="environment" id="fileAfter" style="position:absolute;inset:0;opacity:0;cursor:pointer" />
        </div>
      </div>

      <div class="btn-row" style="margin-top:24px">
        ${isEdit ? '<button type="button" class="btn btn-ghost" id="cancelEditBtn">Отмена</button>' : ''}
        <button type="submit" class="btn btn-primary">${isEdit ? 'Сохранить изменения' : 'Сохранить'}</button>
      </div>
    </form>
  `;

  let newPhotoBeforeData = photoBefore ? photoBefore.data : null;
  let newPhotoAfterData = photoAfter ? photoAfter.data : null;
  let removeBefore = false;
  let removeAfter = false;

  const form = document.getElementById('jobForm');
  const costInput = document.getElementById('costInput');
  const expensesInput = document.getElementById('expensesInput');
  const profitPreview = document.getElementById('profitPreview');

  // ---- Cascading Марка / Модель / Поколение / Кузов ----
  const brandSelect = document.getElementById('brandSelect');
  const brandCustom = document.getElementById('brandCustom');
  const modelSelect = document.getElementById('modelSelect');
  const modelCustom = document.getElementById('modelCustom');
  const genSelect = document.getElementById('genSelect');
  const genCustom = document.getElementById('genCustom');
  const bodySelect = document.getElementById('bodySelect');
  const bodyCustom = document.getElementById('bodyCustom');

  function optionsHTML(list) {
    return list.map((o) => `<option value="${escapeHTML(o)}">${escapeHTML(o)}</option>`).join('')
      + `<option value="${OTHER_OPTION}">Другое / вписать вручную...</option>`;
  }

  function selectValueOrOther(selectEl, list, value) {
    if (value) {
      if (list.includes(value)) { selectEl.value = value; return false; }
      selectEl.value = OTHER_OPTION;
      return true;
    }
    // No existing value (new job) — default to the first real option, not "Другое".
    selectEl.value = list[0] || OTHER_OPTION;
    return false;
  }

  function populateBrand() {
    const brands = Object.keys(CAR_DB).sort((a, b) => a.localeCompare(b, 'ru'));
    brandSelect.innerHTML = optionsHTML(brands);
    const isOther = selectValueOrOther(brandSelect, brands, j.brand);
    brandCustom.classList.toggle('hidden', !isOther);
    if (isOther) brandCustom.value = j.brand || '';
  }

  function populateModel(preselectModel) {
    const brand = brandSelect.value === OTHER_OPTION ? null : brandSelect.value;
    const modelMap = (brand && CAR_DB[brand]) || {};
    const models = Object.keys(modelMap).sort((a, b) => a.localeCompare(b, 'ru'));
    if (models.length) {
      modelSelect.innerHTML = optionsHTML(models);
      const isOther = selectValueOrOther(modelSelect, models, preselectModel);
      modelCustom.classList.toggle('hidden', !isOther);
      if (isOther) modelCustom.value = (preselectModel && !models.includes(preselectModel)) ? preselectModel : '';
    } else {
      // brand unknown/custom -> no known model list, go straight to free text
      modelSelect.innerHTML = `<option value="${OTHER_OPTION}">Другое / вписать вручную...</option>`;
      modelSelect.value = OTHER_OPTION;
      modelCustom.classList.remove('hidden');
      modelCustom.value = preselectModel || '';
    }
  }

  function currentBrandValue() {
    return brandSelect.value === OTHER_OPTION ? brandCustom.value.trim() : brandSelect.value;
  }
  function currentModelValue() {
    return modelSelect.value === OTHER_OPTION ? modelCustom.value.trim() : modelSelect.value;
  }

  function populateGeneration(preselectGen) {
    const brand = currentBrandValue();
    const model = currentModelValue();
    const gens = (CAR_DB[brand] && CAR_DB[brand][model]) || null;
    if (gens && gens.length) {
      genSelect.classList.remove('hidden');
      genSelect.innerHTML = optionsHTML(gens);
      const isOther = selectValueOrOther(genSelect, gens, preselectGen);
      genCustom.classList.toggle('hidden', !isOther);
      if (isOther) genCustom.value = (preselectGen && !gens.includes(preselectGen)) ? preselectGen : '';
    } else {
      genSelect.classList.add('hidden');
      genCustom.classList.remove('hidden');
      genCustom.value = preselectGen || '';
    }
  }

  function populateBody() {
    bodySelect.innerHTML = BODY_TYPES.map((o) => `<option value="${escapeHTML(o)}">${escapeHTML(o)}</option>`).join('');
    if (j.body && BODY_TYPES.includes(j.body) && j.body !== 'Другое') {
      bodySelect.value = j.body;
      bodyCustom.classList.add('hidden');
    } else if (j.body) {
      bodySelect.value = 'Другое';
      bodyCustom.classList.remove('hidden');
      bodyCustom.value = j.body;
    } else {
      bodySelect.value = BODY_TYPES[0];
      bodyCustom.classList.add('hidden');
    }
  }

  populateBrand();
  populateModel(j.model);
  populateGeneration(j.generation);
  populateBody();

  brandSelect.addEventListener('change', () => {
    const isOther = brandSelect.value === OTHER_OPTION;
    brandCustom.classList.toggle('hidden', !isOther);
    if (isOther) { brandCustom.value = ''; brandCustom.focus(); }
    populateModel(null);
    populateGeneration(null);
  });
  brandCustom.addEventListener('input', () => populateGeneration(null));

  modelSelect.addEventListener('change', () => {
    const isOther = modelSelect.value === OTHER_OPTION;
    modelCustom.classList.toggle('hidden', !isOther);
    if (isOther) { modelCustom.value = ''; modelCustom.focus(); }
    populateGeneration(null);
  });
  modelCustom.addEventListener('input', () => populateGeneration(null));

  genSelect.addEventListener('change', () => {
    const isOther = genSelect.value === OTHER_OPTION;
    genCustom.classList.toggle('hidden', !isOther);
    if (isOther) { genCustom.value = ''; genCustom.focus(); }
  });

  bodySelect.addEventListener('change', () => {
    const isOther = bodySelect.value === 'Другое';
    bodyCustom.classList.toggle('hidden', !isOther);
    if (isOther) { bodyCustom.value = ''; bodyCustom.focus(); }
  });

  function updateProfitPreview() {
    const cost = Number(costInput.value) || 0;
    const expenses = Number(expensesInput.value) || 0;
    profitPreview.textContent = money(cost - expenses);
  }
  costInput.addEventListener('input', updateProfitPreview);
  expensesInput.addEventListener('input', updateProfitPreview);

  let workItems = getJobWorkItems(j).map((i) => ({ ...i }));

  function renderWorkItemsList() {
    const root = document.getElementById('workItemsList');
    if (!workItems.length) {
      root.innerHTML = `<div class="text-faint" style="font-size:12.5px;padding:2px 2px 10px">Нажмите на работу выше, чтобы добавить её в список</div>`;
      return;
    }
    root.innerHTML = workItems.map((item) => `
      <div class="work-item-row" data-id="${item.id}">
        <input type="text" class="wi-name" value="${escapeHTML(item.name)}" placeholder="Название работы" />
        <input type="number" class="wi-price" value="${item.price}" placeholder="0" inputmode="numeric" />
        <span class="wi-currency">€</span>
        <button type="button" class="wi-remove">✕</button>
      </div>`).join('');

    root.querySelectorAll('.work-item-row').forEach((row) => {
      const id = row.dataset.id;
      row.querySelector('.wi-name').addEventListener('input', (e) => {
        const it = workItems.find((w) => w.id === id);
        if (it) it.name = e.target.value;
      });
      row.querySelector('.wi-price').addEventListener('input', (e) => {
        const it = workItems.find((w) => w.id === id);
        if (it) it.price = Number(e.target.value) || 0;
        updateItemsSumDisplay();
        syncCostFromItems();
      });
      row.querySelector('.wi-remove').addEventListener('click', () => {
        workItems = workItems.filter((w) => w.id !== id);
        renderWorkItemsList();
        updateItemsSumDisplay();
        syncCostFromItems();
      });
    });
  }

  function updateItemsSumDisplay() {
    document.getElementById('itemsSum').textContent = money(sumWorkItems(workItems));
  }

  function syncCostFromItems() {
    if (workItems.length) {
      costInput.value = sumWorkItems(workItems);
      updateProfitPreview();
    }
  }

  document.getElementById('presetChips').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    if (chip.id === 'customItemChip') {
      workItems.push({ id: genId(), name: '', price: 0 });
    } else {
      workItems.push({ id: genId(), name: chip.dataset.name, price: Number(chip.dataset.price) || 0 });
    }
    renderWorkItemsList();
    updateItemsSumDisplay();
    syncCostFromItems();
    const lastInput = document.querySelector('#workItemsList .work-item-row:last-child .wi-name');
    if (lastInput) lastInput.focus();
  });

  renderWorkItemsList();
  updateItemsSumDisplay();

  function wirePhotoDrop(dropId, fileId, target) {
    const drop = document.getElementById(dropId);
    const fileInput = document.getElementById(fileId);
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const dataUrl = await fileToCompressedDataURL(file);
      drop.querySelector('img').src = dataUrl;
      drop.querySelector('img').style.display = 'block';
      drop.classList.add('has-image');
      if (target === 'before') { newPhotoBeforeData = dataUrl; removeBefore = false; }
      else { newPhotoAfterData = dataUrl; removeAfter = false; }
    });
    drop.querySelector('.photo-drop-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      drop.classList.remove('has-image');
      drop.querySelector('img').style.display = 'none';
      drop.querySelector('img').src = '';
      fileInput.value = '';
      if (target === 'before') { newPhotoBeforeData = null; removeBefore = true; }
      else { newPhotoAfterData = null; removeAfter = true; }
    });
  }
  wirePhotoDrop('dropBefore', 'fileBefore', 'before');
  wirePhotoDrop('dropAfter', 'fileAfter', 'after');

  if (isEdit) {
    document.getElementById('cancelEditBtn').addEventListener('click', () => {
      Router.navigate('history');
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);

    const finalBrand = currentBrandValue();
    const finalModel = currentModelValue();
    const finalGeneration = (genSelect.classList.contains('hidden') ? genCustom.value : (genSelect.value === OTHER_OPTION ? genCustom.value : genSelect.value)).trim();
    const finalBody = (bodySelect.value === 'Другое' ? bodyCustom.value : bodySelect.value).trim();

    if (!finalBrand) { toast('Укажите марку автомобиля', 'error'); brandCustom.classList.contains('hidden') ? brandSelect.focus() : brandCustom.focus(); return; }
    if (!finalModel) { toast('Укажите модель автомобиля', 'error'); modelCustom.classList.contains('hidden') ? modelSelect.focus() : modelCustom.focus(); return; }

    const jobData = {
      date: fd.get('date'),
      brand: finalBrand,
      model: finalModel,
      generation: finalGeneration,
      body: finalBody,
      vin: fd.get('vin').trim().toUpperCase(),
      plate: fd.get('plate').trim().toUpperCase(),
      mileage: fd.get('mileage') ? Number(fd.get('mileage')) : null,
      client: fd.get('client').trim(),
      phone: fd.get('phone').trim(),
      cost: Number(fd.get('cost')) || 0,
      expenses: Number(fd.get('expenses')) || 0,
      description: fd.get('description').trim(),
      workItems: workItems.filter((i) => i.name.trim() || i.price),
      thumb: newPhotoAfterData || newPhotoBeforeData || null,
    };

    try {
      const carId = await upsertCarFromJob(jobData);
      jobData.carId = carId;

      let jobId;
      if (isEdit) {
        jobId = existingJob.id;
        await DB.put(DB.STORES.jobs, { ...jobData, id: jobId, createdAt: existingJob.createdAt });
      } else {
        jobData.createdAt = new Date().toISOString();
        jobId = await DB.add(DB.STORES.jobs, jobData);
      }

      await savePhotoForJob(jobId, 'before', newPhotoBeforeData, removeBefore, isEdit ? existingJob.id : null);
      await savePhotoForJob(jobId, 'after', newPhotoAfterData, removeAfter, isEdit ? existingJob.id : null);

      toast(isEdit ? 'Изменения сохранены' : 'Работа сохранена');
      form.reset();
      Router.navigate('history');
    } catch (err) {
      console.error(err);
      toast('Ошибка сохранения: ' + err.message, 'error');
    }
  });
}

async function savePhotoForJob(jobId, type, dataUrl, shouldRemove, existingJobId) {
  const existingPhotos = await DB.getPhotosByJob(jobId);
  const existing = existingPhotos.find((p) => p.type === type);

  if (shouldRemove) {
    if (existing) await DB.delete(DB.STORES.photos, existing.id);
    return;
  }
  if (!dataUrl) return;

  if (existing) {
    if (existing.data !== dataUrl) {
      await DB.put(DB.STORES.photos, { ...existing, data: dataUrl });
    }
  } else {
    await DB.add(DB.STORES.photos, { jobId, type, data: dataUrl, createdAt: new Date().toISOString() });
  }
}

async function upsertCarFromJob(jobData) {
  const cars = await DB.getAll(DB.STORES.cars);
  const match = cars.find((c) =>
    (jobData.vin && c.vin === jobData.vin) ||
    (jobData.plate && c.plate === jobData.plate && c.brand === jobData.brand)
  );

  const carPayload = {
    brand: jobData.brand,
    model: jobData.model,
    generation: jobData.generation,
    body: jobData.body,
    vin: jobData.vin,
    plate: jobData.plate,
    client: jobData.client,
    phone: jobData.phone,
    updatedAt: new Date().toISOString(),
  };

  if (match) {
    await DB.put(DB.STORES.cars, { ...match, ...carPayload });
    return match.id;
  }
  return DB.add(DB.STORES.cars, { ...carPayload, createdAt: new Date().toISOString() });
}

// ---------------------------------------------------------
// Statistics
// ---------------------------------------------------------

async function renderStats() {
  const jobs = await DB.getAll(DB.STORES.jobs);

  const sum = (arr, f) => arr.reduce((s, j) => s + (Number(j[f]) || 0), 0);
  const today = todayISO();
  const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const monthStr = today.slice(0, 7);
  const yearStr = today.slice(0, 4);

  const dayRevenue = sum(jobs.filter((j) => j.date === today), 'cost');
  const weekRevenue = sum(jobs.filter((j) => j.date >= weekAgo), 'cost');
  const monthRevenue = sum(jobs.filter((j) => (j.date || '').startsWith(monthStr)), 'cost');
  const yearRevenue = sum(jobs.filter((j) => (j.date || '').startsWith(yearStr)), 'cost');
  const totalProfit = sum(jobs, 'cost') - sum(jobs, 'expenses');
  const avgCheck = jobs.length ? sum(jobs, 'cost') / jobs.length : 0;

  const byBrand = {};
  jobs.forEach((j) => {
    const b = j.brand || 'Без марки';
    if (!byBrand[b]) byBrand[b] = { count: 0, profit: 0 };
    byBrand[b].count += 1;
    byBrand[b].profit += (Number(j.cost) || 0) - (Number(j.expenses) || 0);
  });
  const brandEntries = Object.entries(byBrand);
  const mostProfitable = brandEntries.sort((a, b) => b[1].profit - a[1].profit)[0];
  const mostFrequent = brandEntries.sort((a, b) => b[1].count - a[1].count)[0];

  // last 6 months revenue
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push(d.toISOString().slice(0, 7));
  }
  const monthLabels = months.map((m) => {
    const [, mm] = m.split('-');
    return ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'][Number(mm) - 1];
  });
  const monthValues = months.map((m) => sum(jobs.filter((j) => (j.date || '').startsWith(m)), 'cost'));

  const brandColors = ['#81C4FF', '#16588E', '#E7222E', '#5C6779', '#3B7BAE', '#F5F7FA'];
  const donutSegments = brandEntries
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6)
    .map(([brand, v], i) => ({ label: brand, value: v.count, color: brandColors[i % brandColors.length] }));

  $app().innerHTML = `
    <h1 class="page-title">Статистика</h1>
    <div class="page-sub">Аналитика по всем работам</div>

    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-label">Сегодня</div><div class="kpi-value accent">${money(dayRevenue)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Неделя</div><div class="kpi-value">${money(weekRevenue)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Месяц</div><div class="kpi-value">${money(monthRevenue)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Год</div><div class="kpi-value">${money(yearRevenue)}</div></div>
    </div>

    <div class="section-label">Доход за 6 месяцев</div>
    <div class="card"><canvas id="revChart" class="chart-canvas"></canvas></div>

    ${donutSegments.length ? `
      <div class="section-label">Распределение по маркам</div>
      <div class="card" style="display:flex;align-items:center;gap:18px">
        <canvas id="brandDonut" width="140" height="140" style="width:140px;height:140px;flex-shrink:0"></canvas>
        <div style="flex:1;display:flex;flex-direction:column;gap:8px">
          ${donutSegments.map((s) => `
            <div style="display:flex;align-items:center;gap:8px;font-size:12.5px">
              <span style="width:9px;height:9px;border-radius:3px;background:${s.color};flex-shrink:0"></span>
              <span class="text-dim" style="flex:1">${escapeHTML(s.label)}</span>
              <span>${s.value}</span>
            </div>`).join('')}
        </div>
      </div>
    ` : ''}

    <div class="section-label">Показатели</div>
    <div class="stat-list">
      <div class="stat-row"><span class="stat-row-label">Общая прибыль</span><span class="stat-row-value accent">${money(totalProfit)}</span></div>
      <div class="stat-row"><span class="stat-row-label">Средний чек</span><span class="stat-row-value">${money(avgCheck)}</span></div>
      <div class="stat-row"><span class="stat-row-label">Всего ремонтов</span><span class="stat-row-value">${jobs.length}</span></div>
      <div class="stat-row"><span class="stat-row-label">Самая прибыльная марка</span><span class="stat-row-value">${mostProfitable ? escapeHTML(mostProfitable[0]) : '—'}</span></div>
      <div class="stat-row"><span class="stat-row-label">Самая частая марка</span><span class="stat-row-value">${mostFrequent ? escapeHTML(mostFrequent[0]) : '—'}</span></div>
    </div>
  `;

  requestAnimationFrame(() => {
    Charts.drawBarChart(document.getElementById('revChart'), monthLabels, monthValues, {
      valueFormatter: (v) => v >= 1000 ? Math.round(v / 1000) + 'к' : Math.round(v).toString(),
    });
    if (donutSegments.length) {
      Charts.drawDonutChart(document.getElementById('brandDonut'), donutSegments, { height: 140 });
    }
  });
}

// ---------------------------------------------------------
// Backup
// ---------------------------------------------------------

async function renderBackup() {
  const [carsCount, jobsCount, photosCount] = await Promise.all([
    DB.count(DB.STORES.cars),
    DB.count(DB.STORES.jobs),
    DB.count(DB.STORES.photos),
  ]);

  $app().innerHTML = `
    <h1 class="page-title">Резервная копия</h1>
    <div class="page-sub">Все данные хранятся только на этом устройстве</div>

    <div class="card">
      <div class="stat-list">
        <div class="stat-row"><span class="stat-row-label">Автомобилей</span><span class="stat-row-value">${carsCount}</span></div>
        <div class="stat-row"><span class="stat-row-label">Работ</span><span class="stat-row-value">${jobsCount}</span></div>
        <div class="stat-row"><span class="stat-row-label">Фотографий</span><span class="stat-row-value">${photosCount}</span></div>
      </div>
    </div>

    <div class="section-label">Экспорт</div>
    <div class="card">
      <div class="text-dim" style="font-size:13px;margin-bottom:14px">Сохраните полную копию базы данных в JSON-файл. Файл можно перенести на другое устройство.</div>
      <button class="btn btn-primary" id="exportBtn">Экспортировать JSON</button>
    </div>

    <div class="section-label">Импорт</div>
    <div class="card">
      <div class="text-dim" style="font-size:13px;margin-bottom:14px">Восстановление полностью заменит текущую базу данных на данные из файла резервной копии.</div>
      <button class="btn btn-ghost" id="importBtn">Выбрать файл JSON</button>
      <input type="file" id="importFile" accept="application/json" style="display:none" />
    </div>

    <div class="section-label">Опасная зона</div>
    <div class="card">
      <div class="text-dim" style="font-size:13px;margin-bottom:14px">Полностью удалить все записи, машины и фотографии без возможности восстановления.</div>
      <button class="btn btn-danger" id="wipeBtn">Удалить всю базу</button>
    </div>
  `;

  document.getElementById('exportBtn').addEventListener('click', async () => {
    try {
      await exportFullBackup();
      toast('Резервная копия сохранена');
    } catch (err) {
      toast('Ошибка экспорта', 'error');
    }
  });

  const fileInput = document.getElementById('importFile');
  document.getElementById('importBtn').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    confirmImport(file);
    fileInput.value = '';
  });

  document.getElementById('wipeBtn').addEventListener('click', confirmWipe);
}

function confirmImport(file) {
  openModal(`
    <div class="modal-title">Восстановить из копии?</div>
    <div class="text-dim" style="font-size:13.5px;margin-bottom:20px">
      Текущая база данных будет полностью заменена содержимым файла «${escapeHTML(file.name)}». Это действие необратимо.
    </div>
    <div class="btn-row">
      <button class="btn btn-ghost" id="cancelImport">Отмена</button>
      <button class="btn btn-primary" id="confirmImport">Восстановить</button>
    </div>
  `, { center: true });

  document.getElementById('cancelImport').addEventListener('click', closeModal);
  document.getElementById('confirmImport').addEventListener('click', async () => {
    try {
      const result = await importFullBackup(file, { replace: true });
      closeModal();
      toast(`Восстановлено: ${result.jobs} работ, ${result.cars} машин`);
      Router.navigate('home');
    } catch (err) {
      closeModal();
      toast(err.message, 'error');
    }
  });
}

function confirmWipe() {
  openModal(`
    <div class="modal-title">Удалить всю базу?</div>
    <div class="text-dim" style="font-size:13.5px;margin-bottom:20px">
      Все машины, работы, фотографии и настройки будут удалены безвозвратно. Рекомендуем сначала сделать экспорт.
    </div>
    <div class="btn-row">
      <button class="btn btn-ghost" id="cancelWipe">Отмена</button>
      <button class="btn btn-danger" id="confirmWipe">Удалить всё</button>
    </div>
  `, { center: true });

  document.getElementById('cancelWipe').addEventListener('click', closeModal);
  document.getElementById('confirmWipe').addEventListener('click', async () => {
    await DB.wipeAll();
    closeModal();
    toast('База данных очищена');
    Router.navigate('home');
  });
}

window.Router = Router;
window.toast = toast;

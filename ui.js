/**
 * MGarage — ui.js
 * All page rendering, forms, modals and toasts.
 */

const $app = () => document.getElementById('app');
const $modalRoot = () => document.getElementById('modalRoot');

const money = (n) => Math.round(n || 0).toLocaleString('ru-RU') + ' ₽';
const fmtDate = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
};
const todayISO = () => new Date().toISOString().slice(0, 10);

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

  const tags = [];
  if (job.checkReplace) tags.push('Замена');
  if (job.checkDiagnostics) tags.push('Диагностика');

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

    ${tags.length ? `<div class="checklist-tags">${tags.map((t) => `<span class="tag-pill">${t}</span>`).join('')}</div>` : ''}

    ${job.description ? `<div class="divider"></div><div class="text-dim" style="font-size:13.5px;line-height:1.5">${escapeHTML(job.description)}</div>` : ''}

    ${(before || after) ? `
      <div class="section-label">Фото</div>
      <div class="photo-compare">
        <div class="photo-compare-item">${before ? `<img src="${before.data}"><span class="tag">До</span>` : ''}</div>
        <div class="photo-compare-item">${after ? `<img src="${after.data}"><span class="tag">После</span>` : ''}</div>
      </div>
    ` : ''}

    <div class="btn-row" style="margin-top:22px">
      <button class="btn btn-ghost" id="editJobBtn">Изменить</button>
      <button class="btn btn-danger" id="deleteJobBtn">Удалить</button>
    </div>
  `, { center: true });

  document.getElementById('editJobBtn').addEventListener('click', () => {
    closeModal();
    Router.navigate('new');
    setTimeout(() => renderJobForm(job), 0);
  });

  document.getElementById('deleteJobBtn').addEventListener('click', () => confirmDeleteJob(job));
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
          <input type="text" name="brand" placeholder="BMW" value="${escapeHTML(j.brand)}" required />
        </div>
        <div class="form-group">
          <label class="field-label">Модель</label>
          <input type="text" name="model" placeholder="M3" value="${escapeHTML(j.model)}" required />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="field-label">Поколение</label>
          <input type="text" name="generation" placeholder="G80" value="${escapeHTML(j.generation)}" />
        </div>
        <div class="form-group">
          <label class="field-label">Кузов</label>
          <input type="text" name="body" placeholder="Седан" value="${escapeHTML(j.body)}" />
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
          <label class="field-label">Стоимость, ₽</label>
          <input type="number" name="cost" placeholder="15000" value="${j.cost ?? ''}" inputmode="numeric" id="costInput" required />
        </div>
        <div class="form-group">
          <label class="field-label">Расходы, ₽</label>
          <input type="number" name="expenses" placeholder="4000" value="${j.expenses ?? ''}" inputmode="numeric" id="expensesInput" />
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

      <div class="form-group">
        <div class="checkbox-row">
          <label class="checkbox-pill ${j.checkReplace ? 'checked' : ''}" id="pillReplace">
            <span class="dot"></span> Замена
            <input type="checkbox" name="checkReplace" ${j.checkReplace ? 'checked' : ''} />
          </label>
          <label class="checkbox-pill ${j.checkDiagnostics ? 'checked' : ''}" id="pillDiag">
            <span class="dot"></span> Диагностика
            <input type="checkbox" name="checkDiagnostics" ${j.checkDiagnostics ? 'checked' : ''} />
          </label>
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

  function updateProfitPreview() {
    const cost = Number(costInput.value) || 0;
    const expenses = Number(expensesInput.value) || 0;
    profitPreview.textContent = money(cost - expenses);
  }
  costInput.addEventListener('input', updateProfitPreview);
  expensesInput.addEventListener('input', updateProfitPreview);

  ['pillReplace', 'pillDiag'].forEach((id) => {
    const pill = document.getElementById(id);
    pill.addEventListener('click', () => {
      const cb = pill.querySelector('input');
      setTimeout(() => pill.classList.toggle('checked', cb.checked), 0);
    });
  });

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

    const jobData = {
      date: fd.get('date'),
      brand: fd.get('brand').trim(),
      model: fd.get('model').trim(),
      generation: fd.get('generation').trim(),
      body: fd.get('body').trim(),
      vin: fd.get('vin').trim().toUpperCase(),
      plate: fd.get('plate').trim().toUpperCase(),
      mileage: fd.get('mileage') ? Number(fd.get('mileage')) : null,
      client: fd.get('client').trim(),
      phone: fd.get('phone').trim(),
      cost: Number(fd.get('cost')) || 0,
      expenses: Number(fd.get('expenses')) || 0,
      description: fd.get('description').trim(),
      checkReplace: fd.get('checkReplace') === 'on',
      checkDiagnostics: fd.get('checkDiagnostics') === 'on',
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

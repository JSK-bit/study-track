// ===== 常量 =====
const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
let selectedDay = new Date().getDay(); // 0=周日
let editingCourseId = null;

// ===== 课程渲染 =====
function renderHomeSchedule() {
  const today = new Date().getDay();
  const el = document.getElementById('homeScheduleList');
  if (!el) return;
  db.courses.getByDay(today).then(courses => {
    if (courses.length === 0) {
      el.innerHTML = '<div class="placeholder" style="padding:32px 0"><p>还没有课程</p></div>';
      return;
    }
    el.innerHTML = courses.map(c => `
      <div class="schedule-item">
        <span class="subject-bar ${c.level}"></span>
        <div class="subject-info">
          <span class="subject-name">${c.subject}</span>
          <span class="subject-meta">${c.startTime} — ${c.endTime} · ${c.location}</span>
        </div>
      </div>
    `).join('');
    const count = document.querySelector('.section-count');
    if (count) count.textContent = courses.length + ' 节';
  });
}

function renderScheduleView() {
  const tabs = document.getElementById('dayTabs');
  const list = document.getElementById('fullScheduleList');
  if (!tabs || !list) return;
  tabs.innerHTML = DAY_NAMES.map((name, i) =>
    `<button class="day-tab${i === selectedDay ? ' active' : ''}" data-day="${i}">${name}</button>`
  ).join('');
  tabs.querySelectorAll('.day-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.querySelector('.active')?.classList.remove('active');
      btn.classList.add('active');
      selectedDay = parseInt(btn.dataset.day);
      renderScheduleList();
    });
  });
  renderScheduleList();
}

function renderScheduleList() {
  const list = document.getElementById('fullScheduleList');
  if (!list) return;
  db.courses.getByDay(selectedDay).then(courses => {
    if (courses.length === 0) {
      list.innerHTML = '<div class="placeholder" style="padding:40px 0"><p>这天没有课</p></div>';
      return;
    }
    list.innerHTML = courses.map(c => `
      <div class="schedule-item">
        <span class="subject-bar ${c.level}"></span>
        <div class="subject-info">
          <span class="subject-name">${c.subject}</span>
          <span class="subject-meta">${c.startTime} — ${c.endTime} · ${c.location}</span>
        </div>
        <div class="schedule-actions">
          <button class="schedule-act schedule-edit" onclick="openEditCourse(${c.id})">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="schedule-act schedule-del" onclick="deleteCourse(${c.id})">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `).join('');
  });
}

// ===== 弹窗控制 =====
function openAddCourse() {
  editingCourseId = null;
  const modal = document.getElementById('addCourseModal');
  if (!modal) return;
  document.getElementById('courseName').value = '';
  document.getElementById('courseLocation').value = '';
  document.getElementById('courseDay').value = selectedDay;
  document.getElementById('courseStart').value = '08:00';
  document.getElementById('courseEnd').value = '09:40';
  document.querySelectorAll('.level-option').forEach(el => el.classList.remove('active'));
  document.querySelector('.level-option[data-level="t2"]')?.classList.add('active');
  document.querySelector('.modal-header h3').textContent = '添加课程';
  modal.classList.add('open');
}

function openEditCourse(id) {
  const modal = document.getElementById('addCourseModal');
  if (!modal) return;
  db.courses.getByDay(selectedDay).then(courses => {
    const course = courses.find(c => c.id === id);
    if (!course) return;
    editingCourseId = id;
    document.getElementById('courseName').value = course.subject;
    document.getElementById('courseLocation').value = course.location || '';
    document.getElementById('courseDay').value = course.dayOfWeek;
    document.getElementById('courseStart').value = course.startTime;
    document.getElementById('courseEnd').value = course.endTime;
    document.querySelectorAll('.level-option').forEach(el => el.classList.remove('active'));
    const levelEl = document.querySelector(`.level-option[data-level="${course.level}"]`);
    if (levelEl) levelEl.classList.add('active');
    document.querySelector('.modal-header h3').textContent = '编辑课程';
    modal.classList.add('open');
  });
}

function closeAddCourse() {
  document.getElementById('addCourseModal')?.classList.remove('open');
  editingCourseId = null;
}

function saveCourse() {
  const subject = document.getElementById('courseName').value.trim();
  if (!subject) { alert('请输入课程名称'); return; }
  const level = document.querySelector('.level-option.active')?.dataset.level || 't2';
  const data = {
    subject,
    dayOfWeek: parseInt(document.getElementById('courseDay').value),
    startTime: document.getElementById('courseStart').value,
    endTime: document.getElementById('courseEnd').value,
    location: document.getElementById('courseLocation').value.trim(),
    level
  };
  const op = editingCourseId
    ? db.courses.update({ ...data, id: editingCourseId })
    : db.courses.add(data);
  op.then(() => {
    closeAddCourse();
    renderScheduleList();
    renderHomeSchedule();
  });
}

function deleteCourse(id) {
  if (!confirm('确定删除该课程？')) return;
  db.courses.remove(id).then(() => {
    renderScheduleList();
    renderHomeSchedule();
  });
}

// ===== 底部导航切换 =====
document.addEventListener('DOMContentLoaded', () => {
  // 重要度选择
  document.getElementById('courseLevel')?.addEventListener('click', (e) => {
    const opt = e.target.closest('.level-option');
    if (!opt) return;
    document.querySelectorAll('.level-option').forEach(el => el.classList.remove('active'));
    opt.classList.add('active');
  });

  const tabs = document.querySelectorAll('.tab-btn');
  const views = {
    home: document.getElementById('view-home'),
    checkin: document.getElementById('view-checkin'),
    stats: document.getElementById('view-stats'),
    schedule: document.getElementById('view-schedule'),
  };
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const viewName = btn.dataset.view;
      tabs.forEach(b => b.classList.remove('active'));
      Object.values(views).forEach(v => v.classList.remove('active'));
      btn.classList.add('active');
      const target = views[viewName];
      if (target) target.classList.add('active');
      if (viewName === 'schedule') renderScheduleView();
      if (viewName === 'home') renderHomeSchedule();
    });
  });
  renderHomeSchedule();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
  }
});

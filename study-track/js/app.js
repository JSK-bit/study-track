// ===== 常量 =====
const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
let selectedDay = new Date().getDay(); // 0=周日

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
    // 更新节数
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
        <button class="schedule-del" onclick="deleteCourse(${c.id})">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    `).join('');
  });
}

// ===== 弹窗控制 =====
function openAddCourse() {
  const modal = document.getElementById('addCourseModal');
  if (!modal) return;
  document.getElementById('courseDay').value = selectedDay;
  modal.classList.add('open');
  // 默认T2中等
  document.querySelectorAll('.level-option').forEach(el => el.classList.remove('active'));
  document.querySelector('.level-option[data-level="t2"]')?.classList.add('active');
}

function closeAddCourse() {
  document.getElementById('addCourseModal')?.classList.remove('open');
}

function saveCourse() {
  const subject = document.getElementById('courseName').value.trim();
  if (!subject) { alert('请输入课程名称'); return; }

  const level = document.querySelector('.level-option.active')?.dataset.level || 't2';

  db.courses.add({
    subject,
    dayOfWeek: parseInt(document.getElementById('courseDay').value),
    startTime: document.getElementById('courseStart').value,
    endTime: document.getElementById('courseEnd').value,
    location: document.getElementById('courseLocation').value.trim(),
    level
  }).then(() => {
    closeAddCourse();
    // 清空表单
    document.getElementById('courseName').value = '';
    document.getElementById('courseLocation').value = '';
    // 重渲染
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

  // 初始化首页
  renderHomeSchedule();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
  }
});

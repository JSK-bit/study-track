// ===== Tab 切换 =====
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
    });
  });

  // 注册 service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
  }
});
// ===== 每周课表数据 =====
const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const WEEK_SCHEDULE = {
  1: [
    { subject: '高等数学', time: '08:00 — 09:40', location: '301教室', level: 't1' },
    { subject: '大学英语', time: '10:00 — 11:40', location: '502教室', level: 't2' },
  ],
  2: [
    { subject: '线性代数', time: '08:00 — 09:40', location: '303教室', level: 't1' },
    { subject: '程序设计', time: '14:00 — 15:40', location: '机房A', level: 't2' },
  ],
  3: [
    { subject: '大学英语', time: '10:00 — 11:40', location: '502教室', level: 't2' },
    { subject: '体育', time: '14:00 — 15:40', location: '体育馆', level: 't3' },
  ],
  4: [
    { subject: '高等数学', time: '08:00 — 09:40', location: '301教室', level: 't1' },
    { subject: '物理实验', time: '14:00 — 16:00', location: '物理楼', level: 't2' },
  ],
  5: [
    { subject: '线性代数', time: '08:00 — 09:40', location: '303教室', level: 't1' },
    { subject: '程序设计', time: '14:00 — 15:40', location: '机房A', level: 't2' },
  ],
  6: [],
  0: [],
};

let selectedDay = new Date().getDay() || 7; // 默认今天, 周日=0转7
if (selectedDay === 7) selectedDay = 0;

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
  const courses = WEEK_SCHEDULE[selectedDay] || [];

  if (courses.length === 0) {
    list.innerHTML = '<div class="placeholder" style="padding:40px 0"><p>这天没有课</p></div>';
    return;
  }

  list.innerHTML = courses.map(c => `
    <div class="schedule-item">
      <span class="subject-bar ${c.level}"></span>
      <div class="subject-info">
        <span class="subject-name">${c.subject}</span>
        <span class="subject-meta">${c.time} · ${c.location}</span>
      </div>
    </div>
  `).join('');
}

// ===== Tab 切换 =====
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

      // 切换到课表时渲染
      if (viewName === 'schedule') renderScheduleView();
    });
  });

  // 注册 service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
  }
});

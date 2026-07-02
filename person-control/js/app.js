// Person Control - 主逻辑

const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const SUBJECT_COLORS = ['#4f6ef7','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#14b8a6'];
const COLORS = ['0','1','2','3','4','5','6','7'];

let timerInterval = null;
let timerRunning = false;
let timerSeconds = 0;
let timerStartTime = null;

// ========== 视图切换 ==========
function switchView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  document.querySelector(`.tab-btn[data-view="${name}"]`).classList.add('active');
  if (name === 'schedule') renderSchedule();
  if (name === 'plan') renderPlans();
  if (name === 'stats') renderStats();
}

// ========== 日期工具 ==========
function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayDisplay() {
  const d = new Date();
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 ${DAY_NAMES[d.getDay()]}`;
}

function updateHeaderDate() {
  document.getElementById('headerDate').textContent = todayDisplay();
}

// ========== 课表模块 ==========
let selectedDay = new Date().getDay();

function renderSchedule() {
  updateHeaderDate();
  const tabs = document.getElementById('dayTabs');
  tabs.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const btn = document.createElement('button');
    btn.className = 'day-tab' + (i === selectedDay ? ' active' : '');
    btn.textContent = DAY_NAMES[i];
    btn.onclick = () => { selectedDay = i; renderSchedule(); };
    tabs.appendChild(btn);
  }

  DB.getByIndex('schedules', 'dayOfWeek', selectedDay).then(courses => {
    const list = document.getElementById('scheduleList');
    if (courses.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">📅</div><p>${DAY_NAMES[selectedDay]}还没有课程</p></div>`;
      return;
    }
    courses.sort((a, b) => a.startTime.localeCompare(b.startTime));
    list.innerHTML = courses.map(c => `
      <div class="schedule-item">
        <div class="time-block">${c.startTime}<br>${c.endTime}</div>
        <div class="subject-block">
          <div class="subject-name">
            <span class="subject-dot subject-color-${c.color}"></span>
            ${c.subject}
          </div>
          <div class="subject-location">${c.location || ''}</div>
        </div>
        <button class="delete-btn" onclick="deleteCourse(${c.id})">✕</button>
      </div>
    `).join('');
  });
}

function openAddCourse() {
  document.getElementById('addCourseModal').classList.add('open');
  document.getElementById('courseDay').value = selectedDay;
}

function closeAddCourse() {
  document.getElementById('addCourseModal').classList.remove('open');
}

function saveCourse() {
  const subject = document.getElementById('courseName').value.trim();
  if (!subject) { alert('请输入课程名称'); return; }
  const course = {
    subject,
    dayOfWeek: parseInt(document.getElementById('courseDay').value),
    startTime: document.getElementById('courseStart').value,
    endTime: document.getElementById('courseEnd').value,
    location: document.getElementById('courseLocation').value.trim(),
    color: parseInt(document.getElementById('courseColor').value)
  };
  DB.add('schedules', course).then(() => {
    closeAddCourse();
    document.getElementById('courseName').value = '';
    document.getElementById('courseLocation').value = '';
    renderSchedule();
    updateStudySubjects();
  });
}

function deleteCourse(id) {
  if (!confirm('确定删除此课程？')) return;
  DB.delete('schedules', id).then(renderSchedule);
}

// ========== 计划模块 ==========
function renderPlans() {
  updateHeaderDate();
  document.getElementById('planDate').textContent = todayDisplay();
  const date = today();
  DB.getByIndex('plans', 'date', date).then(plans => {
    const list = document.getElementById('planList');
    if (plans.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p>今天还没有计划，写一个吧</p></div>`;
      return;
    }
    plans.sort((a, b) => {
      const order = { 'high': 0, 'medium': 1, 'low': 2 };
      return (order[a.priority] || 1) - (order[b.priority] || 1);
    });
    list.innerHTML = plans.map(p => `
      <div class="plan-item">
        <div class="plan-check ${p.status === 'completed' ? 'done' : ''}" onclick="togglePlan(${p.id}, ${p.status === 'completed'})">
          ${p.status === 'completed' ? '✓' : ''}
        </div>
        <div class="plan-content">
          <div class="plan-text ${p.status === 'completed' ? 'done-text' : ''}">${escapeHtml(p.content)}</div>
          <div class="plan-meta">
            <span class="priority-tag ${p.priority}">${p.priority === 'high' ? '高' : p.priority === 'medium' ? '中' : '低'}</span>
            <span>${p.category || '其他'}</span>
          </div>
        </div>
        <button class="plan-delete" onclick="deletePlan(${p.id})">✕</button>
      </div>
    `).join('');
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function addPlan() {
  const input = document.getElementById('planInput');
  const content = input.value.trim();
  if (!content) return;
  DB.add('plans', {
    content,
    date: today(),
    priority: document.getElementById('planPriority').value,
    category: '其他',
    status: 'pending',
    createdAt: new Date().toISOString()
  }).then(() => {
    input.value = '';
    renderPlans();
  });
}

function togglePlan(id, isDone) {
  DB.getByIndex('plans', 'date', today()).then(plans => {
    const plan = plans.find(p => p.id === id);
    if (!plan) return;
    plan.status = isDone ? 'pending' : 'completed';
    DB.put('plans', plan).then(renderPlans);
  });
}

function deletePlan(id) {
  if (!confirm('删除此计划？')) return;
  DB.delete('plans', id).then(renderPlans);
}

// ========== 学习计时模块 ==========
function updateStudySubjects() {
  const select = document.getElementById('studySubject');
  DB.getAll('schedules').then(courses => {
    const subjects = [...new Set(courses.map(c => c.subject))];
    select.innerHTML = '<option value="">选择科目...</option>' +
      subjects.map(s => `<option value="${s}">${s}</option>`).join('');
  });
}

function formatTime(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function toggleTimer() {
  const btn = document.getElementById('timerBtn');
  const display = document.getElementById('timerDisplay');
  const subject = document.getElementById('studySubject').value;

  if (!timerRunning) {
    if (!subject) { alert('请先选择科目'); return; }
    timerRunning = true;
    timerStartTime = Date.now();
    timerSeconds = 0;
    btn.textContent = '停止';
    btn.className = 'timer-btn stop';
    display.classList.add('running');
    timerInterval = setInterval(() => {
      timerSeconds = Math.floor((Date.now() - timerStartTime) / 1000);
      display.textContent = formatTime(timerSeconds);
    }, 1000);
  } else {
    timerRunning = false;
    clearInterval(timerInterval);
    btn.textContent = '开始';
    btn.className = 'timer-btn start';
    display.classList.remove('running');

    // 保存记录
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - timerSeconds * 1000);
    if (timerSeconds >= 60) {
      DB.add('records', {
        subject,
        date: today(),
        startTime: startTime.toTimeString().slice(0,5),
        endTime: endTime.toTimeString().slice(0,5),
        durationMinutes: Math.round(timerSeconds / 60),
        note: ''
      }).then(() => {
        display.textContent = '00:00:00';
        renderTodayRecords();
        renderStats();
      });
    } else {
      display.textContent = '00:00:00';
    }
    timerSeconds = 0;
  }
}

function renderTodayRecords() {
  DB.getByIndex('records', 'date', today()).then(records => {
    const container = document.getElementById('todayRecords');
    if (records.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">⏱️</div><p>今天还没有学习记录</p></div>`;
      return;
    }
    records.sort((a, b) => a.startTime.localeCompare(b.startTime));
    container.innerHTML = records.map(r => `
      <div class="record-item">
        <span class="record-subject">${r.subject}</span>
        <span class="record-time">${r.startTime}-${r.endTime}</span>
        <span class="record-duration">${r.durationMinutes}分钟</span>
      </div>
    `).join('');
  });
}

// ========== 统计模块 ==========
function renderStats() {
  updateHeaderDate();
  DB.getAll('records').then(allRecords => {
    const todayStr = today();
    const todayRecords = allRecords.filter(r => r.date === todayStr);
    const weekRecords = getWeekRecords(allRecords);
    const monthDates = getMonthDates();

    // 统计数据卡片
    const todayMin = todayRecords.reduce((s, r) => s + r.durationMinutes, 0);
    const weekMin = weekRecords.reduce((s, r) => s + r.durationMinutes, 0);
    const streak = calcStreak(allRecords);
    const subjectCount = [...new Set(allRecords.map(r => r.subject))].length;

    document.getElementById('statsGrid').innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${todayMin}</div>
        <div class="stat-label">今日学习(分钟)</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${weekMin}</div>
        <div class="stat-label">本周学习(分钟)</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${streak}</div>
        <div class="stat-label">连续打卡(天)</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${subjectCount}</div>
        <div class="stat-label">学习科目数</div>
      </div>
    `;

    // 热力图
    renderHeatmap(monthDates, allRecords);

    // 周图表
    renderWeeklyChart(weekRecords);
  });
}

function getWeekRecords(allRecords) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const mondayStr = monday.toISOString().slice(0, 10);
  return allRecords.filter(r => r.date >= mondayStr);
}

function getMonthDates() {
  const dates = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function calcStreak(allRecords) {
  const recordDates = new Set(allRecords.map(r => r.date));
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (recordDates.has(key)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function renderHeatmap(dates, allRecords) {
  const dailyMinutes = {};
  allRecords.forEach(r => {
    dailyMinutes[r.date] = (dailyMinutes[r.date] || 0) + r.durationMinutes;
  });

  const heatmap = document.getElementById('heatmap');
  heatmap.innerHTML = dates.map(date => {
    const min = dailyMinutes[date] || 0;
    let level = 0;
    if (min > 0) level = 1;
    if (min >= 30) level = 2;
    if (min >= 60) level = 3;
    if (min >= 120) level = 4;
    const d = new Date(date);
    return `<div class="heatmap-day level-${level}" title="${date}: ${min}分钟"></div>`;
  }).join('');
}

function renderWeeklyChart(weekRecords) {
  const dailyMin = {};
  weekRecords.forEach(r => {
    dailyMin[r.date] = (dailyMin[r.date] || 0) + r.durationMinutes;
  });

  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const chart = document.getElementById('weeklyChart');
  chart.innerHTML = '';
  const maxMin = Math.max(...Object.values(dailyMin), 1);

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const min = dailyMin[key] || 0;
    const height = Math.max((min / maxMin) * 100, 4);

    const col = document.createElement('div');
    col.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;';
    col.innerHTML = `
      <div style="font-size:11px;color:var(--text-secondary);">${min}</div>
      <div style="width:100%;background:var(--primary-light);border-radius:4px 4px 0 0;height:140px;display:flex;align-items:flex-end;position:relative;">
        <div style="width:100%;background:var(--primary);border-radius:4px 4px 0 0;height:${height}%;transition:height 0.3s;"></div>
      </div>
      <div style="font-size:11px;color:var(--text-secondary);">${'一二三四五六日'[i]}</div>
    `;
    chart.appendChild(col);
  }
}

// ========== 提醒模块 ==========
function checkReminders() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();

  // 每晚21点检查未完成计划
  if (h === 21 && m === 0) {
    DB.getByIndex('plans', 'date', today()).then(plans => {
      const pending = plans.filter(p => p.status !== 'completed');
      if (pending.length > 0) {
        // 浏览器通知
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Person Control', {
            body: `今天还有 ${pending.length} 个计划未完成 📋`
          });
        }
      }
    });
  }

  // 每晚21点检查未打卡
  if (h === 20 && m === 30) {
    DB.getByIndex('records', 'date', today()).then(records => {
      if (records.length === 0) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Person Control', {
            body: '今天还没有学习记录，记得打卡哦 ⏱️'
          });
        }
      }
    });
  }
}

// ========== 初始化 ==========
function init() {
  updateHeaderDate();
  renderSchedule();
  renderPlans();
  updateStudySubjects();
  renderTodayRecords();

  // 请求通知权限
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // 定时检查提醒（每30秒检查一次）
  setInterval(checkReminders, 30000);
  checkReminders();

  // 每5秒更新一次今日记录（学习视图打开时）
  setInterval(() => {
    const studyView = document.getElementById('view-study');
    if (studyView.classList.contains('active')) {
      renderTodayRecords();
    }
  }, 5000);
}

document.addEventListener('DOMContentLoaded', init);

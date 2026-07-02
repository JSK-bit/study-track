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

// ===== 计划 CRUD =====
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

let editingPlanId = null;

function renderHomePlans() {
  const el = document.getElementById('homePlanList');
  if (!el) return;
  const date = todayStr();
  db.getPlansByDate(date).then(plans => {
    if (plans.length === 0) {
      el.innerHTML = '<div class="placeholder" style="padding:32px 0"><p>还没有计划</p></div>';
      return;
    }
    const done = plans.filter(p => p.status === 'completed').length;
    el.innerHTML = plans.map(p => `
      <div class="plan-item">
        <span class="plan-check ${p.status === 'completed' ? 'checked' : ''}" onclick="togglePlan(${p.id})">
          ${p.status === 'completed' ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
        </span>
        <span class="plan-text ${p.status === 'completed' ? 'done' : ''}">${escHtml(p.content)}</span>
        <div class="schedule-actions">
          <button class="schedule-act schedule-edit" onclick="openEditPlan(${p.id})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="schedule-act schedule-del" onclick="deletePlan(${p.id})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `).join('');
  });
}

function escHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function openAddPlan() {
  editingPlanId = null;
  document.getElementById('planContent').value = '';
  document.querySelector('#addPlanModal h3').textContent = '添加计划';
  document.getElementById('addPlanModal').classList.add('open');
}

function openEditPlan(id) {
  db.getPlansByDate(todayStr()).then(plans => {
    const p = plans.find(x => x.id === id);
    if (!p) return;
    editingPlanId = id;
    document.getElementById('planContent').value = p.content;
    document.querySelector('#addPlanModal h3').textContent = '编辑计划';
    document.getElementById('addPlanModal').classList.add('open');
  });
}

function closeAddPlan() {
  document.getElementById('addPlanModal').classList.remove('open');
  editingPlanId = null;
}

function savePlan() {
  const content = document.getElementById('planContent').value.trim();
  if (!content) { alert('请输入计划内容'); return; }
  const data = { content, date: todayStr(), status: 'pending', createdAt: new Date().toISOString() };
  const op = editingPlanId
    ? db.updatePlan({ ...data, id: editingPlanId })
    : db.addPlan(data);
  op.then(() => {
    closeAddPlan();
    renderHomePlans();
  });
}

function deletePlan(id) {
  if (!confirm('确定删除该计划？')) return;
  db.removePlan(id).then(() => renderHomePlans());
}

function togglePlan(id) {
  db.getPlansByDate(todayStr()).then(plans => {
    const p = plans.find(x => x.id === id);
    if (!p) return;
    p.status = p.status === 'completed' ? 'pending' : 'completed';
    db.updatePlan(p).then(() => renderHomePlans());
  });
}

// ===== 学习会话系统 =====
let sessionTimerInterval = null;
let sessionStartTime = null;
let activeSessionId = null;

function renderCheckinView() {
  const status = document.getElementById('sessionStatus');
  const btn = document.getElementById('btnSessionAction');
  const timer = document.getElementById('sessionTimer');
  const list = document.getElementById('todaySessionList');
  if (!btn || !status || !timer || !list) return;

  const date = todayStr();

  // 检查有无活跃会话
  db.getActiveSession().then(session => {
    if (session) {
      activeSessionId = session.id;
      sessionStartTime = new Date(session.startTime).getTime();
      status.textContent = '学习进行中...';
      status.style.color = 'var(--accent)';
      btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> 结束学习';
      timer.style.display = 'block';
      if (sessionTimerInterval) clearInterval(sessionTimerInterval);
      sessionTimerInterval = setInterval(updateSessionTimer, 1000);
      updateSessionTimer();
    } else {
      activeSessionId = null;
      sessionStartTime = null;
      status.textContent = '今日尚未学习';
      status.style.color = 'var(--text-secondary)';
      btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg> 开始学习';
      timer.style.display = 'none';
      if (sessionTimerInterval) { clearInterval(sessionTimerInterval); sessionTimerInterval = null; }
    }
  });

  // 今日学习记录
  db.getSessionsByDate(date).then(sessions => {
    const done = sessions.filter(s => s.status === 'completed');
    if (done.length === 0) {
      list.innerHTML = '<div class="placeholder" style="padding:24px 0"><p>还没有学习记录</p></div>';
    } else {
      list.innerHTML = done.map(s => {
        const start = new Date(s.startTime);
        const end = new Date(s.endTime);
        const st = String(start.getHours()).padStart(2,'0') + ':' + String(start.getMinutes()).padStart(2,'0');
        const et = String(end.getHours()).padStart(2,'0') + ':' + String(end.getMinutes()).padStart(2,'0');
        return '<div class="schedule-item"><span class="subject-bar t2"></span><div class="subject-info"><span class="subject-name">' + st + ' - ' + et + '</span><span class="subject-meta">' + s.durationMinutes + ' 分钟</span></div><div class="schedule-actions"><button class="schedule-act schedule-del" onclick="deleteSession(' + s.id + ')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></div></div>';
      }).join('');
    }
  });

  renderStreak();
}

function updateSessionTimer() {
  const el = document.getElementById('sessionTimer');
  if (!el || !sessionStartTime) return;
  const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  el.textContent = String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
}

function toggleSession() {
  if (activeSessionId) { endSession(); }
  else { startSession(); }
}

function startSession() {
  const date = todayStr();
  const now = new Date().toISOString();
  db.startSession({ date, startTime: now, status: 'active' }).then(id => {
    activeSessionId = id;
    sessionStartTime = Date.now();
    if (sessionTimerInterval) clearInterval(sessionTimerInterval);
    sessionTimerInterval = setInterval(updateSessionTimer, 1000);
    renderCheckinView();
  });
}

function endSession() {
  if (!activeSessionId) return;
  const now = new Date();
  const durationMs = now.getTime() - sessionStartTime;
  const minutes = Math.max(1, Math.round(durationMs / 60000));
  if (sessionTimerInterval) { clearInterval(sessionTimerInterval); sessionTimerInterval = null; }
  const endTime = now.toISOString();
  const id = activeSessionId;
  activeSessionId = null;
  sessionStartTime = null;
  db.endSession(id, endTime, minutes).then(() => {
    db.setCheckin(todayStr()).then(() => {
      renderCheckinView();
      renderHomeSchedule();
    });
  });
}

let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();

function renderStreak() {
  const grid = document.getElementById('calendarGrid');
  const title = document.getElementById('calendarTitle');
  const streakEl = document.getElementById('streakDisplay');
  if (!grid || !title || !streakEl) return;

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const today = new Date();
  title.textContent = calYear + '年' + (calMonth + 1) + '月';

  Promise.all([db.getAllCheckins(), db.getAllSessions()]).then(([checkins, sessions]) => {
    const dates = new Set();
    checkins.forEach(c => dates.add(c.date));
    sessions.filter(s => s.status === 'completed').forEach(s => dates.add(s.date));

    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
      if (dates.has(key)) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    streakEl.textContent = streak;

    let html = '';
    ['日','一','二','三','四','五','六'].forEach(n => {
      html += '<div class="calendar-weekday">' + n + '</div>';
    });
    for (let i = 0; i < firstDay; i++) {
      html += '<div class="calendar-day empty"></div>';
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = calYear + '-' + String(calMonth+1).padStart(2,'0') + '-' + String(day).padStart(2,'0');
      const isToday = calYear === today.getFullYear() && calMonth === today.getMonth() && day === today.getDate();
      const isChecked = dates.has(dateStr);
      let cls = 'calendar-day';
      if (isChecked) cls += ' checked';
      if (isToday) cls += ' today';
      html += '<div class="' + cls + '">' + day + (isChecked ? '<br><span class="cal-check">\u2713</span>' : '') + '</div>';
    }
    grid.innerHTML = html;
  });
}

function prevMonth() {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderStreak();
}

function nextMonth() {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderStreak();
}

// ===== 删除会话记录 =====
function deleteSession(id) {
  if (!confirm('确定删除该学习记录？')) return;
  db.removeSession(id).then(() => {
    renderCheckinView();
    renderStreak();
  });
}

// ===== 专注计时 =====
let focusState = 'idle';
let focusEndTime = null;
let focusTotalMs = 0;
let focusTimerInterval = null;
let focusPhase = 'study';

function startFocus() {
  const studyMin = parseInt(document.getElementById('focusDuration').value) || 25;
  const breakMin = parseInt(document.getElementById('breakDuration').value) || 10;
  focusTotalMs = studyMin * 60 * 1000;
  focusEndTime = Date.now() + focusTotalMs;
  focusState = 'focusing';
  focusPhase = 'study';
  document.getElementById('breakDuration').dataset.break = breakMin;
  renderFocusView();
  if (focusTimerInterval) clearInterval(focusTimerInterval);
  focusTimerInterval = setInterval(tickFocus, 200);
}

function pauseFocus() {
  if (focusState !== 'focusing' && focusState !== 'break') return;
  const remaining = focusEndTime - Date.now();
  focusEndTime = Date.now() + remaining;
  focusTotalMs = remaining;
  focusState = focusState === 'focusing' ? 'paused' : 'breakPaused';
  if (focusTimerInterval) { clearInterval(focusTimerInterval); focusTimerInterval = null; }
  renderFocusView();
}

function endFocus() {
  if (focusTimerInterval) { clearInterval(focusTimerInterval); focusTimerInterval = null; }
  focusState = 'idle';
  focusPhase = 'study';
  renderFocusView();
}

function tickFocus() {
  if (focusState === 'idle' || focusState === 'paused' || focusState === 'breakPaused') return;
  const now = Date.now();
  const remaining = focusEndTime - now;
  if (remaining <= 0) {
    handleFocusComplete();
    return;
  }
  updateFocusDisplay(remaining, false);
}

function handleFocusComplete() {
  if (focusTimerInterval) { clearInterval(focusTimerInterval); focusTimerInterval = null; }

  if (focusPhase === 'study') {
    fireAlert('学习时间到！该休息一下了');
    const breakMin = parseInt(document.getElementById('breakDuration').value) || 10;
    focusPhase = 'break';
    focusTotalMs = breakMin * 60 * 1000;
    focusEndTime = Date.now() + focusTotalMs;
    focusState = 'break';
    focusTimerInterval = setInterval(tickFocus, 200);
    renderFocusView();
  } else {
    fireAlert('休息结束！继续学习吧');
    focusState = 'idle';
    focusPhase = 'study';
    renderFocusView();
  }
}

function updateFocusDisplay(remaining, paused) {
  const totalSec = Math.ceil(remaining / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const cd = document.getElementById('focusCountdown');
  const bar = document.getElementById('focusBar');
  if (cd) cd.textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  if (bar) bar.style.width = (remaining / focusTotalMs * 100) + '%';
}

function renderFocusView() {
  const idle = document.getElementById('focusIdle');
  const active = document.getElementById('focusActive');
  const phase = document.getElementById('focusPhase');
  const btnPause = document.getElementById('btnFocusPause');
  if (!idle || !active) return;

  if (focusState === 'idle') {
    idle.style.display = 'block';
    active.style.display = 'none';
    return;
  }
  idle.style.display = 'none';
  active.style.display = 'block';

  if (focusState === 'focusing') {
    phase.textContent = '学习中';
    phase.style.color = 'var(--accent)';
    if (btnPause) btnPause.textContent = '暂停';
  } else if (focusState === 'break') {
    phase.textContent = '休息中';
    phase.style.color = '#22c55e';
    if (btnPause) btnPause.textContent = '暂停';
  } else if (focusState === 'paused' || focusState === 'breakPaused') {
    phase.textContent = focusState === 'paused' ? '已暂停' : '休息已暂停';
    phase.style.color = 'var(--text-secondary)';
    if (btnPause) btnPause.textContent = '继续';
  }

  if (focusEndTime) {
    const remaining = Math.max(0, focusEndTime - Date.now());
    updateFocusDisplay(remaining, false);
  }
}

// ===== 提醒系统 =====
function fireAlert(msg) {
  if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300]);
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880; osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
    osc.start(); osc.stop(ctx.currentTime + 1.5);
  } catch(e) {}
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('学习印记', { body: msg });
  }
  showAlertModal(msg);
}

function showAlertModal(msg) {
  const m = document.getElementById('alertModal');
  const t = document.getElementById('alertMessage');
  if (!m || !t) return;
  t.textContent = msg;
  m.classList.add('open');
}

function closeAlertModal() {
  document.getElementById('alertModal')?.classList.remove('open');
}

// ===== 学习统计 =====
let weekOffset = 0;

function getWeekRange(offset) {
  const now = new Date();
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1) - offset * 7);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const ds = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    dates.push(ds);
  }
  return dates;
}

function renderStats() {
  const dates = getWeekRange(weekOffset);
  const m = document.getElementById('weekLabel');
  const r = document.getElementById('weekRange');
  if (m) m.textContent = '第' + (weekOffset + 1) + '周';
  if (r) r.textContent = dates[0] + ' ~ ' + dates[6];

  db.getAllSessions().then(sessions => {
    const done = sessions.filter(s => s.status === 'completed');
    const byDate = {};
    done.forEach(s => { byDate[s.date] = (byDate[s.date] || 0) + s.durationMinutes; });

    const data = dates.map(d => byDate[d] || 0);
    const total = data.reduce((a, b) => a + b, 0);
    const best = Math.max(...data, 0);
    const avg = Math.round(total / 7);

    document.getElementById('statsTotal').textContent = total;
    document.getElementById('statsAvg').textContent = avg;
    document.getElementById('statsBest').textContent = best;

    const canvas = document.getElementById('statsChart');
    if (!canvas) return;
    canvas.width = canvas.clientWidth * 2;
    canvas.height = canvas.clientHeight * 2;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const pad = { t: 24, r: 16, b: 32, l: 36 };
    const cw = W - pad.l - pad.r;
    const ch = H - pad.t - pad.b;
    const maxVal = Math.max(...data, 1);

    // Grid
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (ch / 4) * i;
      ctx.strokeStyle = '#e8e2da'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
      ctx.fillStyle = '#8b8594'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxVal / 4 * (4 - i)), pad.l - 6, y + 4);
    }

    // Line
    const pts = data.map((v, i) => ({
      x: pad.l + (cw / 6) * i,
      y: pad.t + ch - (v / maxVal) * ch
    }));

    // Area fill
    ctx.beginPath(); ctx.moveTo(pts[0].x, pad.t + ch);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[6].x, pad.t + ch); ctx.closePath();
    ctx.fillStyle = 'rgba(232,168,56,0.12)'; ctx.fill();

    // Line
    ctx.beginPath();
    pts.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
    ctx.strokeStyle = '#e8a838'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    ctx.stroke();

    // Dots + value labels
    pts.forEach((p, i) => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#e8a838'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke();
      if (data[i] > 0) {
        ctx.fillStyle = '#2d2a3d'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(data[i], p.x, p.y - 10);
      }
    });

    // Day labels
    const days = ['日','一','二','三','四','五','六'];
    ctx.fillStyle = '#8b8594'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
    pts.forEach((p, i) => ctx.fillText(days[i], p.x, H - 6));
    renderProgressRing(total);
  });
}


function getWeeklyGoal() {
  return parseInt(localStorage.getItem('weeklyGoal')) || 600;
}

function renderProgressRing(actual) {
  var el = document.getElementById('progressRing');
  if (!el) return;
  var goal = getWeeklyGoal();
  var pct = Math.min(100, Math.round(actual / goal * 100));
  var r = 60, circ = 2 * Math.PI * r;
  var offset = circ * (1 - pct / 100);
  el.innerHTML = '<svg width="160" height="160" viewBox="0 0 160 160"><circle cx="80" cy="80" r="' + r + '" fill="none" stroke="#e8e2da" stroke-width="10"/><circle cx="80" cy="80" r="' + r + '" fill="none" stroke="#e8a838" stroke-width="10" stroke-dasharray="' + circ + '" stroke-dashoffset="' + offset + '" transform="rotate(-90, 80, 80)" stroke-linecap="round"/><text x="80" y="72" text-anchor="middle" font-size="30" font-weight="700" fill="#2d2a3d">' + pct + '%</text><text x="80" y="96" text-anchor="middle" font-size="13" fill="#8b8594">' + actual + ' / ' + goal + ' \u5206</text></svg>';
  var gd = document.getElementById('goalDisplay');
  if (gd) gd.textContent = goal;
}

function editGoal() {
  var cur = getWeeklyGoal();
  var input = prompt('\u8bbe\u7f6e\u6bcf\u5468\u5b66\u4e60\u76ee\u6807\uff08\u5206\u949f\uff09\uff1a', cur);
  if (input === null) return;
  var val = parseInt(input);
  if (isNaN(val) || val < 1) { alert('\u8bf7\u8f93\u5165\u6709\u6548\u7684\u5206\u949f\u6570'); return; }
  localStorage.setItem('weeklyGoal', val);
  renderStats();
}

function prevWeek() {
  if (weekOffset >= 20) {
    weekOffset = 0;
  } else {
    weekOffset++;
  }
  renderStats();
}

function nextWeek() {
  if (weekOffset <= 0) return;
  weekOffset--;
  renderStats();
}

function resetWeek() {
  if (!confirm('确定重置到第1周？')) return;
  weekOffset = 0;
  renderStats();
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
      if (viewName === 'home') { renderHomeSchedule(); renderHomePlans(); }
      if (viewName === 'checkin') renderCheckinView();
      if (viewName === 'stats') renderStats();
    });
  });
  renderHomeSchedule();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
  }
});

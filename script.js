(() => {
  'use strict';

  const state = {
    selectedY: null,
    selectedM: null,
    selectedD: null,
    windowIndex: null,
    adelaideMinuteOfDay: null,
    activity: null,
  };

  const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // ACST (Adelaide standard time, UTC+9:30) is used until the daylight-saving
  // switch to ACDT (UTC+10:30) at 2am on the first Sunday of October 2026
  // (4 Oct 2026) — after that instant every date in range uses ACDT.
  const ACST_OFFSET_MIN = 9 * 60 + 30;
  const ACDT_OFFSET_MIN = 10 * 60 + 30;
  const DST_START_DATENUM = 20261004; // 4 Oct 2026
  const DST_START_MINUTE = 2 * 60;    // 2:00am local

  // India Standard Time is fixed at UTC+5:30 year-round (no DST).
  const IST_UTC_OFFSET_MIN = 5 * 60 + 30;

  // The owner's real weekly availability in Adelaide local time, repeating
  // every week. Index 0 = Sunday ... 6 = Saturday. Minutes are since
  // midnight that Adelaide calendar date.
  const WEEKLY_PATTERN = {
    0: [{ start: 0, end: 90 }, { start: 10 * 60, end: 16 * 60 }], // Sun: 12:00am-1:30am, 10am-4pm
    1: [{ start: 18 * 60, end: 24 * 60 }],                        // Mon: 6pm-12am
    2: [{ start: 0, end: 90 }],                                   // Tue: 12:00am-1:30am
    3: [{ start: 18 * 60, end: 24 * 60 }],                        // Wed: 6pm-12am
    4: [{ start: 0, end: 90 }],                                   // Thu: 12:00am-1:30am
    5: [{ start: 0, end: 90 }],                                   // Fri: 12:00am-1:30am
    6: [{ start: 10 * 60, end: 16 * 60 }],                        // Sat: 10am-4pm
  };

  // The calendar covers exactly these 4 months.
  const CALENDAR_MONTHS = [
    { y: 2026, m: 9 }, { y: 2026, m: 10 }, { y: 2026, m: 11 }, { y: 2026, m: 12 },
  ];

  function dateNum(y, m, d) { return y * 10000 + m * 100 + d; }

  function adelaideOffsetFor(y, m, d, minuteOfDay) {
    const n = dateNum(y, m, d);
    if (n < DST_START_DATENUM) return ACST_OFFSET_MIN;
    if (n > DST_START_DATENUM) return ACDT_OFFSET_MIN;
    return minuteOfDay < DST_START_MINUTE ? ACST_OFFSET_MIN : ACDT_OFFSET_MIN;
  }

  function windowsFor(y, m, d) {
    const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    return (WEEKLY_PATTERN[weekday] || []).map(w => ({
      start: w.start,
      end: w.end,
      offset: adelaideOffsetFor(y, m, d, w.start),
    }));
  }

  // "Today" in Adelaide's own calendar, used to grey out past days.
  function adelaideToday() {
    const nowUtcMillis = Date.now();
    // DST_START in UTC = 4 Oct 2026 02:00 ACST = 3 Oct 2026 16:30 UTC.
    const dstStartUtcMillis = Date.UTC(2026, 9, 3, 16, 30);
    const offset = nowUtcMillis < dstStartUtcMillis ? ACST_OFFSET_MIN : ACDT_OFFSET_MIN;
    const local = new Date(nowUtcMillis + offset * 60000);
    return { y: local.getUTCFullYear(), m: local.getUTCMonth() + 1, d: local.getUTCDate() };
  }

  // Push notification topic (https://ntfy.sh/) — the owner's phone is
  // subscribed to this topic in the ntfy app, so posting here pings them.
  const NTFY_TOPIC = 'sonydatenotification';

  function notifyDateConfirmed(shortDayLabel, timeLabel, activity) {
    // One single line: phones collapse multi-line push previews down to
    // just the first line unless the notification is expanded/tapped, so
    // splitting this across lines was hiding the time and activity.
    fetch('https://ntfy.sh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: NTFY_TOPIC,
        title: 'Sony picked a date! 💌',
        message: `${shortDayLabel} · ${timeLabel} · ${activity}`,
        tags: ['calendar', 'sparkling_heart'],
      }),
    }).catch(() => {});
  }

  /* ---------------- Sea sparkles ---------------- */
  function buildSparkles() {
    const container = document.getElementById('sparkles');
    const count = window.innerWidth < 500 ? 24 : 40;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      s.className = 'sparkle';
      const size = Math.random() * 2.5 + 1.5;
      s.style.width = `${size}px`;
      s.style.height = `${size}px`;
      s.style.top = `${Math.random() * 90}%`;
      s.style.left = `${Math.random() * 100}%`;
      s.style.animationDuration = `${1.5 + Math.random() * 2.5}s`;
      s.style.animationDelay = `${Math.random() * 3}s`;
      frag.appendChild(s);
    }
    container.appendChild(frag);
  }

  /* ---------------- Falling leaves ---------------- */
  function buildLeaves() {
    const container = document.getElementById('leaves');
    const colors = ['#d97b3f', '#c1440e', '#e8b84b', '#8a9b4f', '#a13d2b', '#caa25c', '#e0703a'];
    const count = window.innerWidth < 500 ? 14 : 22;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const leaf = document.createElement('div');
      leaf.className = 'leaf';
      const size = 8 + Math.random() * 8;
      leaf.style.width = `${size}px`;
      leaf.style.height = `${size}px`;
      leaf.style.left = `${Math.random() * 100}%`;
      leaf.style.background = colors[Math.floor(Math.random() * colors.length)];
      const duration = 9 + Math.random() * 9;
      leaf.style.animationDuration = `${duration}s`;
      // Negative delay starts the animation already in progress, so leaves
      // are visible scattered across the screen immediately on load
      // instead of only appearing after their (possibly long) delay ends.
      leaf.style.animationDelay = `-${Math.random() * duration}s`;
      frag.appendChild(leaf);
    }
    container.appendChild(frag);
  }

  /* ---------------- Flowers ---------------- */
  function buildFlowers() {
    const container = document.getElementById('flowers');
    const petalColors = ['#ff8fb1', '#ff5c7a', '#c98fff', '#ffffff', '#ff9f5c', '#8fd3ff'];
    const count = window.innerWidth < 500 ? 14 : 20;
    const petalOffsets = [
      [7, 0], [-7, 0], [0, 7], [0, -7],
      [5, 5], [-5, 5], [5, -5], [-5, -5],
    ];
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const flower = document.createElement('div');
      flower.className = 'flower';
      const scale = 0.7 + Math.random() * 0.8;
      const petalSize = 5 * scale;
      const color = petalColors[Math.floor(Math.random() * petalColors.length)];
      const boxShadow = petalOffsets
        .map(([x, y]) => `${x * scale}px ${y * scale}px 0 0 ${color}`)
        .join(', ');
      flower.style.width = `${petalSize}px`;
      flower.style.height = `${petalSize}px`;
      flower.style.boxShadow = boxShadow;
      flower.style.left = `${Math.random() * 96}%`;
      flower.style.top = `${55 + Math.random() * 40}%`;
      flower.style.animationDuration = `${3 + Math.random() * 2}s`;
      flower.style.animationDelay = `-${Math.random() * 5}s`;
      frag.appendChild(flower);
    }
    container.appendChild(frag);
  }

  /* ---------------- Screen navigation ---------------- */
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => showScreen(btn.dataset.back));
  });

  /* ---------------- Dodging "No" button ---------------- */
  function setupDodgeButton() {
    const wrap = document.getElementById('introButtons');
    const noBtn = document.getElementById('noBtn');
    const messages = ["Nice try 😏", "Nope!", "Not an option 💫", "Try again 😉", "Sony says yes ☀️"];

    function randomPointInside() {
      const wrapRect = wrap.getBoundingClientRect();
      const btnRect = noBtn.getBoundingClientRect();
      const maxLeft = Math.max(wrapRect.width - btnRect.width, 0);
      const maxTop = Math.max(wrapRect.height - btnRect.height, 0);
      return {
        left: Math.random() * maxLeft,
        top: Math.random() * (maxTop || 40) - (maxTop ? 0 : 10),
      };
    }

    function dodge() {
      wrap.classList.add('dodging');
      const wrapRect = wrap.getBoundingClientRect();
      const btnRect = noBtn.getBoundingClientRect();
      const margin = 60;
      // expand the playground a bit so the button has room to run
      const areaW = Math.max(wrapRect.width, 260);
      const areaH = 140;
      const maxLeft = Math.max(areaW - btnRect.width, 0);
      const maxTop = Math.max(areaH - btnRect.height, 0);
      const left = Math.random() * maxLeft;
      const top = Math.random() * maxTop - margin / 2;
      noBtn.style.left = `${left}px`;
      noBtn.style.top = `${top}px`;
    }

    function distance(ax, ay, bx, by) {
      return Math.hypot(ax - bx, ay - by);
    }

    document.addEventListener('mousemove', (e) => {
      const rect = noBtn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      if (distance(e.clientX, e.clientY, cx, cy) < 90) {
        dodge();
      }
    });

    const runAway = (e) => {
      e.preventDefault();
      dodge();
    };
    noBtn.addEventListener('touchstart', runAway, { passive: false });
    noBtn.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') runAway(e);
    });

    // Safety net in case a click ever lands: never proceed, just tease.
    noBtn.addEventListener('click', (e) => {
      e.preventDefault();
      noBtn.textContent = messages[Math.floor(Math.random() * messages.length)];
      dodge();
    });
  }

  /* ---------------- Calendar ---------------- */
  function weekdayName(y, m, d) {
    return WEEKDAY_NAMES[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  }

  function dateLabel(y, m, d) {
    return `${weekdayName(y, m, d)}, ${d} ${MONTH_NAMES[m - 1]} ${y}`;
  }

  let monthViewIndex = 0; // index into CALENDAR_MONTHS

  function renderMonth() {
    const { y, m } = CALENDAR_MONTHS[monthViewIndex];
    const cal = document.getElementById('calendar');
    cal.innerHTML = '';

    document.getElementById('monthLabel').textContent = `${MONTH_NAMES[m - 1]} ${y}`;
    document.getElementById('prevMonthBtn').disabled = monthViewIndex === 0;
    document.getElementById('nextMonthBtn').disabled = monthViewIndex === CALENDAR_MONTHS.length - 1;

    ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(l => {
      const el = document.createElement('div');
      el.className = 'cal-label';
      el.textContent = l;
      cal.appendChild(el);
    });

    const firstWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const today = adelaideToday();
    const todayNum = dateNum(today.y, today.m, today.d);

    for (let i = 0; i < firstWeekday; i++) {
      const el = document.createElement('div');
      el.className = 'cal-day empty';
      cal.appendChild(el);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const el = document.createElement('div');
      el.className = 'cal-day';
      el.textContent = d;

      if (dateNum(y, m, d) < todayNum) {
        // past day: leave disabled
      } else {
        el.classList.add('available');
        if (state.selectedY === y && state.selectedM === m && state.selectedD === d) {
          el.classList.add('selected');
        }
        el.addEventListener('click', () => {
          cal.querySelectorAll('.cal-day.selected').forEach(c => c.classList.remove('selected'));
          el.classList.add('selected');
          state.selectedY = y;
          state.selectedM = m;
          state.selectedD = d;
          setTimeout(() => {
            buildTimeSlots();
            showScreen('screen-time');
          }, 180);
        });
      }
      cal.appendChild(el);
    }
  }

  function setupCalendarNav() {
    document.getElementById('prevMonthBtn').addEventListener('click', () => {
      if (monthViewIndex > 0) { monthViewIndex--; renderMonth(); }
    });
    document.getElementById('nextMonthBtn').addEventListener('click', () => {
      if (monthViewIndex < CALENDAR_MONTHS.length - 1) { monthViewIndex++; renderMonth(); }
    });
  }

  /* ---------------- Time slots ---------------- */
  function formatHourMinute(hour24, minute) {
    const period = hour24 < 12 || hour24 === 24 ? 'AM' : 'PM';
    let h = hour24 % 12;
    if (h === 0) h = 12;
    return `${h}:${String(minute).padStart(2, '0')} ${period}`;
  }

  function adelaideToIST(y, m, d, minuteOfDay, offsetMin) {
    // Build the Adelaide wall-clock instant as if it were UTC, then remove
    // the Adelaide offset (ACST or ACDT, whichever applies to this window)
    // to get the true UTC instant, then add the fixed IST offset.
    const asUtcMillis = Date.UTC(y, m - 1, d, 0, minuteOfDay);
    const trueUtcMillis = asUtcMillis - offsetMin * 60000;
    const istMillis = trueUtcMillis + IST_UTC_OFFSET_MIN * 60000;
    const istDate = new Date(istMillis);
    return {
      y: istDate.getUTCFullYear(),
      m: istDate.getUTCMonth() + 1,
      d: istDate.getUTCDate(),
      hour: istDate.getUTCHours(),
      minute: istDate.getUTCMinutes(),
      utcMillis: trueUtcMillis,
    };
  }

  function buildTimeSlots() {
    const list = document.getElementById('timeList');
    const subtitle = document.getElementById('timeSubtitle');
    list.innerHTML = '';

    const { selectedY: y, selectedM: m, selectedD: d } = state;
    subtitle.textContent = `${dateLabel(y, m, d)} (Adelaide time) — shown in your time (IST)`;

    const windows = windowsFor(y, m, d);
    windows.forEach((win, windowIndex) => {
      for (let minuteOfDay = win.start; minuteOfDay < win.end; minuteOfDay += 30) {
        const adelaideHour = Math.floor(minuteOfDay / 60);
        const adelaideMinute = minuteOfDay % 60;
        const ist = adelaideToIST(y, m, d, minuteOfDay, win.offset);

        const btn = document.createElement('div');
        btn.className = 'time-slot';
        btn.innerHTML = `${formatHourMinute(ist.hour, ist.minute)} IST · ${weekdayName(ist.y, ist.m, ist.d)}, ${ist.d} ${MONTH_NAMES[ist.m - 1]}
          <span class="adelaide-note">${formatHourMinute(adelaideHour, adelaideMinute)} Adelaide time</span>`;
        btn.addEventListener('click', () => {
          state.windowIndex = windowIndex;
          state.adelaideMinuteOfDay = minuteOfDay;
          showScreen('screen-activity');
        });
        list.appendChild(btn);
      }
    });
  }

  /* ---------------- Activity ---------------- */
  function setupActivities() {
    document.querySelectorAll('.activity-card').forEach(card => {
      card.addEventListener('click', () => {
        state.activity = card.dataset.activity;
        buildSummary();
        showScreen('screen-summary');
      });
    });
  }

  /* ---------------- Summary ---------------- */
  function pad2(n) { return String(n).padStart(2, '0'); }

  function toGCalUTCString(millis) {
    const d = new Date(millis);
    return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}00Z`;
  }

  function buildSummary() {
    const { selectedY: y, selectedM: m, selectedD: d } = state;
    const win = windowsFor(y, m, d)[state.windowIndex];
    const ist = adelaideToIST(y, m, d, state.adelaideMinuteOfDay, win.offset);
    const startMillis = ist.utcMillis;
    const endMillis = startMillis + 60 * 60000; // 1 hour date

    const istDayLabel = `${weekdayName(ist.y, ist.m, ist.d)}, ${ist.d} ${MONTH_NAMES[ist.m - 1]} ${ist.y}`;
    const timeLabel = `${formatHourMinute(ist.hour, ist.minute)} IST`;
    const adelaideHour = Math.floor(state.adelaideMinuteOfDay / 60);
    const adelaideMinute = state.adelaideMinuteOfDay % 60;

    document.getElementById('summaryDetails').innerHTML = `
      <span class="big-emoji">☀️💌</span>
      <div><strong>${istDayLabel}</strong></div>
      <div>${timeLabel}</div>
      <div>${state.activity}</div>
      <div class="muted">(${formatHourMinute(adelaideHour, adelaideMinute)} ${dateLabel(y, m, d)} Adelaide time)</div>
    `;

    const titleText = `Virtual date with Sony ☀️ — ${state.activity}`;
    const detailsText = `Our first virtual date!\nActivity: ${state.activity}\n(Shown in IST for Sony; ${formatHourMinute(adelaideHour, adelaideMinute)} ${dateLabel(y, m, d)} Adelaide time)`;
    const dates = `${toGCalUTCString(startMillis)}/${toGCalUTCString(endMillis)}`;
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(titleText)}&dates=${dates}&details=${encodeURIComponent(detailsText)}`;
    document.getElementById('gcalBtn').href = gcalUrl;

    const shortDayLabel = `${weekdayName(ist.y, ist.m, ist.d).slice(0, 3)} ${ist.d} ${MONTH_NAMES[ist.m - 1].slice(0, 3)}`;
    notifyDateConfirmed(shortDayLabel, timeLabel, state.activity);
  }

  /* ---------------- Restart ---------------- */
  function setupRestart() {
    document.getElementById('restartBtn').addEventListener('click', () => {
      state.selectedY = null;
      state.selectedM = null;
      state.selectedD = null;
      state.windowIndex = null;
      state.adelaideMinuteOfDay = null;
      state.activity = null;
      monthViewIndex = 0;
      renderMonth();
      showScreen('screen-intro');
    });
  }

  /* ---------------- Init ---------------- */
  function init() {
    buildSparkles();
    buildLeaves();
    buildFlowers();
    renderMonth();
    setupCalendarNav();
    setupDodgeButton();
    setupActivities();
    setupRestart();

    document.getElementById('yesBtn').addEventListener('click', () => {
      showScreen('screen-calendar');
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();

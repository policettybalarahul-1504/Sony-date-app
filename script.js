(() => {
  'use strict';

  const state = {
    dateIndex: null,  // index into AVAILABLE_DATES
    windowIndex: null,
    adelaideMinuteOfDay: null,
    activity: null,
  };

  const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // ACST (Adelaide standard time, UTC+9:30) is used until the daylight-saving
  // switch to ACDT (UTC+10:30) at 2am on the first Sunday of October — which
  // falls on 4 Oct 2026, right in the middle of this availability window.
  const ACST_OFFSET_MIN = 9 * 60 + 30;
  const ACDT_OFFSET_MIN = 10 * 60 + 30;
  // India Standard Time is fixed at UTC+5:30 year-round (no DST).
  const IST_UTC_OFFSET_MIN = 5 * 60 + 30;

  // The owner's real weekly availability in Adelaide local time, mapped onto
  // the one week of actual dates it applies to. Each window is in minutes
  // since midnight that Adelaide calendar date, with the correct standard
  // vs. daylight offset for that specific window.
  const AVAILABLE_DATES = [
    { y: 2026, m: 9, d: 28, windows: [{ start: 18 * 60, end: 24 * 60, offset: ACST_OFFSET_MIN }] },       // Mon 6:00pm-12:00am
    { y: 2026, m: 9, d: 29, windows: [{ start: 0, end: 90, offset: ACST_OFFSET_MIN }] },                  // Tue 12:00am-1:30am
    { y: 2026, m: 9, d: 30, windows: [{ start: 18 * 60, end: 24 * 60, offset: ACST_OFFSET_MIN }] },       // Wed 6:00pm-12:00am
    { y: 2026, m: 10, d: 1, windows: [{ start: 0, end: 90, offset: ACST_OFFSET_MIN }] },                  // Thu 12:00am-1:30am
    { y: 2026, m: 10, d: 2, windows: [{ start: 0, end: 90, offset: ACST_OFFSET_MIN }] },                  // Fri 12:00am-1:30am
    { y: 2026, m: 10, d: 3, windows: [{ start: 10 * 60, end: 16 * 60, offset: ACST_OFFSET_MIN }] },       // Sat 10:00am-4:00pm
    { y: 2026, m: 10, d: 4, windows: [                                                                     // Sun (DST starts 2am today)
      { start: 0, end: 90, offset: ACST_OFFSET_MIN },        // 12:00am-1:30am, still ACST
      { start: 10 * 60, end: 16 * 60, offset: ACDT_OFFSET_MIN }, // 10:00am-4:00pm, now ACDT
    ] },
  ];

  // Push notification topic (https://ntfy.sh/) — the owner's phone is
  // subscribed to this topic in the ntfy app, so posting here pings them.
  const NTFY_TOPIC = 'sonydatenotification';

  function notifyDateSelected(label) {
    fetch('https://ntfy.sh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: NTFY_TOPIC,
        title: 'Sony picked a date! 💌',
        message: `She chose ${label} ☀️`,
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

  function dateLabel(entry) {
    return `${weekdayName(entry.y, entry.m, entry.d)}, ${entry.d} ${MONTH_NAMES[entry.m - 1]} ${entry.y}`;
  }

  function buildCalendar() {
    const cal = document.getElementById('calendar');
    cal.innerHTML = '';

    AVAILABLE_DATES.forEach((entry, index) => {
      const el = document.createElement('div');
      el.className = 'time-slot';
      el.textContent = dateLabel(entry);
      el.addEventListener('click', () => {
        cal.querySelectorAll('.time-slot.selected').forEach(d => d.classList.remove('selected'));
        el.classList.add('selected');
        state.dateIndex = index;
        notifyDateSelected(dateLabel(entry));
        setTimeout(() => {
          buildTimeSlots();
          showScreen('screen-time');
        }, 180);
      });
      cal.appendChild(el);
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

    const entry = AVAILABLE_DATES[state.dateIndex];
    subtitle.textContent = `${dateLabel(entry)} (Adelaide time) — shown in your time (IST)`;

    entry.windows.forEach((win, windowIndex) => {
      for (let minuteOfDay = win.start; minuteOfDay < win.end; minuteOfDay += 30) {
        const adelaideHour = Math.floor(minuteOfDay / 60);
        const adelaideMinute = minuteOfDay % 60;
        const ist = adelaideToIST(entry.y, entry.m, entry.d, minuteOfDay, win.offset);

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
    const entry = AVAILABLE_DATES[state.dateIndex];
    const win = entry.windows[state.windowIndex];
    const ist = adelaideToIST(entry.y, entry.m, entry.d, state.adelaideMinuteOfDay, win.offset);
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
      <div class="muted">(${formatHourMinute(adelaideHour, adelaideMinute)} ${dateLabel(entry)} Adelaide time)</div>
    `;

    const titleText = `Virtual date with Sony ☀️ — ${state.activity}`;
    const detailsText = `Our first virtual date!\nActivity: ${state.activity}\n(Shown in IST for Sony; ${formatHourMinute(adelaideHour, adelaideMinute)} ${dateLabel(entry)} Adelaide time)`;
    const dates = `${toGCalUTCString(startMillis)}/${toGCalUTCString(endMillis)}`;
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(titleText)}&dates=${dates}&details=${encodeURIComponent(detailsText)}`;
    document.getElementById('gcalBtn').href = gcalUrl;
  }

  /* ---------------- Restart ---------------- */
  function setupRestart() {
    document.getElementById('restartBtn').addEventListener('click', () => {
      state.dateIndex = null;
      state.windowIndex = null;
      state.adelaideMinuteOfDay = null;
      state.activity = null;
      document.querySelectorAll('#calendar .time-slot.selected').forEach(d => d.classList.remove('selected'));
      showScreen('screen-intro');
    });
  }

  /* ---------------- Init ---------------- */
  function init() {
    buildSparkles();
    buildCalendar();
    setupDodgeButton();
    setupActivities();
    setupRestart();

    document.getElementById('yesBtn').addEventListener('click', () => {
      showScreen('screen-calendar');
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();

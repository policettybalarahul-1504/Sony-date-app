(() => {
  'use strict';

  const state = {
    day: null,       // 18, 19, or 20
    adelaideHour: null,
    adelaideMinute: null,
    activity: null,
  };

  const YEAR = 2026;
  const MONTH = 9; // September
  const AVAILABLE_DAYS = [18, 19, 20];

  // Adelaide (ACST, UTC+9:30) is not yet in daylight saving in September,
  // so the offset from UTC is fixed at +9:30 for these dates.
  const ADELAIDE_UTC_OFFSET_MIN = 9 * 60 + 30;
  // India Standard Time is fixed at UTC+5:30 year-round.
  const IST_UTC_OFFSET_MIN = 5 * 60 + 30;

  // Fill these in after deploying the Google Apps Script web app (see
  // apps-script/Code.gs). Left blank, the auto-notify step is skipped.
  const NOTIFY_URL = '';
  const NOTIFY_SECRET = '';

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
  function buildCalendar() {
    const cal = document.getElementById('calendar');
    const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    labels.forEach(l => {
      const el = document.createElement('div');
      el.className = 'cal-label';
      el.textContent = l;
      cal.appendChild(el);
    });

    const firstWeekday = new Date(Date.UTC(YEAR, MONTH - 1, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(YEAR, MONTH, 0)).getUTCDate();

    for (let i = 0; i < firstWeekday; i++) {
      const el = document.createElement('div');
      el.className = 'cal-day empty';
      cal.appendChild(el);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const el = document.createElement('div');
      el.className = 'cal-day';
      el.textContent = day;
      if (AVAILABLE_DAYS.includes(day)) {
        el.classList.add('available');
        el.addEventListener('click', () => {
          cal.querySelectorAll('.cal-day.selected').forEach(d => d.classList.remove('selected'));
          el.classList.add('selected');
          state.day = day;
          setTimeout(() => {
            buildTimeSlots();
            showScreen('screen-time');
          }, 180);
        });
      }
      cal.appendChild(el);
    }
  }

  /* ---------------- Time slots ---------------- */
  function formatHourMinute(hour24, minute) {
    const period = hour24 < 12 || hour24 === 24 ? 'AM' : 'PM';
    let h = hour24 % 12;
    if (h === 0) h = 12;
    return `${h}:${String(minute).padStart(2, '0')} ${period}`;
  }

  function adelaideToIST(hour, minute) {
    // Build the Adelaide wall-clock instant as if it were UTC, then remove
    // the Adelaide offset to get the true UTC instant, then add the IST
    // offset to get IST wall-clock time.
    const asUtcMillis = Date.UTC(YEAR, MONTH - 1, state.day, hour, minute);
    const trueUtcMillis = asUtcMillis - ADELAIDE_UTC_OFFSET_MIN * 60000;
    const istMillis = trueUtcMillis + IST_UTC_OFFSET_MIN * 60000;
    const istDate = new Date(istMillis);
    return {
      hour: istDate.getUTCHours(),
      minute: istDate.getUTCMinutes(),
      utcMillis: trueUtcMillis,
    };
  }

  function buildTimeSlots() {
    const list = document.getElementById('timeList');
    const subtitle = document.getElementById('timeSubtitle');
    list.innerHTML = '';

    const dayLabel = `${state.day} September 2026`;
    subtitle.textContent = `${dayLabel} — shown in your time (IST)`;

    // Adelaide slots from 12:00 PM to 4:00 PM, every 30 minutes.
    const startMinutesOfDay = 12 * 60;
    const endMinutesOfDay = 16 * 60;
    for (let m = startMinutesOfDay; m < endMinutesOfDay; m += 30) {
      const adelaideHour = Math.floor(m / 60);
      const adelaideMinute = m % 60;
      const ist = adelaideToIST(adelaideHour, adelaideMinute);

      const btn = document.createElement('div');
      btn.className = 'time-slot';
      btn.innerHTML = `${formatHourMinute(ist.hour, ist.minute)} IST
        <span class="adelaide-note">${formatHourMinute(adelaideHour, adelaideMinute)} Adelaide time</span>`;
      btn.addEventListener('click', () => {
        state.adelaideHour = adelaideHour;
        state.adelaideMinute = adelaideMinute;
        showScreen('screen-activity');
      });
      list.appendChild(btn);
    }
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

  function notifyLoverByEmail(startMillis, endMillis, titleText, detailsText) {
    if (!NOTIFY_URL) return; // not configured yet
    const url = `${NOTIFY_URL}?start=${startMillis}&end=${endMillis}`
      + `&title=${encodeURIComponent(titleText)}`
      + `&details=${encodeURIComponent(detailsText)}`
      + `&secret=${encodeURIComponent(NOTIFY_SECRET)}`;
    // Fire-and-forget: Apps Script web apps don't send CORS headers, so we
    // can't read the response, but the request still reaches and runs it.
    fetch(url, { mode: 'no-cors' }).catch(() => {});
  }

  function buildSummary() {
    const ist = adelaideToIST(state.adelaideHour, state.adelaideMinute);
    const startMillis = ist.utcMillis;
    const endMillis = startMillis + 60 * 60000; // 1 hour date

    const dayLabel = `${state.day} September 2026`;
    const timeLabel = `${formatHourMinute(ist.hour, ist.minute)} IST`;

    document.getElementById('summaryDetails').innerHTML = `
      <span class="big-emoji">☀️💌</span>
      <div><strong>${dayLabel}</strong></div>
      <div>${timeLabel}</div>
      <div>${state.activity}</div>
      <div class="muted">(${formatHourMinute(state.adelaideHour, state.adelaideMinute)} Adelaide time)</div>
    `;

    const titleText = `Virtual date with Sony ☀️ — ${state.activity}`;
    const detailsText = `Our first virtual date!\nActivity: ${state.activity}\n(Shown in IST for Sony; ${formatHourMinute(state.adelaideHour, state.adelaideMinute)} Adelaide time)`;
    const dates = `${toGCalUTCString(startMillis)}/${toGCalUTCString(endMillis)}`;
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(titleText)}&dates=${dates}&details=${encodeURIComponent(detailsText)}`;
    document.getElementById('gcalBtn').href = gcalUrl;

    notifyLoverByEmail(startMillis, endMillis, titleText, detailsText);
  }

  /* ---------------- Restart ---------------- */
  function setupRestart() {
    document.getElementById('restartBtn').addEventListener('click', () => {
      state.day = null;
      state.adelaideHour = null;
      state.adelaideMinute = null;
      state.activity = null;
      document.querySelectorAll('.cal-day.selected').forEach(d => d.classList.remove('selected'));
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

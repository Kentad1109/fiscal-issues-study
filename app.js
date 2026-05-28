// ─── Constants ───────────────────────────────────────────────
const LANG_KEY     = 'fiscalLang';
const PROGRESS_KEY = 'fiscalProgress_v3';
const TOTAL_QUESTIONS = { unit1: 9, unit2: 9, unit3: 10, unit4: 9, unit5: 10 }; // 47 total
const RING_CIRC = 113; // 2π × 18

// ─── Language Toggle ─────────────────────────────────────────
function setLang(lang) {
  document.body.classList.toggle('lang-jp', lang === 'jp');
  document.querySelectorAll('.lang-toggle').forEach(btn => {
    btn.textContent = lang === 'jp' ? '🇺🇸 English' : '🇯🇵 日本語';
  });
  localStorage.setItem(LANG_KEY, lang);
}
function initLang() {
  const saved = localStorage.getItem(LANG_KEY) || 'en';
  setLang(saved);
}

// ─── Progress Storage ────────────────────────────────────────
function getProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; }
  catch { return {}; }
}
function saveAnswer(unitId, qIndex, isCorrect) {
  const p = getProgress();
  if (!p[unitId]) p[unitId] = {};
  if (p[unitId][qIndex] === undefined) p[unitId][qIndex] = isCorrect;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}
function getUnitStats(unitId) {
  const p = getProgress();
  const u = p[unitId] || {};
  const keys = Object.keys(u);
  return {
    answered: keys.length,
    correct: keys.filter(k => u[k]).length,
    total: TOTAL_QUESTIONS[unitId] || 0
  };
}
function getAllStats() {
  let totalAnswered = 0, totalCorrect = 0, totalQ = 0, unitsStarted = 0;
  Object.keys(TOTAL_QUESTIONS).forEach(uid => {
    const s = getUnitStats(uid);
    totalAnswered += s.answered;
    totalCorrect  += s.correct;
    totalQ        += s.total;
    if (s.answered > 0) unitsStarted++;
  });
  return { totalAnswered, totalCorrect, totalQ, unitsStarted };
}

// ─── Index Page Dashboard ────────────────────────────────────
function initIndexPage() {
  const stats = getAllStats();

  const el = id => document.getElementById(id);
  const set = (i, v) => { if (el(i)) el(i).textContent = v; };
  set('stat-answered', `${stats.totalAnswered}`);
  set('stat-correct',  stats.totalCorrect);
  set('stat-units',    `${stats.unitsStarted}/5`);

  // Hero progress bar
  const heroPct = stats.totalQ > 0 ? Math.round(stats.totalAnswered / stats.totalQ * 100) : 0;
  const heroFill = document.getElementById('hero-fill');
  if (heroFill) heroFill.style.width = heroPct + '%';
  const heroLbl = document.getElementById('hero-pct');
  if (heroLbl) heroLbl.textContent = heroPct + '%';

  // Unit deck cards
  document.querySelectorAll('[data-unit-id]').forEach(card => {
    const uid = card.dataset.unitId;
    const s   = getUnitStats(uid);
    const pct = s.total > 0 ? Math.round(s.correct / s.total * 100) : 0;

    // Ring
    const ringFill = card.querySelector('.ring-fill');
    if (ringFill) {
      // Delay for CSS transition
      setTimeout(() => {
        ringFill.style.strokeDashoffset = RING_CIRC - (RING_CIRC * pct / 100);
      }, 200);
    }
    // Ring label
    const ringLbl = card.querySelector('.udc-ring-label');
    if (ringLbl) ringLbl.textContent = s.answered > 0 ? `${s.correct}/${s.total}` : '?';

    // Inline progress bar
    const barFill = card.querySelector('.udc-bar-fill');
    if (barFill) setTimeout(() => { barFill.style.width = pct + '%'; }, 200);

    // Score label
    const scoreLbl = card.querySelector('.udc-score-txt');
    if (scoreLbl) {
      if (s.answered === 0) scoreLbl.textContent = 'Not started yet';
      else if (s.correct === s.total) scoreLbl.textContent = '✓ Mastered!';
      else scoreLbl.textContent = `${s.correct}/${s.total} correct`;
    }
  });
}

// ─── Quiz Engine ─────────────────────────────────────────────
let activeQuizContainer = null;

function initQuizzes() {
  const unitId = detectUnitId();

  document.querySelectorAll('[data-quiz]').forEach(container => {
    activeQuizContainer = container;
    const questions = Array.from(container.querySelectorAll('.question-block'));
    const submitBtn  = container.querySelector('.quiz-submit');
    const resultEl   = container.querySelector('.quiz-result');
    const scoreEl    = container.querySelector('.quiz-score');
    let answered     = new Set();
    let correctCount = 0;

    // Restore previously answered count from localStorage (display only)
    if (unitId) {
      const s = getUnitStats(unitId);
      if (s.answered > 0 && scoreEl) {
        scoreEl.textContent = `${s.correct}/${s.total} mastered`;
      }
    }

    questions.forEach((qBlock, qi) => {
      const options     = Array.from(qBlock.querySelectorAll('.option'));
      const correct     = parseInt(qBlock.dataset.correct);
      const deepLink    = qBlock.dataset.deepLink  || '';
      const deepLabel   = qBlock.dataset.deepLabel || 'Study this concept';
      const explanation = qBlock.querySelector('.explanation');

      // Add keyboard number hints to each option
      options.forEach((opt, oi) => {
        const hint = document.createElement('span');
        hint.className = 'option-key';
        hint.textContent = oi + 1;
        opt.prepend(hint);
      });

      options.forEach((opt, oi) => {
        opt.addEventListener('click', () => {
          if (answered.has(qi)) return;
          answered.add(qi);
          options.forEach(o => o.classList.add('answered'));

          const isCorrect = oi === correct;
          if (isCorrect) {
            opt.classList.add('selected-correct');
            correctCount++;
          } else {
            opt.classList.add('selected-wrong');
            options[correct].classList.add('show-correct');
          }

          if (explanation) {
            explanation.classList.add('visible');
            if (deepLink && !explanation.querySelector('.deep-link')) {
              const a = document.createElement('a');
              a.className   = 'deep-link';
              a.href        = deepLink;
              a.innerHTML   = `📖 ${deepLabel} →`;
              explanation.appendChild(a);
            }
          }

          if (unitId) saveAnswer(unitId, qi, isCorrect);
          updateProgress(container, answered.size, questions.length, scoreEl, correctCount);

          // Auto-scroll to next unanswered question
          if (answered.size < questions.length) {
            const next = questions.find((_, i) => i > qi && !answered.has(i));
            if (next) setTimeout(() => next.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 600);
          }
        });
      });
    });

    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        questions.forEach(qBlock => {
          const exp = qBlock.querySelector('.explanation');
          if (exp) exp.classList.add('visible');
        });
        showResult(resultEl, correctCount, questions.length);
        submitBtn.disabled = true;
      });
    }

    updateProgress(container, 0, questions.length, scoreEl, 0);
  });
}

function detectUnitId() {
  const path  = location.pathname.split('/').pop();
  const match = path.match(/unit(\d)/);
  return match ? `unit${match[1]}` : null;
}

function updateProgress(container, done, total, scoreEl, correct) {
  const bar = container.querySelector('.progress-fill');
  if (bar) bar.style.width = (done / total * 100) + '%';
  if (scoreEl) {
    if (done === 0) scoreEl.textContent = `0 / ${total} answered`;
    else scoreEl.textContent = `${done} / ${total}  ·  ✓ ${correct} correct`;
  }
}

function showResult(el, score, total) {
  if (!el) return;
  const pct  = Math.round(score / total * 100);
  const pass = pct >= 70;
  el.classList.add('visible', pass ? 'pass' : 'fail');
  el.innerHTML = `
    <div class="result-icon">${pass ? '🎉' : '📚'}</div>
    <h3>${pass ? 'Well done!' : 'Keep studying'}</h3>
    <p class="result-score"><strong>${score}/${total}</strong> correct &nbsp;·&nbsp; ${pct}%</p>
    <p class="result-msg">${pass
      ? 'Great grasp of the material. Move on to the next unit!'
      : 'Review the explanations above, then try again.'}</p>
    <button class="quiz-reset">↺ Try Again</button>
  `;
  el.querySelector('.quiz-reset').addEventListener('click', () => location.reload());
}

// ─── Keyboard Navigation ─────────────────────────────────────
function initKeyboard() {
  document.addEventListener('keydown', e => {
    if (!activeQuizContainer) return;
    if (!['1','2','3','4'].includes(e.key)) return;
    const target = e.target;
    if (target && ['INPUT','TEXTAREA','SELECT'].includes(target.tagName)) return;

    const questions = Array.from(activeQuizContainer.querySelectorAll('.question-block'));
    const unanswered = questions.find(q => !q.querySelector('.option.answered'));
    if (!unanswered) return;
    const idx  = parseInt(e.key) - 1;
    const opts = unanswered.querySelectorAll('.option');
    if (opts[idx]) opts[idx].click();
  });
}

// ─── DOMContentLoaded ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initLang();

  document.querySelectorAll('.lang-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const cur = document.body.classList.contains('lang-jp') ? 'jp' : 'en';
      setLang(cur === 'jp' ? 'en' : 'jp');
    });
  });

  // Active nav highlight (topnav + sidebar)
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav.topnav a, .sidebar-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) a.classList.add('active');
  });

  if (path === 'index.html' || path === '' || path === 'overview.html') initIndexPage();
  initQuizzes();
  initKeyboard();
});

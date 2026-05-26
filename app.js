// ── Language Toggle ──────────────────────────────────────────
const LANG_KEY = 'fiscalLang';

function setLang(lang) {
  document.body.classList.toggle('lang-jp', lang === 'jp');
  const btn = document.querySelector('.lang-toggle');
  if (btn) btn.textContent = lang === 'jp' ? '🇺🇸 English' : '🇯🇵 日本語';
  localStorage.setItem(LANG_KEY, lang);
}

function initLang() {
  const saved = localStorage.getItem(LANG_KEY) || 'en';
  setLang(saved);
}

document.addEventListener('DOMContentLoaded', () => {
  initLang();
  const btn = document.querySelector('.lang-toggle');
  if (btn) btn.addEventListener('click', () => {
    const cur = document.body.classList.contains('lang-jp') ? 'jp' : 'en';
    setLang(cur === 'jp' ? 'en' : 'jp');
  });

  // Active nav link
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav.topnav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) a.classList.add('active');
  });

  initQuizzes();
});

// ── Quiz Engine ───────────────────────────────────────────────
function initQuizzes() {
  document.querySelectorAll('[data-quiz]').forEach(container => {
    const questions = Array.from(container.querySelectorAll('.question-block'));
    const submitBtn = container.querySelector('.quiz-submit');
    const resultEl  = container.querySelector('.quiz-result');
    const scoreEl   = container.querySelector('.quiz-score');
    const resetBtn  = container.querySelector('.quiz-reset');
    let answered = new Set();

    questions.forEach((qBlock, qi) => {
      const options = qBlock.querySelectorAll('.option');
      const correct = parseInt(qBlock.dataset.correct);
      const explanation = qBlock.querySelector('.explanation');

      options.forEach((opt, oi) => {
        opt.addEventListener('click', () => {
          if (answered.has(qi)) return;
          answered.add(qi);
          options.forEach(o => o.classList.add('answered'));

          if (oi === correct) {
            opt.classList.add('selected-correct');
          } else {
            opt.classList.add('selected-wrong');
            options[correct].classList.add('show-correct');
          }
          if (explanation) explanation.classList.add('visible');
          updateProgress(container, answered.size, questions.length, scoreEl);
        });
      });
    });

    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        let score = 0;
        questions.forEach((qBlock, qi) => {
          const sel = qBlock.querySelector('.option.selected-correct');
          if (sel) score++;
          const explanation = qBlock.querySelector('.explanation');
          if (explanation) explanation.classList.add('visible');
        });
        showResult(resultEl, score, questions.length);
        submitBtn.disabled = true;
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        answered.clear();
        questions.forEach(qBlock => {
          qBlock.querySelectorAll('.option').forEach(o => {
            o.classList.remove('selected-correct','selected-wrong','show-correct','answered');
          });
          const exp = qBlock.querySelector('.explanation');
          if (exp) exp.classList.remove('visible');
        });
        if (resultEl) resultEl.classList.remove('visible','pass','fail');
        if (submitBtn) submitBtn.disabled = false;
        updateProgress(container, 0, questions.length, scoreEl);
      });
    }

    updateProgress(container, 0, questions.length, scoreEl);
  });
}

function updateProgress(container, done, total, scoreEl) {
  const bar = container.querySelector('.progress-fill');
  if (bar) bar.style.width = (done / total * 100) + '%';
  if (scoreEl) scoreEl.textContent = `${done} / ${total} answered`;
}

function showResult(el, score, total) {
  if (!el) return;
  const pct = Math.round(score / total * 100);
  const pass = pct >= 70;
  el.classList.add('visible', pass ? 'pass' : 'fail');
  el.innerHTML = `
    <h3>${pass ? '✓ Well done!' : '✗ Keep studying'}</h3>
    <p style="color:var(--text-secondary)">You got <strong style="color:var(--text-primary)">${score}/${total}</strong> correct (${pct}%)</p>
    ${pass ? '<p style="color:var(--success);font-size:0.9rem;margin-top:6px;">Great understanding of the material!</p>'
            : '<p style="color:var(--text-muted);font-size:0.9rem;margin-top:6px;">Review the sections above and try again.</p>'}
    <button class="quiz-reset">Try Again</button>
  `;
  el.querySelector('.quiz-reset').addEventListener('click', () => {
    el.closest('[data-quiz]').querySelector('.quiz-reset')?.click() ||
    el.classList.remove('visible','pass','fail');
  });
}

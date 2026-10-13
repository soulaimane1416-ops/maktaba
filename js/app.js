/* مكتبة الطالب الإسلامية — Core */
const $ = s => document.querySelector(s);
const app = $("#app");

function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove("show"),2600); }
function esc(s){ return String(s).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

/* ---------- Theme ---------- */
function initTheme(){
  const saved = localStorage.getItem("mt-theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  $("#themeBtn").textContent = saved==="dark" ? "☾" : "☀";
}
$("#themeBtn").addEventListener("click", ()=>{
  const cur = document.documentElement.getAttribute("data-theme")==="dark" ? "light":"dark";
  document.documentElement.setAttribute("data-theme", cur);
  localStorage.setItem("mt-theme", cur);
  $("#themeBtn").textContent = cur==="dark" ? "☾" : "☀";
});

/* ---------- Tabs ---------- */
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
  const t=b.dataset.tab;
  if(t==="home") renderHome();
  else if(t==="quran") QuranUI.list();
  else if(t==="library") renderLibrary();
  else if(t==="tajweed") renderTajweed();
  else if(t==="quiz") QuizUI.menu();
  window.scrollTo({top:0});
}));

/* ---------- Home ---------- */
function sectionCard(s){
  return `<div class="card" onclick="goSection('${s.id}')">
    <div class="ic">${s.icon}</div><h3>${s.title}</h3><p>${s.sub}</p></div>`;
}
function renderHome(){
  app.innerHTML = `<div class="view">
    <div class="hero">
      <h2>مكتبة الطالب الإسلامية</h2>
      <p>علمٌ منظم، وتجويد، وتفسير، واختبارات — كل ما يحتاجه طالب العلم في مكان واحد</p>
      <div class="ornament">✦ ✦ ✦</div>
    </div>
    <div class="sec-title">أقسام المكتبة</div>
    <div class="grid">${LIBRARY.map(sectionCard).join("")}</div>
    <div class="sec-title">اختر قسماً للاختبار</div>
    <div class="grid">
      <div class="card" onclick="document.querySelector('[data-tab=quiz]').click()">
        <div class="ic"><svg viewBox="0 0 24 24"><path d="M9 11l3 3 8-8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></div>
        <h3>اختبر نفسك</h3><p>أسئلة في كل الأقسام مع النتيجة</p>
      </div>
      <div class="card" onclick="document.querySelector('[data-tab=quran]').click()">
        <div class="ic"><svg viewBox="0 0 24 24"><path d="M12 3c-2.5 2.5-6 4-9.5 4v13c3.5 0 7-1.5 9.5-4 2.5 2.5 6 4 9.5 4V7c-3.5 0-7-1.5-9.5-4z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></div>
        <h3>اقرأ القرآن</h3><p>برواية حفص مع التفسير الميسّر</p>
      </div>
    </div>
    <div class="note">نصوص القرآن برواية حفص عن عاصم (رسم عثماني)، والتفسير الميسّر من مجمع الملك فهد — عبر واجهات برمجية موثوقة. المحتوى التعليمي مختصر للمدارسة.</div>
  </div>`;
}
function goSection(id){
  document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active", x.dataset.tab==="library"));
  renderBook(id);
}

/* ---------- Library ---------- */
function renderLibrary(){
  app.innerHTML = `<div class="view">
    <div class="book-head"><h2>المكتبة</h2><p>كتب منظمة بأقسام وأيقونات</p></div>
    <div class="grid">${LIBRARY.map(sectionCard).join("")}</div></div>`;
}
function renderBook(id){
  const sec = LIBRARY.find(s=>s.id===id); if(!sec) return renderLibrary();
  app.innerHTML = `<div class="view">
    <button class="back-btn" onclick="renderLibrary()">→ رجوع للمكتبة</button>
    <div class="book-head"><h2>${sec.title}</h2><p>${sec.sub}</p><div class="ornament">✦</div></div>
    ${sec.chapters.map((c,i)=>`
      <div class="chapter" id="ch-${i}">
        <button onclick="toggleChapter(${i})"><span>${esc(c.t)}</span><span class="chev">▾</span></button>
        <div class="body"><div class="inner">${c.b}</div></div>
      </div>`).join("")}
    <div style="text-align:center;margin-top:18px"><button class="btn ghost" onclick="QuizUI.start('${quizMap(id)}')">اختبر نفسك في هذا القسم</button></div>
  </div>`;
  window.scrollTo({top:0});
}
function toggleChapter(i){
  const el = $("#ch-"+i); if(!el) return;
  const was = el.classList.contains("open");
  document.querySelectorAll(".chapter.open").forEach(x=>x.classList.remove("open"));
  if(!was) el.classList.add("open");
}
function quizMap(id){
  return {usool:"usool",qawaid:"qawaid",tawhid:"tawhid",seerah:"seerah",proofs:"proofs",tajweed:"tajweed"}[id] || "quran";
}
function renderTajweed(){
  document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active", x.dataset.tab==="tajweed"));
  renderBook("tajweed");
}

/* ---------- Quiz ---------- */
const QuizUI = {
  data:[], idx:0, score:0, sec:"",
  menu(){
    const best = JSON.parse(localStorage.getItem("mt-quiz-best")||"{}");
    app.innerHTML = `<div class="view"><div class="book-head"><h2>الاختبارات</h2><p>اختر القسم واختبر معلوماتك</p><div class="ornament">✦</div></div>
    ${QUIZ_SECTIONS.map(s=>`
      <div class="list-item" onclick="QuizUI.start('${s.id}')">
        <div class="num">؟</div>
        <div class="meta"><h4>${s.t}</h4><small>10 أسئلة ${best[s.id]!=null?`— أفضل نتيجة: ${best[s.id]}/10`:""}</small></div>
        <div class="chev">‹</div>
      </div>`).join("")}</div>`;
  },
  start(sec){
    this.data = [...(QUIZ[sec]||[])].sort(()=>Math.random()-.5);
    this.idx=0; this.score=0; this.sec=sec;
    if(!this.data.length){ toast("لا توجد أسئلة لهذا القسم بعد"); return; }
    this.render();
    window.scrollTo({top:0});
  },
  render(){
    const q=this.data[this.idx], n=this.data.length;
    const title = (QUIZ_SECTIONS.find(s=>s.id===this.sec)||{}).t || "";
    app.innerHTML = `<div class="view"><div class="quiz-card">
      <div class="quiz-progress"><i style="width:${(this.idx/n)*100}%"></i></div>
      <p style="color:var(--ink-faint);font-size:.78rem;margin-bottom:8px">${title} — سؤال ${this.idx+1} من ${n}</p>
      <div class="quiz-q">${esc(q.q)}</div>
      ${q.o.map((op,i)=>`<button class="quiz-opt" onclick="QuizUI.answer(${i},this)">${esc(op)}</button>`).join("")}
    </div></div>`;
  },
  answer(i,btn){
    const q=this.data[this.idx];
    const btns=[...document.querySelectorAll(".quiz-opt")];
    btns.forEach(b=>b.disabled=true);
    btns[q.a].classList.add("correct");
    if(i===q.a){ this.score++; } else { btn.classList.add("wrong"); }
    setTimeout(()=>{
      this.idx++;
      if(this.idx<this.data.length) this.render(); else this.finish();
    }, 900);
  },
  finish(){
    const n=this.data.length, pct=Math.round(this.score/n*100);
    const best=JSON.parse(localStorage.getItem("mt-quiz-best")||"{}");
    if(!best[this.sec] || this.score>best[this.sec]){ best[this.sec]=this.score; localStorage.setItem("mt-quiz-best",JSON.stringify(best)); }
    let msg = pct>=80 ? "ممتاز! بارك الله فيك" : pct>=50 ? "جيد، واصل التقدم" : "لا بأس، راجع الدرس وحاول مجدداً";
    app.innerHTML = `<div class="view"><div class="quiz-card quiz-result">
      <div class="ornament">✦</div>
      <div class="score">${this.score}/${n}</div>
      <p style="margin:10px 0;color:var(--ink-dim)">${msg}</p>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:16px;flex-wrap:wrap">
        <button class="btn" onclick="QuizUI.start('${this.sec}')">إعادة المحاولة</button>
        <button class="btn ghost" onclick="QuizUI.menu()">أقسام أخرى</button>
      </div></div></div>`;
  }
};

/* ---------- Boot ---------- */
initTheme();
renderHome();

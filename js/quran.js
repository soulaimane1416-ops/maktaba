/* قارئ القرآن — برواية حفص + تفسير ميسّر + شرح خليجي */
const QuranUI = {
  tafsirMode: "muyassar", // muyassar | gulf
  cache: {}, tafsirCache: {},

  list(filter=""){
    const q = filter.trim();
    const rows = SUWAR.filter(s=>!q || s[1].includes(q) || String(s[0])===q).map(s=>`
      <div class="list-item" onclick="MushafUI.openSura(${s[0]})">
        <div class="num">${s[0]}</div>
        <div class="meta"><h4>سورة ${s[1]}</h4><small>${s[2]} آيات • ${s[3]}ة</small></div>
        <div class="chev">‹</div>
      </div>`).join("");
    app.innerHTML = `<div class="view">
      <div class="book-head"><h2>القرآن الكريم</h2><p>برواية حفص عن عاصم — الرسم العثماني</p><div class="ornament">✦</div></div>
      <input class="searchbar" id="sq" placeholder="ابحث باسم السورة أو رقمها..." value="${esc(filter)}" oninput="QuranUI.list(this.value)">
      <div id="slist">${rows || '<p class="note">لا توجد نتائج مطابقة.</p>'}</div></div>`;
    const inp=$("#sq"); if(inp && q){ inp.focus(); inp.setSelectionRange(inp.value.length,inp.value.length); }
  },

  async read(num){
    const s = SUWAR[num-1];
    app.innerHTML = `<div class="view">
      <button class="back-btn" onclick="QuranUI.list()">→ قائمة السور</button>
      <div class="book-head"><h2>سورة ${s[1]}</h2><p>${s[2]} آيات • ${s[3]}ة</p></div>
      <div class="toggle-row">
        <button class="toggle active">نص متواصل</button>
        <button class="toggle" onclick="MushafUI.openSura(${num})">مصحف المدينة</button>
      </div>
      <div class="toggle-row">
        <button class="toggle ${this.tafsirMode==="muyassar"?"active":""}" onclick="QuranUI.setMode('muyassar')">التفسير الميسّر</button>
        <button class="toggle ${this.tafsirMode==="gulf"?"active":""}" onclick="QuranUI.setMode('gulf')">شرح مبسّط خليجي</button>
      </div>
      <div class="note">اضغط على رقم الآية لعرض التفسير. ${GULF_TAFSIR[num]?"الشرح الخليجي متوفر لهذه السورة.":"الشرح الخليجي غير متوفر لهذه السورة بعد — سيُعرض التفسير الميسّر."}</div>
      <div id="qtext"><div class="skel"></div><div class="skel"></div><div class="skel"></div></div>
      <div style="display:flex;gap:10px;margin-top:16px">
        ${num>1?`<button class="btn ghost" style="flex:1" onclick="QuranUI.read(${num-1})">→ السابقة</button>`:""}
        ${num<114?`<button class="btn ghost" style="flex:1" onclick="QuranUI.read(${num+1})">التالية ←</button>`:""}
      </div></div>`;
    window.scrollTo({top:0});
    try{
      let verses = this.cache[num];
      if(!verses){
        const r = await fetch(`${API_QURAN_TEXT}/${num}.json`);
        if(!r.ok) throw 0;
        const j = await r.json();
        verses = j.chapter || j.verses || j;
        this.cache[num]=verses;
      }
      const html = verses.map(v=>{
        const a = v.verse ?? v.verse_number, t = v.text;
        return `<span class="ayah">${t}<span class="ayah-num" onclick="QuranUI.tafsir(${num},${a},this)">﴿${a}﴾</span></span> `;
      }).join("");
      $("#qtext").innerHTML = `<div class="quran-text">${num!==1&&num!==9?'<p style="text-align:center;margin-bottom:14px">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>':""}${html}</div>`;
    }catch(e){
      $("#qtext").innerHTML = `<p class="note">تعذّر تحميل نص السورة. تحقق من الاتصال بالإنترنت وحاول مجدداً.</p>`;
    }
  },

  setMode(m){ this.tafsirMode=m; const n=this._cur; if(n) this.read(n); },
  get _cur(){ const h=document.querySelector(".book-head h2"); const m=h&&h.textContent.match(/سورة (.+)/); const s=SUWAR.find(x=>x[1]===m?.[1]); return s?s[0]:null; },

  async tafsir(sura, aya, el){
    document.querySelectorAll(".ayah-num").forEach(x=>x.style.background="");
    if(el) el.style.background="var(--gold)";
    const mode = (this.tafsirMode==="gulf" && GULF_TAFSIR[sura]) ? "gulf" : "muyassar";
    const title = mode==="gulf" ? "شرح مبسّط باللهجة الخليجية" : "التفسير الميسّر";
    const heading = `${title} — سورة ${SUWAR[sura-1][1]}، الآية ${aya}`;
    // Bottom-sheet modal: user stays at their reading position, no jump to end of surah.
    let ov = document.getElementById("tafsirOverlay");
    if(!ov){
      ov = document.createElement("div");
      ov.id = "tafsirOverlay";
      ov.className = "tafsir-overlay";
      ov.innerHTML = `<div class="tafsir-sheet" role="dialog" aria-modal="true">
        <div class="tafsir-sheet-head"><h5 id="tafsirTitle"></h5>
        <button class="tafsir-close" aria-label="إغلاق">✕</button></div>
        <div class="tafsir-sheet-body" id="tafsirBody"></div></div>`;
      document.body.appendChild(ov);
      ov.querySelector(".tafsir-close").onclick = ()=>ov.classList.remove("open");
      ov.addEventListener("click", e=>{ if(e.target===ov) ov.classList.remove("open"); });
    }
    ov.querySelector("#tafsirTitle").textContent = heading;
    ov.querySelector("#tafsirBody").innerHTML = `<div class="skel"></div><div class="skel"></div><div class="skel"></div>`;
    requestAnimationFrame(()=>ov.classList.add("open"));
    try{
      let txt;
      if(mode==="gulf"){
        txt = GULF_TAFSIR[sura][String(aya)] || "الشرح غير متوفر لهذه الآية بعد.";
      }else{
        const key=`${sura}:${aya}`;
        if(!this.tafsirCache[key]){
          const r=await fetch(`${API_TAFSIR}/${sura}:${aya}`);
          if(!r.ok) throw 0;
          const j=await r.json();
          txt=j.tafsir.text;
          this.tafsirCache[key]=txt;
        } else txt=this.tafsirCache[key];
      }
      ov.querySelector("#tafsirBody").innerHTML = `<p>${esc(txt)}</p>`;
    }catch(e){
      ov.querySelector("#tafsirBody").innerHTML = `<p class="note">تعذّر تحميل التفسير. تحقق من الاتصال وحاول مجدداً.</p>`;
    }
  }
};

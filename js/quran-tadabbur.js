/* تدبر الآيات — عرض آية آية مع تفسيرها تحتها، بأزرار تكبير الخط وتنقل بين السور */
const TadabburUI = {
  get scale(){ return parseFloat(localStorage.getItem("tad-font")||"1"); },

  bump(d){
    const v = Math.min(1.8, Math.max(0.8, Math.round((this.scale+d)*10)/10));
    localStorage.setItem("tad-font", v);
    const w = $("#tadWrap");
    if(w) w.style.setProperty("--tad-scale", v);
  },

  setMode(m, num){
    QuranUI.tafsirMode = m;
    this._lockMode = true;
    this.open(num);
  },

  async open(num){
    const s = SUWAR[num-1];
    // الوضع الافتراضي: الخليجي إن توفر لهذه السورة، ما لم يختر المستخدم تبويباً بنفسه
    if(!this._lockMode) QuranUI.tafsirMode = GULF_TAFSIR[num] ? "gulf" : "muyassar";
    app.innerHTML = `<div class="view">
      <button class="back-btn" onclick="QuranUI.list()">→ قائمة السور</button>
      <div id="tadWrap" class="tad-wrap" style="--tad-scale:${this.scale}">
        <div class="tad-head">
          <div class="tad-title">سورة ${s[1]}</div>
          <div class="tad-fontbtns">
            <button class="tad-fbtn" onclick="TadabburUI.bump(0.1)" aria-label="تكبير الخط">A+</button>
            <button class="tad-fbtn" onclick="TadabburUI.bump(-0.1)" aria-label="تصغير الخط">A−</button>
          </div>
        </div>
        <div class="skel"></div><div class="skel"></div><div class="skel"></div>
      </div></div>`;
    window.scrollTo({top:0});
    try{
      let verses = QuranUI.cache[num];
      if(!verses){
        const r = await fetch(`${API_QURAN_TEXT}/${num}.json`);
        if(!r.ok) throw 0;
        const j = await r.json();
        verses = j.chapter || j.verses || j;
        QuranUI.cache[num] = verses;
      }
      this.render(num, s, verses);
    }catch(e){
      app.innerHTML = `<div class="view"><button class="back-btn" onclick="QuranUI.list()">→ قائمة السور</button>
        <p class="note">تعذّر تحميل السورة. تحقق من الاتصال بالإنترنت وحاول مجدداً.</p>
        <button class="btn" onclick="TadabburUI.open(${num})">إعادة المحاولة</button></div>`;
    }
  },

  render(num, s, verses){
    const mode = QuranUI.tafsirMode;
    const hasGulf = !!GULF_TAFSIR[num];
    const tabs = `
      <div class="toggle-row">
        ${hasGulf?`<button class="toggle ${mode==="gulf"?"active":""}" onclick="TadabburUI.setMode('gulf',${num})">شرح خليجي</button>`:""}
        <button class="toggle ${mode==="muyassar"?"active":""}" onclick="TadabburUI.setMode('muyassar',${num})">التفسير الميسّر</button>
      </div>`;
    const basmala = (num!==1 && num!==9)
      ? `<div class="tad-basmala">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>` : "";

    let blocks = "";
    for(const v of verses){
      const a = v.verse ?? v.verse_number, t = v.text;
      let tafsirHtml;
      if(mode==="gulf"){
        const txt = GULF_TAFSIR[num][String(a)] || "الشرح غير متوفر لهذه الآية بعد.";
        tafsirHtml = esc(txt);
      }else{
        tafsirHtml = `<div class="skel"></div>`; // يُحمّل عند الظهور
      }
      blocks += `<div class="tad-verse">
        <p class="tad-text">${esc(t)} <span class="tad-num">﴿${a}﴾</span></p>
        <div class="tad-tafsir"${mode==="muyassar"?` data-aya="${a}"`:""}>${tafsirHtml}</div>
      </div>`;
    }

    $("#tadWrap").innerHTML = `
      <div class="tad-head">
        <div class="tad-title">سورة ${s[1]}</div>
        <div class="tad-fontbtns">
          <button class="tad-fbtn" onclick="TadabburUI.bump(0.1)" aria-label="تكبير الخط">A+</button>
          <button class="tad-fbtn" onclick="TadabburUI.bump(-0.1)" aria-label="تصغير الخط">A−</button>
        </div>
      </div>
      ${tabs}${basmala}
      <div id="tadVerses">${blocks}</div>
      <div class="tad-foot">
        ${num>1?`<button class="btn ghost" onclick="TadabburUI.open(${num-1})">→ السابقة</button>`:`<span></span>`}
        <span class="tad-count">سورة ${num} من 114</span>
        ${num<114?`<button class="btn ghost" onclick="TadabburUI.open(${num+1})">التالية ←</button>`:`<span></span>`}
      </div>
      <div class="toggle-row">
        <button class="toggle" onclick="MushafUI.openSura(${num})">مصحف المدينة</button>
        <button class="toggle active">تدبر الآيات</button>
      </div>`;
    window.scrollTo({top:0});
    if(mode==="muyassar") this.observeTafsirs(num);
  },

  observeTafsirs(num){
    const els = document.querySelectorAll(".tad-tafsir[data-aya]");
    if(!("IntersectionObserver" in window)){
      els.forEach(el=>this.loadTafsir(num, +el.dataset.aya, el));
      return;
    }
    const io = new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){ io.unobserve(e.target); this.loadTafsir(num, +e.target.dataset.aya, e.target); }
      });
    }, {rootMargin:"500px"});
    els.forEach(el=>io.observe(el));
  },

  async loadTafsir(num, aya, el){
    try{
      const {html} = await QuranUI.getTafsirText(num, aya);
      if(el.isConnected) el.innerHTML = html;
    }catch(e){
      if(el.isConnected) el.innerHTML = `<span class="note">تعذّر تحميل التفسير.</span>`;
    }
  }
};

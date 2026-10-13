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


  /* جلب نص التفسير لآية — مشترك بين النافذة المنبثقة وعرض التدبر */
  async getTafsirText(sura, aya){
    const mode = (this.tafsirMode==="gulf" && GULF_TAFSIR[sura]) ? "gulf" : "muyassar";
    const title = mode==="gulf" ? "شرح مبسّط باللهجة الخليجية" : "التفسير الميسّر";
    let txt;
    if(mode==="gulf"){
      txt = GULF_TAFSIR[sura][String(aya)] || "الشرح غير متوفر لهذه الآية بعد.";
      return {mode, title, html: esc(txt)};
    }
    const key=`${sura}:${aya}`;
    if(!this.tafsirCache[key]){
      const r=await fetch(`${API_TAFSIR}/${sura}:${aya}`);
      if(!r.ok) throw 0;
      const j=await r.json();
      txt=j.tafsir.text;
      this.tafsirCache[key]=txt;
    } else txt=this.tafsirCache[key];
    // الميسّر يجي من المصدر فيه وسوم HTML مثل <span class="green"> — نحوّلها لتمييز نظيف ونشيل الباقي
    return {mode, title, html: cleanTafsir(txt)};
  },

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
      const {mode, html} = await this.getTafsirText(sura, aya);
      const body = `<p>${html}</p>`;
      ov.querySelector("#tafsirBody").innerHTML = body;
    }catch(e){
      ov.querySelector("#tafsirBody").innerHTML = `<p class="note">تعذّر تحميل التفسير. تحقق من الاتصال وحاول مجدداً.</p>`;
    }
  }
};

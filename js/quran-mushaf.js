/* مصحف المدينة — عرض صفحات بنفس تنسيق المصحف المدني (15 سطرًا، رسم عثماني) */
const MushafUI = {
  chapters: null, pageCache: {},
  cur: 1, sura: 1,

  ar(n){ return String(n); }, // أرقام غربية حسب طلب المستخدم
  wd(s){ return String(s).replace(/[٠-٩]/g, d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d)); }, // تحويل الأرقام المشرقية للغربية

  async ensureChapters(){
    if(this.chapters) return this.chapters;
    const r = await fetch("https://api.quran.com/api/v4/chapters?language=ar");
    if(!r.ok) throw 0;
    const j = await r.json();
    this.chapters = j.chapters;
    return this.chapters;
  },

  async openSura(num){
    try{
      const ch = await this.ensureChapters();
      this.sura = num;
      this.openPage(ch[num-1].pages[0]);
    }catch(e){
      app.innerHTML = `<div class="view"><p class="note">تعذّر تحميل بيانات المصحف. تحقق من الاتصال وحاول مجدداً.</p>
        <button class="btn ghost" onclick="QuranUI.list()">→ قائمة السور</button></div>`;
    }
  },

  async openPage(p){
    p = Math.max(1, Math.min(604, p|0));
    this.cur = p;
    app.innerHTML = `<div class="view">
      <button class="back-btn" onclick="QuranUI.list()">→ قائمة السور</button>
      <div class="mushaf-wrap"><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div></div>
    </div>`;
    window.scrollTo({top:0});
    try{
      const ch = await this.ensureChapters();
      let verses = this.pageCache[p];
      if(!verses){
        const r = await fetch(`https://api.quran.com/api/v4/verses/by_page/${p}?words=true&word_fields=text_uthmani,line_number,char_type_name&per_page=50`);
        if(!r.ok) throw 0;
        const j = await r.json();
        verses = j.verses;
        this.pageCache[p] = verses;
      }
      this.render(p, verses, ch);
    }catch(e){
      app.innerHTML = `<div class="view"><button class="back-btn" onclick="QuranUI.list()">→ قائمة السور</button>
        <p class="note">تعذّر تحميل الصفحة ${this.ar(p)}. تحقق من الاتصال بالإنترنت وحاول مجدداً.</p>
        <button class="btn" onclick="MushafUI.openPage(${p})">إعادة المحاولة</button></div>`;
    }
  },

  suraName(ch, id){ return ch[id-1].name_arabic; },

  render(p, verses, ch){
    const firstV = verses[0];
    const [suraId] = firstV.verse_key.split(":").map(Number);
    const juz = firstV.juz_number;
    // اسم السورة الظاهرة أعلى الصفحة: أول سورة تبدأ في هذه الصفحة (أو سورة أول آية)
    let headSura = suraId;
    for(const v of verses){ if(v.verse_number===1){ headSura = Number(v.verse_key.split(":")[0]); break; } }
    this.sura = headSura;

    let html = `<div class="mushaf-info"><span>سورة ${this.suraName(ch, headSura)}</span><span>الجزء ${this.ar(juz)}</span></div>`;
    html += `<div class="mushaf-page">`;

    // تجميع الرموز حسب السطر مع الحفاظ على الترتيب
    const lines = new Map();
    const lineHeads = new Map(); // رقم السطر -> ترويسة سورة تُعرض قبله
    const pushTok = (ln, tok)=>{ if(!lines.has(ln)) lines.set(ln, []); lines.get(ln).push(tok); };
    let pendingHeader = null; // ترويسة سورة تُعرض قبل أول سطر لآيتها الأولى

    for(const v of verses){
      const [sid, vnum] = v.verse_key.split(":").map(Number);
      if(vnum===1){
        pendingHeader = { sid, name: this.suraName(ch, sid) };
      }
      for(const w of v.words){
        if(pendingHeader){
          // ألصق الترويسة بسطر أول رمز من الآية الأولى للسورة
          const ln0 = w.line_number;
          lineHeads.set(ln0, this.suraHeader(pendingHeader.name)
               + (pendingHeader.sid!==1 && pendingHeader.sid!==9 ? `<div class="mushaf-basmala">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>` : ""));
          pendingHeader = null;
        }
        const ln = w.line_number;
        if(w.char_type_name==="end"){
          pushTok(ln, {end:true, sid, vnum, num:w.text_uthmani});
        }else{
          pushTok(ln, {end:false, t:w.text_uthmani});
        }
      }
    }
    // إن بقيت ترويسة معلقة (نادر) ألحقها قبل آخر سطر
    if(pendingHeader){
      const lastLn = Math.max(...lines.keys());
      lineHeads.set(lastLn, this.suraHeader(pendingHeader.name)
           + (pendingHeader.sid!==1 && pendingHeader.sid!==9 ? `<div class="mushaf-basmala">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>` : ""));
    }

    const sorted = [...lines.keys()].sort((a,b)=>a-b);
    for(const ln of sorted){
      if(lineHeads.has(ln)) html += lineHeads.get(ln);
      const toks = lines.get(ln);
      let line = "";
      for(const t of toks){
        if(t.end){
          line += `<span class="mushaf-ayah" onclick="QuranUI.tafsir(${t.sid},${t.vnum},this)">${esc(this.wd(t.num))}</span> `;
        }else{
          line += `${esc(t.t)} `;
        }
      }
      html += `<div class="mushaf-line">${line}</div>`;
    }
    html += `</div>`; // .mushaf-page

    html += `<div class="mushaf-nav">
      <button class="btn ghost" ${p<=1?"disabled":""} onclick="MushafUI.openPage(${p-1})">→ السابقة</button>
      <div class="mushaf-jump"><input id="pjump" type="number" min="1" max="604" value="${p}" inputmode="numeric">
      <button class="btn" onclick="MushafUI.openPage(+document.getElementById('pjump').value||1)">انتقال</button></div>
      <button class="btn ghost" ${p>=604?"disabled":""} onclick="MushafUI.openPage(${p+1})">التالية ←</button>
    </div>
    <p class="mushaf-pagenum">صفحة ${this.ar(p)} من ${this.ar(604)}</p>
    <div class="toggle-row">
      <button class="toggle active">مصحف المدينة</button>
      <button class="toggle" onclick="QuranUI.read(${this.sura})">نص متواصل</button>
    </div>`;

    app.innerHTML = `<div class="view">
      <button class="back-btn" onclick="QuranUI.list()">→ قائمة السور</button>
      <div class="mushaf-wrap">${html}</div>
    </div>`;
    window.scrollTo({top:0});
  },

  suraHeader(name){
    return `<div class="mushaf-sura-head"><span class="orn">❁</span><span class="nm">سورة ${esc(name)}</span><span class="orn">❁</span></div>`;
  }
};

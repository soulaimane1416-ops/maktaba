/* طبقة البيانات المحلية — الأوفلاين أولًا، والشبكة احتياط فقط */
const LocalData = {
  _cache: {},
  async _load(name){
    if(this._cache[name]) return this._cache[name];
    const r = await fetch(`data/${name}.json`);
    if(!r.ok) throw 0;
    const j = await r.json();
    this._cache[name] = j;
    return j;
  },
  /* نص آيات السورة: [{verse, text}] */
  async suraText(num){
    const q = await this._load("quran");
    const arr = q[String(num)];
    if(!arr) throw 0;
    return arr.map((t,i)=>({verse:i+1, text:t}));
  },
  /* تفسير آية (منظّف وجاهز للعرض) */
  async tafsir(sura, aya){
    const t = await this._load("tafsir");
    const txt = t[`${sura}:${aya}`];
    if(!txt) throw 0;
    return txt;
  },
  /* صفحة مصحف بالشكل الذي يتوقعه العرض */
  async mushafPage(p){
    const m = await this._load("mushaf");
    const pg = m[String(p)];
    if(!pg) throw 0;
    const [juz, verses] = pg;
    return verses.map(([key, words])=>{
      const [sid, vnum] = key.split(":").map(Number);
      return { verse_key:key, verse_number:vnum, juz_number:juz,
        words: words.map(([t,ln,end])=>({text_uthmani:t, line_number:ln, char_type_name:end?"end":"word"})) };
    });
  },
  /* أول صفحة لكل سورة */
  async suraFirstPages(){
    if(this._fp) return this._fp;
    const m = await this._load("mushaf");
    const fp = {};
    for(const pk of Object.keys(m).map(Number).sort((a,b)=>a-b))
      for(const [key] of m[String(pk)][1]){
        const sid = Number(key.split(":")[0]);
        if(!(sid in fp)) fp[sid] = pk;
      }
    this._fp = fp;
    return fp;
  }
};

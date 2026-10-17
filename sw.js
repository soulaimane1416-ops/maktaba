/* Service Worker — مكتبة الطالب الإسلامية (أوفلاين كامل) */
const CACHE = "maktaba-v6";
const SHELL = ["./","./index.html","./styles.css","./manifest.json",
 "js/app.js","js/quran.js","js/quran-mushaf.js","js/quran-tadabbur.js",
 "js/data-suwar.js","js/data-local.js","js/data-gulf.js","js/data-gulf-b.js",
 "js/data-books.js","js/data-bukhari.js","js/data-fiqh.js","js/data-quiz.js",
 "data/quran.json","data/tafsir.json","data/mushaf.json",
 "fonts/amiri-quran-400.woff2","fonts/aref-ruqaa-400.woff2","fonts/aref-ruqaa-700.woff2",
 "fonts/tajawal-400.woff2","fonts/tajawal-400-latin.woff2",
 "fonts/tajawal-700.woff2","fonts/tajawal-700-latin.woff2",
 "fonts/tajawal-800.woff2","fonts/tajawal-800-latin.woff2",
 "icons/icon-192.png","icons/icon-512.png"];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch", e=>{
  const url = new URL(e.request.url);
  // بيانات محلية: cache-first (لا تتغير)
  if(url.pathname.includes("/data/") || url.pathname.includes("/fonts/")){
    e.respondWith(caches.match(e.request).then(hit=>hit || fetch(e.request).then(r=>{
      const copy=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return r;
    })));
    return;
  }
  // App shell: cache-first
  e.respondWith(caches.match(e.request).then(hit=>hit || fetch(e.request).then(r=>{
    const copy=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return r;
  }).catch(()=>caches.match("./index.html"))));
});

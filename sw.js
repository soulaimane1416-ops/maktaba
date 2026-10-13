/* Service Worker — مكتبة الطالب الإسلامية */
const CACHE = "maktaba-v2";
const SHELL = ["./","./index.html","./styles.css","./manifest.json",
 "js/app.js","js/quran.js","js/quran-mushaf.js","js/quran-tadabbur.js","js/data-suwar.js","js/data-gulf.js","js/data-books.js","js/data-quiz.js",
 "icons/icon-192.png","icons/icon-512.png"];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch", e=>{
  const url = new URL(e.request.url);
  // API calls: network-first with cache fallback
  if(url.hostname.includes("jsdelivr.net") || url.hostname.includes("quran.com") || url.hostname.includes("gstatic.com") || url.hostname.includes("googleapis.com")){
    e.respondWith(fetch(e.request).then(r=>{
      const copy=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return r;
    }).catch(()=>caches.match(e.request)));
    return;
  }
  // App shell: cache-first
  e.respondWith(caches.match(e.request).then(hit=>hit || fetch(e.request).then(r=>{
    const copy=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return r;
  }).catch(()=>caches.match("./index.html"))));
});

/* Offline support for GitHub Pages, including repositories in a subdirectory. */
const ROOT=new URL('./',self.location.href);
const PREFIX='bashgau:'+ROOT.pathname+':';
const CACHE=PREFIX+'5a43a65c05b9';
const APP=new URL('index.html',ROOT).href;
const ASSETS=['manifest.webmanifest','icon.png','icon-192.png'].map(path=>new URL(path,ROOT).href);
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 const response=await fetch(new Request(APP,{cache:'reload'}));
 if(!response.ok)throw new Error('The timetable could not be saved');
 await cache.put(APP,response);
 await Promise.allSettled(ASSETS.map(async url=>{const res=await fetch(new Request(url,{cache:'reload'}));if(res.ok)await cache.put(url,res)}));
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 await Promise.all((await caches.keys()).filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==ROOT.origin)return;
 const isApp=request.mode==='navigate'&&(url.pathname===ROOT.pathname||url.pathname===new URL(APP).pathname);
 if(isApp){event.respondWith((async()=>{
  const cache=await caches.open(CACHE),controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),4500);
  try{const response=await fetch(request,{cache:'no-cache',signal:controller.signal});if(!response.ok)throw new Error('Timetable unavailable');await cache.put(APP,response.clone());return response}
  catch{const saved=await cache.match(APP);return saved||new Response('Open the timetable once while online to save it for offline use.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}})}
  finally{clearTimeout(timeout)}
 })());return}
 if(ASSETS.includes(url.href))event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{const response=await fetch(request);if(response.ok)await cache.put(request,response.clone());return response}
  catch{return await cache.match(request)||Response.error()}
 })());
});

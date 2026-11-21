// Geo Quizz : fonctionnement hors connexion.
// Le jeu, les drapeaux, les polices, les cartes et le relief sont gardés sur l'appareil.
// Les scores et classements passent toujours par internet (Firebase).
const V="gq-v6",SHELL=["./","index.html","config.js","manifest.webmanifest","icon.svg","icon-180.png","icon-192.png","icon-512.png"];
const ASSETS=/^https:\/\/(flagcdn\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|commons\.wikimedia\.org\/wiki\/Special:FilePath|upload\.wikimedia\.org|thumb\.wikimedia\.org)\//;
const FLAGS="ad ae af ag al am ao ar at au az ba bb bd be bf bg bh bi bj bn bo br bs bt bw by bz ca cd cf cg ch ci cl cm cn co cr cu cv cy cz de dj dk dm do dz ec ee eg er es et fi fj fm fr ga gb gd ge gh gm gn gq gr gt gw gy hn hr ht hu id ie in iq ir is it jm jo jp ke kg kh ki km kn kp kr kw kz la lb lc li lk lr ls lt lu lv ly ma mc md me mg mh mk ml mm mn mr mt mu mv mw mx my mz na ne ng ni nl no np nr nz om pa pe pg ph pk pl pt pw py qa ro rs ru rw sa sb sc sd se sg si sk sl sm sn so sr ss st sv sy sz td tg th tj tl tm tn to tr tt tv tz ua ug us uy uz vc ve vn vu ws ye za zm zw".split(" ");
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil((async()=>{
  for(const k of await caches.keys())if(k!==V&&k!=="gq-state")await caches.delete(k);
  await self.clients.claim();
  const c=await caches.open(V);
  for(const f of FLAGS){const u=f==="af"?"https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Flag_of_the_Taliban.svg/500px-Flag_of_the_Taliban.svg.png":`https://flagcdn.com/${f}.svg`;if(!(await c.match(u)))try{const r=await fetch(u,{mode:"cors"});if(r.ok)await c.put(u,r)}catch(x){}}
})())});
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;
  const u=new URL(r.url);
  if(ASSETS.test(r.url)){ // images, polices, cartes : d'abord l'appareil
    e.respondWith(caches.open(V).then(async c=>{const hit=await c.match(r);if(hit)return hit;const res=await fetch(r);if(res.ok||res.type==="opaque")c.put(r,res.clone());return res}));
    return;
  }
  if(u.origin===location.origin&&/\/relief\/r\d\d\.jpg$/.test(u.pathname)){ // cartes en relief : d'abord l'appareil
    e.respondWith(caches.open(V).then(async c=>{const hit=await c.match(r);if(hit)return hit;const res=await fetch(r);if(res.ok)c.put(r,res.clone());return res}));
    return;
  }
  if(u.origin===location.origin){ // le jeu : d'abord internet (mises à jour), sinon l'appareil
    e.respondWith(fetch(r).then(res=>{if(res.ok){const cl=res.clone();caches.open(V).then(c=>c.put(r,cl))}return res}).catch(async()=>(await caches.match(r,{ignoreSearch:true}))||(r.mode==="navigate"?caches.match("index.html"):Response.error())));
  }
});
// Rappels : série en jeu le soir, tournoi du week-end (ouverture le samedi, fin le dimanche soir).
const TXT={fr:n=>`Ta série de ${n} jours se termine ce soir. Une partie suffit pour la garder.`,en:n=>`Your ${n}-day streak ends tonight. One game is enough to keep it.`,ar:n=>`سلسلتك من ${n} أيام تنتهي الليلة. لعبة واحدة تكفي للحفاظ عليها.`};
const TNA={fr:"Le tournoi du week-end est ouvert : 3 essais, 100 jetons pour le 1er.",en:"The weekend tournament is open: 3 tries, 100 tokens for 1st place.",ar:"بطولة نهاية الأسبوع مفتوحة: 3 محاولات و100 رمز للأول."};
const TNB={fr:"Le tournoi se termine ce soir. Il te reste des essais.",en:"The tournament ends tonight. You still have tries left.",ar:"تنتهي البطولة الليلة. ما زالت لديك محاولات."};
const day=o=>{const d=new Date(Date.now()+o*864e5);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
self.addEventListener("periodicsync",e=>{
  if(e.tag!=="gq-streak")return;
  e.waitUntil((async()=>{
    const c=await caches.open("gq-state"),r=await c.match("state");if(!r)return;
    const st=await r.json();if(!st.rem)return;
    const now=new Date(),h=now.getHours(),g=now.getDay(),show=(body,tag)=>self.registration.showNotification("Geo Quizz",{body,icon:"icon-192.png",badge:"icon-192.png",tag});
    let ch=false;
    if(st.sn&&st.sd===day(-1)&&h>=17&&st.last!==day(0)){st.last=day(0);ch=true;await show((TXT[st.lang]||TXT.fr)(st.sn),"gq-streak")}
    if(st.tn&&g===6&&h>=10&&st.tnl!==day(0)+"a"){st.tnl=day(0)+"a";ch=true;await show(TNA[st.lang]||TNA.fr,"gq-tn")}
    else if(st.tn&&g===0&&h>=18&&st.tnl!==day(0)+"b"&&!(st.tnw===day(-1)&&st.tnn>=3)){st.tnl=day(0)+"b";ch=true;await show(TNB[st.lang]||TNB.fr,"gq-tn")}
    if(ch)await c.put("state",new Response(JSON.stringify(st)));
  })());
});
self.addEventListener("notificationclick",e=>{
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(l=>{for(const w of l)if("focus" in w)return w.focus();return self.clients.openWindow("./")}));
});

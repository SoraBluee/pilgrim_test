import {t,region,applyTranslations} from './i18n.mjs';
import {parseSearchQuery,matchesPage,matchesText} from './search.mjs';
import {safeMapReturn,googleMapHref,galleryHref} from './photo-links.mjs';
(() => {
"use strict";
const data=window.REONA_DATA;
const works=data.works;
const groups=new Map(data.entries.map(group=>[group.workId,group.items]));
const places=new Map(data.places.map(place=>[place.id,place]));
const photos=new Map(data.photos.map(photo=>[photo.id,photo]));
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const escapeHTML = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const STORAGE = "reona-pilgrimage-favorites-v1";
let saved = new Set();
try {
  const current = localStorage.getItem(STORAGE);
  saved = new Set(current ? JSON.parse(current).filter(v=>typeof v==="string") :
    JSON.parse(localStorage.getItem("pilgrim-amami-favorites-r01") || "[]").map(id=>"pilgrim:"+id));
} catch {}
let active=works[0], query="", savedOnly=false, currentId=null, trigger=null, detailOrder=[], toastTimer, homeMode=true, detailMapReturn=null;
// Preserve saved IDs from the earlier category routes.
saved=new Set([...saved].map(value=>value.replace(/^(mv|video):/,"")));
const items=()=>[...(groups.get(active.id) || [])].sort((a,b)=>{
  const x=a.reference,y=b.reference;
  if (x.type==="page" && y.type==="page") {
    // Never compare reader and printed page numbers as if they were the same index.
    if (x.numbering!==y.numbering) return x.numbering.localeCompare(y.numbering);
    for(let i=0;i<Math.max(x.pages.length,y.pages.length);i++) {
      const delta=(x.pages[i] ?? -1)-(y.pages[i] ?? -1); if(delta) return delta;
    }
    const delta=(x.figure ?? 0)-(y.figure ?? 0); if(delta) return delta;
  }
  if(x.type==="timecode" && y.type==="timecode" && x.startMs!==y.startMs) return x.startMs-y.startMs;
  return a.id.localeCompare(b.id);
});
const pages=p=>p.reference.type==="page" ? p.reference.pages : [];
const pageRange = list => {
  if (!list.length) return "";
  if (list.length===1) return String(list[0]);
  const consecutive=list.every((n,i)=>i===0 || n===list[i-1]+1);
  return consecutive ? list[0]+"–"+list.at(-1) : list.join(", ");
};
const time=ms=>{const s=Math.floor(ms/1000);return (Math.floor(s/60))+":"+String(s%60).padStart(2,"0");};
const citation=p=>{
  const r=p.reference;
  if(r.type==="page") return "p."+pageRange(r.pages)+(r.figure!=null ? " · "+t("图{number}",{number:r.figure}) : "");
  if(r.type==="timecode") return time(r.startMs)+(r.endMs!=null ? "–"+time(r.endMs) : "");
  if(r.type==="image") return (r.number!=null ? t("图{number}",{number:r.number}) : "")+(r.side==="front" ? " "+t("正面") : r.side==="back" ? " "+t("背面") : "");
  return t("索引待补充");
};
// Card labels remain short; page-numbering provenance stays in the dataset.
const label=p=>active.title+(p.reference.type==="page" ? " p."+pageRange(pages(p)) : p.reference.type==="unresolved" ? "" : " "+citation(p));
const key=p=>active.id+":"+p.id;
const displayPhoto=p=>p.photoIds.map(id=>photos.get(id)).find(photo=>photo?.permission==="website-approved" && (photo.src || photo.thumbnail));
const cardImage=(p,index=0)=>{
  const reference=window.ReoNaReference.find(active.id,p.id);
  if(reference)return window.ReoNaReference.markup(reference,label(p),true,{priority:index<3});
  const photo=displayPhoto(p), src=photo?.thumbnail || photo?.src;
  return src ? '<img src="'+escapeHTML(src)+'" alt="'+escapeHTML(label(p))+'" width="640" height="500" loading="lazy">' : '<span class="image-placeholder">'+escapeHTML(t('图片待补充'))+'</span>';
};
const filtered = () => {
 const request=parseSearchQuery(query);
 return items().filter(p=>(!savedOnly||saved.has(key(p)))&&(active.id==='pilgrim'&&request.type==='page'?matchesPage(p,request):matchesText([label(p),active.region,...pages(p).map(String),...p.locations.flatMap(location=>{const place=places.get(location.placeId);return [place?.name,...(place?.aliases||[]),place?.address,place?.region];})],request)));
};
function notify(text) {
  $("#toast").textContent=text; $("#toast").hidden=false;
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>{$("#toast").hidden=true;},1400);
}
function syncSaved() {
  const count=(groups.get(active.id) || []).filter(p=>saved.has(key(p))).length;
  $("#saved-count").textContent=count; $("#saved-count").hidden=count===0;
  $("#saved-filter").setAttribute("aria-pressed",String(savedOnly));
  $("#saved-filter").setAttribute("aria-label",savedOnly ? t("显示全部") : t("只看收藏"));
  $$("[data-save]").forEach(button=>{
    const p=(groups.get(active.id) || []).find(p=>p.id===button.dataset.save), yes=saved.has(key(p));
    button.setAttribute("aria-pressed",String(yes));
    button.setAttribute("aria-label",t(yes ? "取消收藏 {label}" : "收藏 {label}",{label:label(p)}));
  });
  if (currentId) {
    const p=(groups.get(active.id) || []).find(p=>p.id===currentId), yes=saved.has(key(p));
    $("#detail-save").setAttribute("aria-pressed",String(yes));
    $("#detail-save").setAttribute("aria-label",yes ? t("取消收藏") : t("收藏"));
  }
}
function toggleSaved(id) {
  const p=(groups.get(active.id) || []).find(p=>p.id===id); if (!p) return;
  const k=key(p), yes=saved.has(k); yes ? saved.delete(k) : saved.add(k);
  let stored=true;
  try { localStorage.setItem(STORAGE,JSON.stringify([...saved])); } catch { stored=false; }
  renderGallery();
  notify(stored ? (yes ? t("已取消") : t("已收藏")) : t("仅本次有效"));
}
function renderGallery() {
  if(homeMode){$("#photo-grid").replaceChildren();return;}
  const visible=filtered();
  $("#photo-grid").innerHTML=visible.map((p,index)=>'<article class="photo-card"><button class="photo-open" type="button" data-open="'+escapeHTML(p.id)+'" aria-label="'+escapeHTML(t("查看 {label}",{label:label(p)}))+'"><span class="photo-image">'+cardImage(p,index)+'</span><span class="photo-caption"><span class="caption-open">'+escapeHTML(label(p))+'</span></span></button><button class="save-photo" type="button" data-save="'+escapeHTML(p.id)+'" aria-pressed="false" aria-label="'+escapeHTML(t("收藏 {label}",{label:label(p)}))+'"><svg viewBox="0 0 20 24" fill="none" aria-hidden="true"><path d="M4 3h12v18l-6-4-6 4V3Z" stroke="currentColor" stroke-width="1.2"/></svg></button></article>').join("");
  $("#empty-state").hidden=visible.length!==0;
  $("#empty-message").textContent=!(groups.get(active.id) || []).length ? t("暂无条目") : savedOnly && !query ? t("暂无收藏") : t("无结果");
  $("#reset-filter").hidden=!(groups.get(active.id) || []).length || (!query && !savedOnly);
  $("#result-status").textContent=t("{count} 条目",{count:visible.length});
  syncSaved();
}
const sourceMenu=$("#source-menu"), sourceToggle=$("#source-toggle"), dropdown=$("#source-dropdown");
let hoverOpened=false, menuCloseTimer;
function setMenu(open){
  clearTimeout(menuCloseTimer);
  if(open)window.ReoNaSourceMenu.fit();
  sourceToggle.setAttribute("aria-expanded",String(open)); dropdown.hidden=!open;
  if(!open) hoverOpened=false;
}
function renderNavigation(){
  $("#source-options").innerHTML=window.ReoNaSourceMenu.links(works,homeMode?null:active.id);
}
function renderModule(scroll=false){
  const previousId=active?.id,previousHome=homeMode;
  let route;try{route=decodeURIComponent(location.hash.slice(1)).split("/");}catch{route=[];}
  const requested=route.length>1 ? route[1] : route[0];
  homeMode=(!requested||requested==='top')&&!new URLSearchParams(location.search).has('entry');
  active=works.find(work=>work.id===requested) || works[0];
  $("#home-view").hidden=!homeMode;$("#gallery-view").hidden=homeMode;
  document.querySelector('.home-link').toggleAttribute('aria-current',homeMode);
  if(homeMode)document.querySelector('.home-link').setAttribute('aria-current','page');
  renderHome();
  if(!active)return;
  if($("#photo-dialog").open)$("#photo-dialog").close();
  currentId=null;query="";savedOnly=false;$("#page-search").value="";
  $("#module-title").textContent=active.title;
  $("#module-region").textContent=region(active.region) || "";
  $("#module-region").hidden=!active.region;
  $("#gallery-tools").hidden=!items().length;
  $("#page-search").placeholder=t("出处搜索");
  $("#page-search").setAttribute("aria-label",t("出处搜索"));
  $("#content").dataset.work=active.id;
  document.title=(homeMode?"":active.title+" | ")+"ReoNa · "+t("圣地巡礼");
  renderNavigation();renderGallery();setMenu(false);
  renderRights();
  if(scroll && (previousId!==active.id||previousHome!==homeMode))window.scrollTo({top:0,behavior:"instant"});
}
function renderRights(){
 const rights=active.rights;$("#work-rights").hidden=!rights;
 $("#work-rights").innerHTML=rights?'<span>'+escapeHTML(t('图片版权归原权利人所有 · {copyright}',{copyright:rights.copyright}))+'</span><a href="'+escapeHTML(rights.purchaseUrl)+'" target="_blank" rel="noopener noreferrer">'+escapeHTML(t('购买正版，支持 ReoNa ↗'))+'</a>':'';
}
function renderHome(){
 if(!homeMode){$("#home-feed").replaceChildren();return;}
 const kind={autobiography:'自传',photobook:'写真集',mv:'MV',video:'视频',magazine:'杂志',postcard:'特典',other:'其他'};
 const populated=works.filter(w=>(groups.get(w.id)||[]).length);
 $("#home-feed").innerHTML=populated.map(w=>{
  const entries=groups.get(w.id),linked=new Set(entries.flatMap(e=>e.locations.map(l=>l.placeId)));
  const pictures=entries.slice(0,3).map((entry,index)=>{const ref=window.ReoNaReference.find(w.id,entry.id);if(!ref)return '';const text=w.title+(entry.reference.type==='page'?' p.'+pageRange(entry.reference.pages):'');return window.ReoNaReference.markup(ref,text,true,{priority:index===0});}).join('');
  return '<article class="home-post"><div class="home-post-meta">'+escapeHTML(t(kind[w.kind]))+(w.region?' · '+escapeHTML(region(w.region)):'')+'</div><h3><a href="#source/'+encodeURIComponent(w.id)+'">'+escapeHTML(w.title)+'</a></h3><p class="home-post-count">'+escapeHTML(t('{count} 条目',{count:entries.length}))+' · '+escapeHTML(t('{count} 处',{count:linked.size}))+'</p><a class="home-preview"'+(pictures?'':' hidden')+' href="#source/'+encodeURIComponent(w.id)+'" aria-label="'+escapeHTML(t('查看 {label}',{label:w.title}))+'">'+pictures+'</a><div class="home-post-links"><a class="text-link" href="#source/'+encodeURIComponent(w.id)+'">'+escapeHTML(t('查看全部'))+' →</a><a class="text-link" href="map.html?source='+encodeURIComponent(w.id)+'">'+escapeHTML(t('在地图中查看 ↗'))+'</a></div></article>';
 }).join('');
 $("#home-map-summary").textContent=t('{count} 处',{count:data.places.filter(p=>p.position).length});
 $("#home-sources").innerHTML=works.map(w=>'<a href="#source/'+encodeURIComponent(w.id)+'"><span>'+escapeHTML(w.title)+'</span><small>'+escapeHTML(t(kind[w.kind]))+'</small></a>').join('');
}
function renderDetails(p){
  const original=active.sourceLinks.find(link=>link.role==="original");
  let html='<section><h3>'+escapeHTML(t("出处"))+'</h3><p>'+escapeHTML(active.title)+" "+escapeHTML(citation(p))+'</p>';
  if(active.edition)html+='<p class="detail-muted">'+escapeHTML(active.edition)+'</p>';
  if(original)html+='<a href="'+escapeHTML(original.url)+'" target="_blank" rel="noopener noreferrer">'+escapeHTML(t("原出处 ↗"))+'</a>';
  html+='</section><section><h3>'+escapeHTML(t("位置"))+'</h3>';
  if(!p.locations.length)html+='<p class="detail-muted">'+escapeHTML(t("位置待补充"))+'</p>';
  for(const location of p.locations){
    const place=places.get(location.placeId), point=location.viewpoint?.position || place.position;
    const map=googleMapHref(point) || place.mapUrl;
    const coordinateLabel=point ? point.lat+", "+point.lng+(location.viewpoint ? " · "+t("机位") : "") : null;
    const placeLabel=place.name || coordinateLabel || t("位置待补充");
    html+='<div class="detail-location"><p>'+escapeHTML(placeLabel)+'</p>';
    if(place.address)html+='<p class="detail-muted">'+escapeHTML(place.address)+'</p>';
    const status=location.matchStatus==="confirmed" ? "" : location.matchStatus==="probable" ? t("推定") : t("待核实");
    if(status || (point && point.precision!=="exact"))html+='<p class="detail-muted">'+[status,point?.precision==="approximate" ? t("大致位置") : point?.precision==="area" ? t("区域位置") : ""].filter(Boolean).join(" · ")+'</p>';
    if(point && place.name)html+='<p class="detail-muted">'+point.lat+", "+point.lng+(location.viewpoint ? " · "+t("机位") : "")+'</p>';
    if(point)html+='<div class="map-links"><a href="map.html?place='+encodeURIComponent(place.id)+'">'+escapeHTML(t("在地图中查看 ↗"))+'</a><a href="'+escapeHTML(map)+'" target="_blank" rel="noopener noreferrer">'+escapeHTML(t("Google 地图 ↗"))+'</a></div>';
    else if(map)html+='<div class="map-links"><a href="'+escapeHTML(map)+'" target="_blank" rel="noopener noreferrer">'+escapeHTML(t("地图 ↗"))+'</a></div>';
    else html+='<p class="detail-muted">'+escapeHTML(t("地图位置待补充"))+'</p>';
    if(location.visitNote)html+='<p>'+escapeHTML(location.visitNote)+'</p>';
    html+='</div>';
  }
  const photo=displayPhoto(p);
  html+='</section>';
  if(active.rights)html+='<section><h3>'+escapeHTML(t("版权"))+'</h3><p>'+escapeHTML(active.rights.copyright)+'</p><a href="'+escapeHTML(active.rights.purchaseUrl)+'" target="_blank" rel="noopener noreferrer">'+escapeHTML(t("购买正版，支持 ReoNa ↗"))+'</a></section>';
  if(photo?.credit)html+='<section><h3>'+escapeHTML(t("摄影"))+'</h3><p>'+escapeHTML(photo.credit)+'</p></section>';
  $("#detail-meta").innerHTML=html;
}
sourceMenu.addEventListener("mouseenter",()=>{
  if(matchMedia("(min-width: 601px) and (hover: hover)").matches){setMenu(true);hoverOpened=true;}
});
sourceMenu.addEventListener("mouseleave",()=>{
  menuCloseTimer=setTimeout(()=>{if(!sourceMenu.matches(":hover") && !sourceMenu.contains(document.activeElement))setMenu(false);},160);
});
sourceToggle.addEventListener("click",()=>{
  if(hoverOpened){hoverOpened=false;setMenu(true);}else setMenu(dropdown.hidden);
});
sourceToggle.addEventListener("keydown",event=>{
  if(event.key==="ArrowDown"){event.preventDefault();setMenu(true);dropdown.querySelector("a")?.focus();}
});
sourceMenu.addEventListener("focusout",event=>{if(!sourceMenu.contains(event.relatedTarget))setMenu(false);});
sourceMenu.addEventListener("keydown",event=>{if(event.key==="Escape"){event.preventDefault();setMenu(false);sourceToggle.focus();}});
$("#source-options").addEventListener("click",event=>{if(event.target.closest("a"))setMenu(false);});
document.addEventListener("click",event=>{if(!sourceMenu.contains(event.target))setMenu(false);});
function showDetail(id, opener) {
  const p=(groups.get(active.id) || []).find(p=>p.id===id); if (!p) return;
  currentId=id;
  if(opener)detailMapReturn=null;
  $("#detail-back").hidden=false;
  $("#detail-back").href=galleryHref(active.id,location.href);
  const closeLabel=detailMapReturn?'返回地图':'关闭';
  $("#close-detail").setAttribute('data-i18n-aria-label',closeLabel);
  $("#close-detail").setAttribute('aria-label',t(closeLabel));
  if (opener) { trigger=opener; detailOrder=filtered().map(p=>p.id); }
  $("#detail-title").textContent=label(p);
  const reference=window.ReoNaReference.find(active.id,p.id);
  $("#detail-reference").hidden=!reference;
  $("#detail-reference").innerHTML=reference?window.ReoNaReference.markup(reference,label(p)):"";
  const photo=displayPhoto(p);
  const detailImage=$("#detail-image"), src=photo?.src || photo?.thumbnail;
  detailImage.hidden=!src || Boolean(reference);
  if (src) detailImage.src=src; else detailImage.removeAttribute("src");
  detailImage.alt=label(p);
  $('#detail-placeholder').hidden=Boolean(reference||src);
  renderDetails(p);
  const position=detailOrder.indexOf(id);
  $("#previous-photo").disabled=position<=0;
  $("#next-photo").disabled=position<0 || position>=detailOrder.length-1;
  syncSaved();
  if (!$("#photo-dialog").open) {
    document.body.classList.add("modal-open"); $("#photo-dialog").showModal(); $("#close-detail").focus();
  }
}
function stepDetail(delta) {
  const index=detailOrder.indexOf(currentId), next=detailOrder[index+delta];
  if (next) showDetail(next);
}
function returnToGallery(){
  detailMapReturn=null;
  history.replaceState(null,'',galleryHref(active.id,location.href));
  $("#photo-dialog").close();
}
function dismissDetail(){
  if(detailMapReturn){location.assign(detailMapReturn);return;}
  returnToGallery();
}
$("#detail-back").addEventListener('click',event=>{
  if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0)return;
  event.preventDefault();returnToGallery();
});
$("#photo-dialog").addEventListener('cancel',event=>{event.preventDefault();dismissDetail();});
$("#photo-dialog").addEventListener("close",()=>{
  document.body.classList.remove("modal-open"); currentId=null;detailMapReturn=null;
  if (trigger && document.contains(trigger)) trigger.focus({preventScroll:true});
});
$("#photo-dialog").addEventListener("click",event=>{
  if (event.target!==$("#photo-dialog")) return;
  const r=event.target.getBoundingClientRect();
  if (event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom) dismissDetail();
});
$("#close-detail").addEventListener("click",dismissDetail);
$("#detail-save").addEventListener("click",()=>{if(currentId) toggleSaved(currentId);});
$("#previous-photo").addEventListener("click",()=>stepDetail(-1));
$("#next-photo").addEventListener("click",()=>stepDetail(1));
document.addEventListener("keydown",event=>{
  if (!$("#photo-dialog").open || !["ArrowLeft","ArrowRight"].includes(event.key)) return;
  event.preventDefault(); stepDetail(event.key==="ArrowLeft"?-1:1);
});
document.addEventListener("click",event=>{
  const open=event.target.closest("[data-open]"), save=event.target.closest("[data-save]");
  if (open) showDetail(open.dataset.open,open);
  if (save) toggleSaved(save.dataset.save);
});
$("#page-search").addEventListener("input",event=>{query=event.target.value.trim().toLowerCase();renderGallery();});
$("#saved-filter").addEventListener("click",()=>{savedOnly=!savedOnly;renderGallery();});
$("#reset-filter").addEventListener("click",()=>{savedOnly=false;query="";$("#page-search").value="";renderGallery();});
document.querySelector(".skip-link").addEventListener("click",event=>{event.preventDefault();$("#content").focus({preventScroll:true});$("#content").scrollIntoView({block:"start",behavior:"instant"});});
window.addEventListener("hashchange",()=>renderModule(true));
window.addEventListener('reona-language-change',()=>{
 applyTranslations();renderNavigation();renderHome();renderRights();renderGallery();
 $("#module-region").textContent=region(active.region)||'';
 document.title=(homeMode?'':active.title+' | ')+'ReoNa · '+t('圣地巡礼');
 if(currentId)showDetail(currentId);
});
renderModule();
const requestedEntry=new URLSearchParams(location.search).get("entry");
if(requestedEntry){detailMapReturn=safeMapReturn(new URLSearchParams(location.search).get("return"),location.href);detailOrder=items().map(p=>p.id);showDetail(requestedEntry);}
})();

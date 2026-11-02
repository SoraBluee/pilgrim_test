(() => {
'use strict';
function fit(selector='#source-dropdown'){
 const panel=document.querySelector(selector),nav=document.querySelector('.source-nav-inner');
 if(!panel||!nav)return;
 window.dispatchEvent(new CustomEvent('reona-nav-menu-open',{detail:{id:panel.id}}));
 const viewport=window.visualViewport,bottom=(viewport?.offsetTop||0)+(viewport?.height||innerHeight);
 const top=nav.getBoundingClientRect().bottom;panel.style.setProperty('--source-menu-top',top+'px');
 panel.style.setProperty('--source-menu-space',Math.max(0,bottom-top-12)+'px');
}
function update(){for(const panel of document.querySelectorAll('.source-dropdown'))if(!panel.hidden)fit('#'+panel.id);}
window.addEventListener('resize',update);window.addEventListener('scroll',update,{passive:true});window.visualViewport?.addEventListener('resize',update);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const kinds={autobiography:'自传',photobook:'写真集',mv:'MV',video:'视频',magazine:'杂志',postcard:'特典',other:'其他'};
function links(works,activeId=null,prefix='#source/'){
 return works.map(w=>'<a class="source-option" href="'+prefix+encodeURIComponent(w.id)+'"'+(w.id===activeId?' aria-current="page"':'')+'><span>'+escape(w.title)+'</span><small>'+(window.ReoNaI18n?.t(kinds[w.kind])||kinds[w.kind])+'</small></a>').join('');
}
document.querySelector('#back-top')?.addEventListener('click',e=>{e.preventDefault();window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
window.ReoNaSourceMenu={fit,links};
})();

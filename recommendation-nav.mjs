import {t} from './i18n.mjs';
import {categoryLabels} from './recommendations-model.mjs';
const node=document.querySelector('#recommendation-menu');
function bind(menu,toggle,panel){
 let hovered=false,timer;
 function show(open){clearTimeout(timer);if(open)window.ReoNaSourceMenu.fit('#'+panel.id);panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));if(!open)hovered=false;}
 toggle.addEventListener('click',()=>{if(hovered){hovered=false;show(true);}else show(panel.hidden);});
 menu.addEventListener('mouseenter',()=>{if(matchMedia('(min-width:601px) and (hover:hover)').matches){show(true);hovered=true;}});
 menu.addEventListener('mouseleave',()=>{if(!menu.contains(document.activeElement))timer=setTimeout(()=>show(false),120);});
 menu.addEventListener('focusout',e=>{if(!menu.contains(e.relatedTarget))show(false);});
 menu.addEventListener('keydown',e=>{if(e.key==='Escape'){show(false);toggle.focus();}if(e.key==='ArrowDown'&&e.target===toggle){e.preventDefault();show(true);panel.querySelector('a')?.focus();}});
 panel.addEventListener('click',e=>{if(e.target.closest('a'))show(false);});
 document.addEventListener('click',e=>{if(!menu.contains(e.target))show(false);});
 window.addEventListener('reona-nav-menu-open',e=>{if(e.detail.id!==panel.id)show(false);});
 return show;
}
if(node){
 const options=document.querySelector('#recommendation-options');
 function render(){options.replaceChildren(...(window.REONA_RECOMMENDATION_CATEGORIES||[]).map(id=>{const a=document.createElement('a');a.className='source-option';a.href='recommendations.html#category/'+id;a.textContent=t(categoryLabels[id]);return a;}));}
 render();window.addEventListener('reona-language-change',render);bind(node,document.querySelector('#recommendation-toggle'),document.querySelector('#recommendation-dropdown'));
}
if(document.body.classList.contains('recommendations-page')){
 const options=document.querySelector('#source-options');
 function render(){options.innerHTML=window.ReoNaSourceMenu.links(window.REONA_DATA.works,null,'index.html#source/');}
 render();window.addEventListener('reona-language-change',render);bind(document.querySelector('#source-menu'),document.querySelector('#source-toggle'),document.querySelector('#source-dropdown'));
}

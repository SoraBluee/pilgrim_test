import {t,currentLanguage} from './i18n.mjs';
import {availableCategories,categoryLabels,recommendationRoute,categoryHref,itemHref,sortRecommendations} from './recommendations-model.mjs';
const items=sortRecommendations(window.REONA_RECOMMENDATIONS.items),dialog=document.querySelector('#recommendation-dialog'),grid=document.querySelector('#recommendation-grid'),tabs=document.querySelector('#recommendation-tabs');
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function nameMarkup(item){return escape(item.title)+(item.titleZh?'<span class="recommendation-title-translation" lang="zh-CN">'+escape(item.titleZh)+'</span>':'');}
let openedHere=false,returnScroll=0,returnItem=null,lastRender=null;
function picture(item,detail=false){const im=item.image;if(!im)return '';return '<img class="recommendation-image" src="'+escape(detail?im.src:im.thumbnail)+'" alt="'+escape(detail?[item.title,item.titleZh].filter(Boolean).join(' · '):'')+'" '+(detail?'fetchpriority="high"':'loading="lazy"')+' decoding="async" referrerpolicy="no-referrer">';}
function timestamp(source){return source.postedAtLocal.slice(0,16).replace('T',' ')+' JST';}
function render(){
 const key=location.hash+'|'+currentLanguage();if(key===lastRender)return;lastRender=key;
 const {category,item}=recommendationRoute(location.hash,items);
 document.title=t('推荐')+' | ReoNa · '+t('圣地巡礼');
 document.querySelector('#recommendation-toggle').setAttribute('aria-current','page');
 tabs.innerHTML=availableCategories(items).map(id=>'<a href="'+categoryHref(id)+'"'+(id===category?' aria-current="page"':'')+'>'+t(categoryLabels[id])+'</a>').join('');
 grid.innerHTML=items.filter(i=>i.category===category).map(i=>'<article class="recommendation-card'+(i.image?'':' recommendation-text-card')+'"><a href="'+itemHref(i.id)+'" data-item="'+escape(i.id)+'">'+(i.image?'<div class="recommendation-picture">'+picture(i)+'</div>':'')+'<h3>'+nameMarkup(i)+'</h3></a></article>').join('');
 if(!item){if(dialog.open){dialog.close();document.body.classList.remove('modal-open');window.scrollTo({top:returnScroll,behavior:'instant'});const card=grid.querySelector('[data-item="'+returnItem+'"]');card?.focus({preventScroll:true});}return;}
 const im=item.image;
 document.querySelector('#recommendation-detail').innerHTML='<div class="recommendation-detail-layout'+(im?'':' recommendation-detail-text')+'">'+(im?'<figure>'+picture(item,true)+'<figcaption><a href="'+escape(im.sourceUrl)+'" target="_blank" rel="noopener noreferrer">'+escape(im.kind==='external'?t('官方图片')+' · '+im.credit+(im.label?' · '+t(im.label):''):t('原推文图片'))+' ↗</a></figcaption></figure>':'')+'<section><h2 id="recommendation-title">'+nameMarkup(item)+'</h2><h3 class="recommendation-sources-title">'+t('推文出处')+'</h3><ol class="recommendation-sources">'+item.sources.map(s=>'<li><a href="'+escape(s.url)+'" target="_blank" rel="noopener noreferrer"><time datetime="'+escape(s.postedAt)+'">'+timestamp(s)+'</time><span>Twitter / X ↗</span></a></li>').join('')+'</ol></section></div>';
 if(!dialog.open){dialog.showModal();document.body.classList.add('modal-open');}dialog.scrollTop=0;
}
function navigate(hash){history.pushState(null,'',hash);render();}
function exit(){if(openedHere){openedHere=false;history.back();}else navigate(categoryHref(recommendationRoute(location.hash,items).category));}
grid.addEventListener('click',e=>{const link=e.target.closest('[data-item]');if(!link||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();returnScroll=window.scrollY;returnItem=link.dataset.item;openedHere=true;navigate(link.getAttribute('href'));});
tabs.addEventListener('click',()=>{openedHere=false;});
document.querySelector('#recommendation-close').addEventListener('click',exit);document.querySelector('#recommendation-back').addEventListener('click',exit);
dialog.addEventListener('cancel',e=>{e.preventDefault();exit();});
dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)exit();}});
document.addEventListener('error',e=>{if(e.target.matches?.('.recommendation-image')){e.target.hidden=true;e.target.closest('.recommendation-picture')?.classList.add('image-unavailable');}},true);
window.addEventListener('popstate',()=>{openedHere=false;render();});window.addEventListener('hashchange',render);window.addEventListener('reona-language-change',render);render();

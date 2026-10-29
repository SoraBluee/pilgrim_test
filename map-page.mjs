import {photoHref} from './photo-links.mjs';
import {pawMarkerElement} from './paw-marker.mjs';
import {placeIndex,filterPlaces,pointsGeoJSON,citation,positionLabel} from './map-data.mjs';
const data=window.REONA_DATA,$=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const params=new URLSearchParams(location.search);
let source=data.works.some(w=>w.id===params.get('source'))?params.get('source'):'all',selectedId=params.get('place'),map=null,marker=null,popup=null,visible=[],library=null,loading=false,loadTimer;
const publicRows=placeIndex(data),publicIds=new Set(publicRows.map(r=>r.place.id));
const candidates=(window.REONA_LOCAL?.candidates||[]).filter(p=>!publicIds.has(p.id)).map(p=>({place:p,associations:[],candidate:true}));
$('#candidate-control').hidden=!candidates.length;
$('#map-search').value=params.get('q')||'';
$('#map-region').value=['all','amami'].includes(params.get('region'))?params.get('region'):'amami';
let hoverOpened=false;
const name=row=>row.place.name||positionLabel(row.place.position);
function menu(open){if(open)window.ReoNaSourceMenu.fit();$('#source-toggle').setAttribute('aria-expanded',String(open));$('#source-dropdown').hidden=!open;if(!open)hoverOpened=false;}
function navigation(){
 $('#source-options').innerHTML=window.ReoNaSourceMenu.links(data.works,null,'index.html#source/');
 $('#map-source').innerHTML=[{id:'all',title:'全部出处'},...data.works].map(w=>'<option value="'+esc(w.id)+'"'+(source===w.id?' selected':'')+'>'+esc(w.title)+'</option>').join('');
}
function remember(){
 const url=new URL(location.href);for(const key of ['place','source','region','q'])url.searchParams.delete(key);
 const search=$('#map-search').value.trim();if(search)url.searchParams.set('q',search);
 if(selectedId)url.searchParams.set('place',selectedId);if(source!=='all')url.searchParams.set('source',source);url.searchParams.set('region',$('#map-region').value);
 if(map){const c=map.getCenter();url.searchParams.set('c',c.lat.toFixed(5)+','+c.lng.toFixed(5));url.searchParams.set('z',map.getZoom().toFixed(2));}
 history.replaceState(null,'',url);
 document.querySelectorAll('[data-photo-entry]').forEach(a=>{a.href=photoHref(a.dataset.photoWork,a.dataset.photoEntry,url.href,location.href);});
}
function photographLinks(row){
 return row.associations.map(a=>{
 const ref=window.ReoNaReference.find(a.work.id,a.entry.id),photo=a.entry.photoIds.map(id=>data.photos.find(p=>p.id===id)).find(Boolean),label=citation(a.work,a.entry);
 const image=ref?window.ReoNaReference.markup(ref,label,true):photo?'<img src="'+esc(photo.thumbnail||photo.src)+'" alt="'+esc(label)+'" loading="lazy">':'';
 return '<a class="place-photo" data-photo-work="'+esc(a.work.id)+'" data-photo-entry="'+esc(a.entry.id)+'" href="'+esc(photoHref(a.work.id,a.entry.id,location.href,location.href))+'">'+(image?'<span class="place-photo-image">'+image+'</span>':'')+'<span>'+esc(label)+'</span>'+(a.matchStatus==='confirmed'?'':'<small>'+(a.matchStatus==='probable'?'推定':'待核实')+'</small>')+'</a>';
 }).join('');
}
function details(row){
 $('#map-recenter').hidden=!row;if(!row){$('#place-detail').innerHTML='<p class="map-empty">选择地点</p>';return;}
 $('#place-detail').innerHTML='<div class="place-title"><h3>'+esc(name(row))+'</h3><span>'+ (row.candidate?'待匹配':row.associations.length+' 张')+'</span></div>'+(row.place.name?'<p class="place-coordinate">'+positionLabel(row.place.position)+'</p>':'')+'<div class="place-photos">'+(row.associations.length?photographLinks(row):'<p class="map-empty">尚未匹配照片</p>')+'</div>';
}
function openPhotographs(row){
 popup?.remove();if(!map||!row.associations.length)return;
 const content=document.createElement('div');content.className='paw-photo-content';
 content.innerHTML='<div class="paw-photo-heading">'+(row.place.name?'<span>'+esc(row.place.name)+'</span>':'')+'<span>'+row.associations.length+' 张</span></div><div class="paw-photo-grid">'+photographLinks(row)+'</div>';
 content.addEventListener('wheel',e=>e.stopPropagation(),{passive:true});
 content.style.setProperty('--popup-grid-space',Math.max(120,map.getContainer().clientHeight-150)+'px');
 popup.setDOMContent(content).setLngLat([row.place.position.lng,row.place.position.lat]).addTo(map);
 sizePopup();requestAnimationFrame(keepPopupVisible);
}
function sizePopup(){
 if(!map||!popup?.isOpen())return;
 const frame=map.getContainer(),element=popup.getElement();
 element.style.setProperty('--popup-frame-width',Math.max(160,frame.clientWidth-24)+'px');
 const rect=frame.getBoundingClientRect(),navBottom=document.querySelector('.source-nav').getBoundingClientRect().bottom;
 const visibleHeight=Math.max(180,Math.min(rect.bottom,innerHeight)-Math.max(rect.top,navBottom));
 const attribution=frame.querySelector('.maplibregl-ctrl-bottom-right')?.getBoundingClientRect().height||28;
 element.querySelector('.paw-photo-content').style.setProperty('--popup-grid-space',Math.max(90,Math.min(frame.clientHeight,visibleHeight)-attribution-160)+'px');
}
function keepPopupVisible(){
 if(!map||!popup?.isOpen()||map.isMoving())return;
 const frame=map.getContainer().getBoundingClientRect(),photo=popup.getElement().getBoundingClientRect(),paw=marker.getElement().getBoundingClientRect(),gap=12;
 const box={left:Math.min(photo.left,paw.left),right:Math.max(photo.right,paw.right),top:Math.min(photo.top,paw.top),bottom:Math.max(photo.bottom,paw.bottom)};
 const attribution=map.getContainer().querySelector('.maplibregl-ctrl-bottom-right')?.getBoundingClientRect().height||28;
 const top=Math.max(frame.top,document.querySelector('.source-nav').getBoundingClientRect().bottom),bottom=Math.min(frame.bottom-attribution,innerHeight);
 const dx=box.left<frame.left+gap?frame.left+gap-box.left:box.right>frame.right-gap?frame.right-gap-box.right:0;
 const dy=box.top<top+gap?top+gap-box.top:box.bottom>bottom-gap?bottom-gap-box.bottom:0;
 if(Math.abs(dx)>1||Math.abs(dy)>1)map.panBy([-dx,-dy],{duration:180});
}
function select(id,recenter=true){
 const row=visible.find(r=>r.place.id===id);if(!row)return;selectedId=id;details(row);
 document.querySelectorAll('[data-place]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.place===id)));
 if(map){
  marker.setLngLat([row.place.position.lng,row.place.position.lat]).addTo(map);openPhotographs(row);
  // Selection only pans. User zoom is preserved for map clicks, list selection and recentering.
  if(recenter){map.once('moveend',keepPopupVisible);const height=popup?.isOpen()?popup.getElement().getBoundingClientRect().height:0;map.easeTo({center:[row.place.position.lng,row.place.position.lat],duration:450,offset:[0,Math.min(height/2,map.getContainer().clientHeight/2-60)]});}
 }
 remember();
}
function render(){
 const options={source,query:$('#map-search').value,region:$('#map-region').value};
 visible=filterPlaces([...publicRows,...($('#show-candidates').checked?candidates:[])],options);
 $('#map-results').innerHTML=visible.map(row=>{
  let summary=row.candidate?'待匹配':row.associations.length+' 条关联';
  if(options.query.trim()&&row.associations.length){const labels=[...new Set(row.associations.map(a=>citation(a.work,a.entry)))];summary=labels[0]+(row.associations.length>1?' · '+row.associations.length+' 张':'');}
  return '<button type="button" class="map-result" data-place="'+esc(row.place.id)+'" aria-pressed="'+String(selectedId===row.place.id)+'"><span>'+esc(name(row))+'</span><small'+(options.query.trim()?' class="search-reference"':'')+'>'+esc(summary)+'</small></button>';
 }).join('')||'<p class="map-empty">'+(options.query.trim()?'无匹配地点':'暂无地点')+'</p>';
 $('#map-count').textContent=visible.length+' 处';
 if(map?.getSource('places'))map.getSource('places').setData(pointsGeoJSON(visible));
 if(selectedId&&visible.some(r=>r.place.id===selectedId))select(selectedId,false);else{selectedId=null;marker?.remove();popup?.remove();details(null);}
 navigation();remember();
}
function feedback(text,retry=false){$('#map-feedback').textContent=text;$('#map-feedback').hidden=!text;$('#map-retry').hidden=!retry;}
async function init(){
 if(loading||map)return;loading=true;feedback('地图加载中…');
 try{
 library ||= import('./vendor/maplibre-6.16.0/maplibre-gl.mjs').catch(e=>{library=null;throw e;});const gl=await library;
 gl.setWorkerUrl(new URL('./vendor/maplibre-6.16.0/maplibre-gl-worker.mjs',import.meta.url).href);
 const c=(params.get('c')||'').split(',').map(Number),z=Number(params.get('z'));const center=c.length===2&&c.every(Number.isFinite)&&Math.abs(c[0])<=85&&Math.abs(c[1])<=180?[c[1],c[0]]:[129.52,28.39];
 map=new gl.Map({container:'pilgrimage-map',style:'https://tiles.openfreemap.org/styles/liberty',center,zoom:params.has('z')&&Number.isFinite(z)?Math.max(1,Math.min(18,z)):10,attributionControl:false,dragRotate:false,pitchWithRotate:false});
 // Provider sprites can lag new POI categories. A neutral dot preserves the location and label.
 map.setMissingStyleImageResolver(id=>{
  if(map.hasImage(id))return;
  const size=16,pixels=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++)if((x-7.5)**2+(y-7.5)**2<12){const i=(y*size+x)*4;pixels[i]=130;pixels[i+1]=125;pixels[i+2]=117;pixels[i+3]=220;}
  map.addImage(id,{width:size,height:size,data:pixels});
 });
 const paw=pawMarkerElement();paw.addEventListener('click',()=>{const row=visible.find(r=>r.place.id===selectedId);if(row)openPhotographs(row);});
 marker=new gl.Marker({element:paw,anchor:'center'});
 popup=new gl.Popup({anchor:'bottom',offset:[0,-26],maxWidth:'520px',className:'paw-photo-popup',closeButton:true,closeOnClick:false,focusAfterOpen:false});map.addControl(new gl.NavigationControl({showCompass:false}),'top-right');map.addControl(new gl.ScaleControl(),'bottom-left');map.addControl(new gl.AttributionControl({compact:true}),'bottom-right');
 map.on('load',()=>{
 map.addSource('places',{type:'geojson',data:pointsGeoJSON(visible),cluster:true,clusterRadius:36,clusterMaxZoom:13});
 map.addLayer({id:'clusters',type:'circle',source:'places',filter:['has','point_count'],paint:{'circle-color':'#846c61','circle-radius':18,'circle-stroke-color':'#fff','circle-stroke-width':2}});
 map.addLayer({id:'cluster-count',type:'symbol',source:'places',filter:['has','point_count'],layout:{'text-field':['get','point_count_abbreviated'],'text-size':11,'text-font':['Noto Sans Regular']},paint:{'text-color':'#fff'}});
 map.addLayer({id:'places',type:'circle',source:'places',filter:['!', ['has','point_count']],paint:{'circle-color':['case',['get','candidate'],'#a29b93','#98665a'],'circle-radius':7,'circle-stroke-color':'#fff','circle-stroke-width':2}});
 map.on('click','places',e=>select(e.features[0].properties.id,false));
 map.on('click','clusters',async e=>{try{const f=e.features[0],zoom=await map.getSource('places').getClusterExpansionZoom(f.properties.cluster_id);map.easeTo({center:f.geometry.coordinates,zoom});}catch{}});
 for(const layer of ['places','clusters']){map.on('mouseenter',layer,()=>map.getCanvas().style.cursor='pointer');map.on('mouseleave',layer,()=>map.getCanvas().style.cursor='');}
 if(selectedId)select(selectedId,!params.has('c'));
 });
 map.on('moveend',remember);map.on('resize',()=>{sizePopup();requestAnimationFrame(keepPopupVisible);});map.on('error',()=>feedback('地图暂未加载',true));map.on('idle',()=>{if(map?.isStyleLoaded()&&map.areTilesLoaded()){clearTimeout(loadTimer);feedback('');}});
 loadTimer=setTimeout(()=>{if(map&&!map.loaded())feedback('地图加载较慢',true);},15000);
 }catch{map?.remove();map=null;marker=null;popup=null;feedback('地图无法加载',true);}finally{loading=false;}
}
$('#map-results').addEventListener('click',e=>{const b=e.target.closest('[data-place]');if(b)select(b.dataset.place);});
$('#source-options').addEventListener('click',()=>menu(false));
$('#map-source').addEventListener('change',e=>{source=e.target.value;render();});
$('#source-toggle').addEventListener('click',()=>{if(hoverOpened){hoverOpened=false;menu(true);}else menu($('#source-dropdown').hidden);});
$('#source-menu').addEventListener('mouseenter',()=>{if(matchMedia('(min-width: 601px) and (hover:hover)').matches){menu(true);hoverOpened=true;}});
$('#source-menu').addEventListener('mouseleave',()=>{if(!$('#source-menu').contains(document.activeElement))menu(false);});
$('#source-toggle').addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();menu(true);$('#source-options a')?.focus();}});
$('#source-menu').addEventListener('keydown',e=>{if(e.key==='Escape'){menu(false);$('#source-toggle').focus();}});
$('#source-menu').addEventListener('focusout',e=>{if(!$('#source-menu').contains(e.relatedTarget))menu(false);});
document.addEventListener('click',e=>{if(!$('#source-menu').contains(e.target))menu(false);});
for(const id of ['#map-region','#show-candidates'])$(id).addEventListener('change',render);
$('#map-search').addEventListener('input',render);
$('#map-search').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing&&e.target.value.trim()&&visible.length){e.preventDefault();select(visible[0].place.id);}});$('#map-recenter').addEventListener('click',()=>{if(selectedId)select(selectedId);});
$('#map-retry').addEventListener('click',()=>{clearTimeout(loadTimer);map?.remove();map=null;marker=null;popup=null;init();});
render();init();

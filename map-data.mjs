import {parseSearchQuery,matchesPage,matchesText} from './search.mjs';
export const positionLabel=p=>Number(p.lat.toFixed(6))+", "+Number(p.lng.toFixed(6));
// One marker per stable place ID. Associations retain every work/entry pair.
export function placeIndex(data){
 const rows=new Map(data.places.filter(p=>p.position).map(p=>[p.id,{place:p,associations:[]}]));
 const works=new Map(data.works.map(w=>[w.id,w]));
 for(const group of data.entries)for(const entry of group.items)for(const location of entry.locations){
  const row=rows.get(location.placeId);if(!row)continue;
  const key=group.workId+':'+entry.id;
  if(!row.associations.some(a=>a.key===key))row.associations.push({key,work:works.get(group.workId),entry,matchStatus:location.matchStatus});
 }
 return [...rows.values()];
}
export function filterPlaces(rows,{source='all',query='',region='all'}={}){
 const request=parseSearchQuery(query);
 return rows.filter(row=>region==='all'||(row.place.position.lat>=27.8&&row.place.position.lat<=28.6&&row.place.position.lng>=129&&row.place.position.lng<=130.1)).map(row=>{
  let associations=row.associations.filter(a=>source==='all'||a.work.id===source);
  if(source!=='all'&&!associations.length)return null;
  const p=row.place,placeTerms=[p.name,...(p.aliases||[]),p.region,p.address,p.countryCode];
  if(request.type==='page'){
   associations=associations.filter(a=>a.work.id==='pilgrim'&&matchesPage(a.entry,request));if(!associations.length)return null;
  }else if(request.type==='text'&&!matchesText(placeTerms,request)){
   associations=associations.filter(a=>matchesText([...placeTerms,a.work.title,a.work.region,a.entry.reference?citation(a.work,a.entry):''],request));
   if(!associations.length)return null;
  }
  return {...row,associations};
 }).filter(Boolean);
}
export function pointsGeoJSON(rows){return {type:'FeatureCollection',features:rows.map(row=>({type:'Feature',id:row.place.id,geometry:{type:'Point',coordinates:[row.place.position.lng,row.place.position.lat]},properties:{id:row.place.id,label:row.place.name||positionLabel(row.place.position),count:row.associations.length,candidate:Boolean(row.candidate)}}))};}
export function citation(work,entry){const r=entry.reference;if(r.type==='page')return work.title+' p.'+(r.pages.length>1?r.pages[0]+'–'+r.pages.at(-1):r.pages[0]);if(r.type==='timecode'){const t=Math.floor(r.startMs/1000);return work.title+' '+Math.floor(t/60)+':'+String(t%60).padStart(2,'0');}return work.title;}

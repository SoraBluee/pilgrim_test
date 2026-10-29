import {parseSearchQuery,matchesPage,matchesText} from './search.mjs';
export const positionLabel=p=>Number(p.lat.toFixed(6))+", "+Number(p.lng.toFixed(6));
export const regions=[{"id": "amami", "label": "奄美"}, {"id": "tokyo", "label": "东京"}, {"id": "chiba", "label": "千叶"}, {"id": "choshi", "label": "铫子"}, {"id": "ashikaga", "label": "足利"}, {"id": "iwaki", "label": "磐城"}, {"id": "yokohama", "label": "横滨"}, {"id": "fukushima", "label": "福岛"}, {"id": "ichihara", "label": "市原"}, {"id": "naha", "label": "那霸"}, {"id": "yachimata", "label": "八街"}, {"id": "sapporo", "label": "札幌"}, {"id": "higashiizu", "label": "东伊豆"}, {"id": "osaka", "label": "大阪"}, {"id": "heidelberg", "label": "海德堡"}, {"id": "london", "label": "伦敦"}];
export function placeRegionId(place){
 const known=regions.find(r=>r.label===place.region);if(known)return known.id;
 // Legacy local Amami candidates have coordinates but no region metadata.
 const p=place.position;return !place.region&&p&&p.lat>=27.8&&p.lat<=28.6&&p.lng>=129&&p.lng<=130.1?'amami':null;
}
export const regionOptions=rows=>regions.filter(r=>rows.some(row=>placeRegionId(row.place)===r.id));
// One marker per stable place ID. Associations retain every work/entry pair.
export function placeIndex(data){
 const rows=new Map(data.places.filter(p=>p.position).map(p=>[p.id,{place:p,associations:[]}]));
 const works=new Map(data.works.map(w=>[w.id,w]));
 const referenceKeys=new Set((data.referenceImages||[]).filter(r=>r.src||r.thumbnail).map(r=>r.workId+':'+r.entryId));
 const photoIds=new Set((data.photos||[]).filter(p=>p.src||p.thumbnail).map(p=>p.id));
 for(const group of data.entries)for(const entry of group.items)for(const location of entry.locations){
  const row=rows.get(location.placeId);if(!row)continue;
  const key=group.workId+':'+entry.id;
  if(!row.associations.some(a=>a.key===key))row.associations.push({key,work:works.get(group.workId),entry,matchStatus:location.matchStatus,hasImage:referenceKeys.has(key)||(entry.photoIds||[]).some(id=>photoIds.has(id))});
 }
 return [...rows.values()];
}
export function filterPlaces(rows,{source='all',query='',region='all'}={}){
 const request=parseSearchQuery(query);
 return rows.filter(row=>region==='all'||placeRegionId(row.place)===region).map(row=>{
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

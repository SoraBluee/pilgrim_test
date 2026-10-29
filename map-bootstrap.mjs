export function initialMapView(rows,params=new URLSearchParams()){
 const c=(params.get('c')||'').split(',').map(Number),z=Number(params.get('z'));
 const validCenter=(params.get('c')||'').split(',').every(value=>value.trim()!=='')&&c.length===2&&c.every(Number.isFinite)&&Math.abs(c[0])<=85&&Math.abs(c[1])<=180;
 if(validCenter)return {center:[c[1],c[0]],zoom:params.has('z')&&Number.isFinite(z)?Math.max(1,Math.min(18,z)):10};
 const selected=rows.find(row=>row.place.id===params.get('place'));
 if(selected)return {center:[selected.place.position.lng,selected.place.position.lat],zoom:params.has('z')&&Number.isFinite(z)?Math.max(1,Math.min(18,z)):14};
 const positions=rows.map(row=>row.place.position).filter(p=>p&&Number.isFinite(p.lat)&&Number.isFinite(p.lng));
 if(!positions.length)return {center:[129.52,28.39],zoom:10};
 if(positions.length===1)return {center:[positions[0].lng,positions[0].lat],zoom:13};
 return {bounds:[[Math.min(...positions.map(p=>p.lng)),Math.min(...positions.map(p=>p.lat))],[Math.max(...positions.map(p=>p.lng)),Math.max(...positions.map(p=>p.lat))]],fitBoundsOptions:{padding:45,maxZoom:13,duration:0}};
}
export const labelField=language=>['coalesce',['get',language==='en'?'name:en':language==='ja'?'name:ja':'name:zh'],['get','name'],['get','name:latin']];
export function lightMapStyle(language='zh'){
 const text=labelField(language);
 return {version:8,name:'Pilgrimage',glyphs:'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',sources:{openmaptiles:{type:'vector',url:'https://tiles.openfreemap.org/planet',attribution:'<a href="https://openfreemap.org/" target="_blank">OpenFreeMap</a> · <a href="https://openmaptiles.org/" target="_blank">© OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a>'}},layers:[
 {id:'background',type:'background',paint:{'background-color':'#f7f4eb'}},
 {id:'landcover',type:'fill',source:'openmaptiles','source-layer':'landcover',paint:{'fill-color':['match',['get','class'],['wood','grass'],'#e3eecf','#eeefdd'],'fill-opacity':0.8}},
 {id:'landuse',type:'fill',source:'openmaptiles','source-layer':'landuse',minzoom:8,paint:{'fill-color':['match',['get','class'],['park','recreation_ground','cemetery'],'#e5efd7',['residential','industrial'],'#ece9e2','#f0eedc']}},
 {id:'water',type:'fill',source:'openmaptiles','source-layer':'water',paint:{'fill-color':'#a2bfff'}},
 {id:'waterway',type:'line',source:'openmaptiles','source-layer':'waterway',paint:{'line-color':'#9cbcf4','line-width':1.2}},
 {id:'boundaries',type:'line',source:'openmaptiles','source-layer':'boundary',paint:{'line-color':'#c8c1b9','line-width':0.8,'line-dasharray':[3,3]}},
 {id:'road-casing',type:'line',source:'openmaptiles','source-layer':'transportation',minzoom:8,layout:{'line-join':'round','line-cap':'round'},paint:{'line-color':'#fff','line-width':['interpolate',['linear'],['zoom'],8,0.8,14,4,18,14]}},
 {id:'roads',type:'line',source:'openmaptiles','source-layer':'transportation',minzoom:8,layout:{'line-join':'round','line-cap':'round'},paint:{'line-color':['match',['get','class'],['motorway','trunk'],'#f3c57e',['primary','secondary'],'#ffe3a7','#e3ded5'],'line-width':['interpolate',['linear'],['zoom'],8,0.5,14,2.2,18,10]}},
 {id:'buildings',type:'fill',source:'openmaptiles','source-layer':'building',minzoom:14,paint:{'fill-color':'#ddd9d1','fill-outline-color':'#d1ccc3'}},
 {id:'place-label',type:'symbol',source:'openmaptiles','source-layer':'place',minzoom:3,layout:{'text-field':text,'text-font':['Noto Sans Regular'],'text-size':['interpolate',['linear'],['zoom'],5,11,14,16]},paint:{'text-color':'#5a554f','text-halo-color':'#fffef7','text-halo-width':1.4}},
 {id:'road-label',type:'symbol',source:'openmaptiles','source-layer':'transportation_name',minzoom:14,layout:{'symbol-placement':'line','text-field':text,'text-font':['Noto Sans Regular'],'text-size':11},paint:{'text-color':'#77716a','text-halo-color':'#fff','text-halo-width':1}}
 ]};
}

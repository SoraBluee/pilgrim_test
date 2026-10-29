// Safe links shared by map thumbnails and the photograph detail page.
export function googleMapHref(point){
 if(!point||!Number.isFinite(point.lat)||!Number.isFinite(point.lng)||Math.abs(point.lat)>90||Math.abs(point.lng)>180)return null;
 return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(point.lat+','+point.lng);
}
export function safeMapReturn(value,base){
 if(!value)return null;
 try{
  const origin=new URL(base),url=new URL(value,origin),map=new URL('map.html',origin);
  if(url.origin!==origin.origin||url.pathname!==map.pathname||url.username||url.password)return null;
  const clean=new URL(map);for(const key of ['place','source','region','c','z','q'])if(url.searchParams.has(key))clean.searchParams.set(key,url.searchParams.get(key));
  return clean.pathname+clean.search;
 }catch{return null;}
}
export function photoHref(workId,entryId,returnUrl,base){
 const query=new URLSearchParams({entry:entryId}),back=safeMapReturn(returnUrl,base);
 if(back)query.set('return',back);
 return 'index.html?'+query+'#source/'+encodeURIComponent(workId);
}

// Exiting to a gallery must clear the photo deep-link and its map-return context.
export function galleryHref(workId,base){
 const url=new URL('index.html',base);url.hash='source/'+encodeURIComponent(workId);
 return url.pathname+url.hash;
}

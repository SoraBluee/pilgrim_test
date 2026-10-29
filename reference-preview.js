(() => {
'use strict';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const profile=window.REONA_PHOTO_PROFILE;
function find(workId,entryId){
 const approved=window.REONA_DATA?.referenceImages?.find(s=>s.workId===workId&&s.entryId===entryId&&s.permission==='website-approved');
 if(approved)return approved;
 const local=window.REONA_LOCAL?.samples?.find(s=>s.workId===workId&&s.entryId===entryId);
 return local?{...local,local:true}:undefined;
}
function markup(image,label,thumbnail=false,{priority=false}={}){
 const src=thumbnail?(image.thumbnail||image.src):(image.src||image.thumbnail);if(!src)return '';
 if(!image.local){
  const img='<img class="processed-reference" src="'+esc(src)+'" alt="'+esc(label)+'" decoding="async" loading="'+(thumbnail&&!priority?'lazy':'eager')+'"'+(priority?' fetchpriority="high"':'')+'>';
  return !thumbnail&&image.thumbnail&&image.thumbnail!==src?'<span class="reference-full"><img class="reference-underlay" src="'+esc(image.thumbnail)+'" alt="" aria-hidden="true" decoding="async">'+img+'</span>':img;
 }
 const p=profile;
 return '<span class="reference-preview" style="--reference-blur:'+(p.blurRatio*100)+'cqi;--watermark-opacity:'+p.watermarkOpacity+';--reference-saturation:'+p.saturation+';--watermark-angle:'+p.watermarkRotationDeg+'deg'+'"><img src="'+esc(src)+'" alt="'+esc(label)+'" loading="lazy"><span class="reference-watermarks" aria-hidden="true">'+Array(p.watermarkColumns*p.watermarkRows).fill('<span>'+esc(p.watermarkText)+'</span>').join('')+'</span><span class="reference-copyright" aria-hidden="true">'+esc(p.copyright)+'</span></span>';
}
window.ReoNaReference={find,markup,profile};
})();

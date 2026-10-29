// Shared local search: exact page meaning and flexible place/work wording.
export const normalizeQuery=value=>String(value??'').normalize('NFKC').toLowerCase().replace(/[−﹣]/g,'-').trim();
const compact=value=>normalizeQuery(value).replace(/[\p{P}\p{S}\s]+/gu,'');
export function parseSearchQuery(value){
 const raw=normalizeQuery(value);if(!raw)return {type:'empty',raw};
 const page=raw.replace(/\s+/g,'').match(/^(?:pilgrim|pilg)?(?:p(?:age)?[.:]?|第)?([+-]?\d+)(?:页)?$/);
 if(page)return {type:'page',raw,page:Number.isSafeInteger(Number(page[1]))?Number(page[1]):-1};
 return {type:'text',raw,terms:raw.split(/\s+/).map(compact).filter(Boolean)};
}
export function matchesPage(entry,query){return query.type==='page'&&entry.reference?.type==='page'&&entry.reference.pages.includes(query.page);}
export function matchesText(values,query){
 if(query.type==='empty')return true;
 const terms=query.type==='text'?query.terms:[compact(query.raw)];if(!terms.length||terms.some(t=>!t))return false;
 const text=compact(values.filter(v=>v!==null&&v!==undefined).join(' '));return terms.every(term=>text.includes(term));
}

export const categoryLabels={manga:'漫画',novel:'小说',food:'食物'};
export const officialImageOrigins=['https://magazine.jp.square-enix.com','https://www.akitashoten.co.jp','https://dvs-cover.kodansha.co.jp','https://youngjump.jp','https://sbc.e-comi.shogakukan.co.jp','https://cdn.kdkw.jp','https://static.ichijinsha.co.jp','https://static-data.ichijinsha.co.jp','https://ultra.shueisha.co.jp','https://dw9to29mmj727.cloudfront.net'];
export function availableCategories(items){return Object.keys(categoryLabels).filter(id=>items.some(item=>item.category===id));}
export function recommendationRoute(hash,items){
 const categories=availableCategories(items);let parts=[];try{parts=hash.replace(/^#/,'').split('/').map(decodeURIComponent);}catch{}
 const item=parts[0]==='item'?items.find(i=>i.id===parts[1]):null;
 const category=item?.category||(parts[0]==='category'&&categories.includes(parts[1])?parts[1]:categories[0]);
 return {category,item:item||null};
}
export const categoryHref=id=>'#category/'+encodeURIComponent(id);
export const itemHref=id=>'#item/'+encodeURIComponent(id);

export function sortRecommendations(items){
 const latest=item=>Math.max(...item.sources.map(source=>Date.parse(source.postedAt)));
 return [...items].sort((a,b)=>latest(b)-latest(a));
}

(() => {
'use strict';
const container=document.querySelector('.brand-composition');if(!container)return;
const wordmark=document.createElement('img');wordmark.className='brand-wordmark';wordmark.src='assets/branding/reona-handwritten.svg';wordmark.alt='';
const subtitle=document.createElement('img');subtitle.className='brand-subtitle';subtitle.src='assets/branding/junrei-handwritten.svg';subtitle.alt='';
container.replaceChildren(wordmark,subtitle);container.setAttribute('aria-hidden','true');
const trail=document.createElement('div');trail.className='paw-trail';trail.innerHTML=Array(3).fill('<img src="assets/branding/paw.svg" alt="">').join('');container.append(trail);
container.insertAdjacentHTML('beforeend',"<svg class=\"kuro-mascot\" viewBox=\"166 238 202 140\" role=\"img\" aria-label=\"Kuro\">\n      <defs><clipPath id=\"official-kuro-clip\"><path d=\"M216 241 214 262 208 286 209 291 222 286 243 276 262 267 250 285 239 303 235 316 251 301 264 288 278 277 294 270 310 267 326 271 341 282 364 288 346 295 342 309 336 327 327 346 319 367 310 373 302 372 307 354 309 341 303 340 297 348 289 357 284 369 274 374 267 371 273 355 280 342 285 333 275 336 265 345 253 357 247 372 237 374 234 370 239 354 247 344 241 346 235 342 229 341 223 347 212 366 203 369 200 365 206 355 210 348 203 349 197 346 192 344 187 340 181 346 177 342 172 341 168 334 169 323 173 311 181 296 194 274 206 254Z\"/></clipPath></defs>\n      <image href=\"assets/branding/kuro-official.png\" width=\"411\" height=\"389\" clip-path=\"url(#official-kuro-clip)\"/>\n    </svg>");
const top=document.querySelector('#back-top');if(top)top.innerHTML='<img src="assets/branding/paw.svg" alt="">';
})();

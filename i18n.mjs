import {translate,normalizeLanguage} from './translations.mjs';
const storage='reona-pilgrimage-language-v1';
let language='zh';try{language=normalizeLanguage(localStorage.getItem(storage));}catch{}
export const t=(key,values)=>translate(key,language,values);
export const region=value=>value?t(value):value;
export const currentLanguage=()=>language;
export function applyTranslations(root=document){
 document.documentElement.lang={zh:'zh-CN',en:'en',ja:'ja'}[language];
 for(const element of root.querySelectorAll('[data-i18n]'))element.textContent=t(element.dataset.i18n);
 for(const attribute of ['aria-label','placeholder'])for(const element of root.querySelectorAll('[data-i18n-'+attribute+']'))element.setAttribute(attribute,t(element.getAttribute('data-i18n-'+attribute)));
 for(const button of root.querySelectorAll('[data-language]'))button.setAttribute('aria-pressed',String(button.dataset.language===language));
}
export function setLanguage(value){
 const next=normalizeLanguage(value);if(next===language)return;
 language=next;try{localStorage.setItem(storage,language);}catch{}
 applyTranslations();window.dispatchEvent(new CustomEvent('reona-language-change',{detail:{language}}));
}
document.addEventListener('click',event=>{const button=event.target.closest('[data-language]');if(button)setLanguage(button.dataset.language);});
window.ReoNaI18n={t,apply:applyTranslations,currentLanguage};applyTranslations();

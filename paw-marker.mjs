// Original paw geometry restored from the local r03 decoration.
export function pawMarkerElement(){
 const element=document.createElement('button');element.className='paw-map-marker';element.type='button';element.setAttribute('aria-label',window.ReoNaI18n?.t('查看选中地点照片')||'查看选中地点照片');
 element.innerHTML="<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 40 44\"><g fill=\"currentColor\"><ellipse cx=\"8\" cy=\"18\" rx=\"4.1\" ry=\"5.7\" transform=\"rotate(-28 8 18)\"/><ellipse cx=\"16\" cy=\"9\" rx=\"4.4\" ry=\"6.2\" transform=\"rotate(-10 16 9)\"/><ellipse cx=\"26\" cy=\"10\" rx=\"4.2\" ry=\"6.1\" transform=\"rotate(13 26 10)\"/><ellipse cx=\"33\" cy=\"20\" rx=\"3.8\" ry=\"5.7\" transform=\"rotate(30 33 20)\"/><path d=\"M9 33c0-5 4-6 7-11 3-4 7-4 10 0 2 4 7 7 6 12-1 5-5 5-10 3-5 2-13 3-13-4Z\"/></g></svg>";return element;
}

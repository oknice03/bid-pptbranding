import assert from 'node:assert/strict';

export function sortPortfolio(items, entries) {
  for (const value of Object.values(entries)) {
    if (value.sortDate) assert(/^\d{4}-\d{2}-\d{2}$/.test(value.sortDate) && !Number.isNaN(Date.parse(value.sortDate)), '작업 날짜 형식 확인');
  }
  return [...items].sort((a,b) => {
    const da=entries[a.slug]?.sortDate, db=entries[b.slug]?.sortDate;
    return (da&&db ? db.localeCompare(da) : da ? -1 : db ? 1 : 0) || (a.order??999)-(b.order??999) || a.slug.localeCompare(b.slug);
  });
}
export function portfolioVisual(c, display, esc, prefix='') {
  const cover=display?.cover ?? c.cardImage?.src ?? c.image;
  const interior=display?.interiors ?? [];
  const image=(src,alt,cls='')=>'<img class="'+cls+'" src="'+esc(prefix+src)+'" alt="'+esc(alt)+'" loading="lazy" decoding="async">';
  if(!interior.length) return '<div class="mp-card-visual mp-preview-solo">'+image(cover,c.title+' 표지와 디자인 대표 이미지')+'</div>';
  return '<div class="mp-card-visual mp-preview-composite"><div class="mp-preview-cover">'+image(cover,c.title+' 실제 표지')+'</div><div class="mp-preview-interiors">'+interior.slice(0,3).map((img,i)=>'<div class="mp-preview-page">'+image(img.src,img.alt||c.title+' 실제 내지 '+(i+1))+'</div>').join('')+'</div></div>';
}

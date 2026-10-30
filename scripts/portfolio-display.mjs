import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {directions,backgrounds} from './portfolio-art.mjs';
const media=JSON.parse(readFileSync(new URL('../content/portfolio-media.json',import.meta.url),'utf8'));

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
  const interiors=display?.interiors ?? [];
  const slug=c.slug ?? c.url?.split('/').filter(Boolean).at(-1);
  assert(directions[slug], '포트폴리오 아트 디렉션 누락: '+slug);
  const [theme,layout]=directions[slug];
  const frame=(src,alt,cls)=>{
    const m=media[src];
    assert(m,'이미지 비율·파생본 미준비: '+src);
    const crop=m.crop??[0,0,m.width,m.height];
    const style='--page-ratio:'+crop[2]+'/'+crop[3]+';--image-width:'+(m.width/crop[2]*100)+'%;--image-left:'+(-crop[0]/crop[2]*100)+'%;--image-top:'+(-crop[1]/crop[3]*100)+'%';
    return '<div class="mp-art-sheet '+cls+'" style="'+style+'"><img src="'+esc(prefix+m.thumbnail)+'" alt="'+esc(alt)+'" width="'+m.thumbWidth+'" height="'+m.thumbHeight+'" loading="lazy" decoding="async" data-original="'+esc(src)+'"></div>';
  };
  assert(backgrounds[slug], '프로젝트별 배경 누락: '+slug);
  const background='<img class="mp-art-background" src="'+esc(backgrounds[slug])+'" alt="" aria-hidden="true" width="1200" height="750" loading="lazy" decoding="async">';
  const sheets=frame(cover,c.title+(interiors.length?' 실제 표지':' 디자인 대표 이미지'),'mp-art-cover')+
    interiors.slice(0,layout.startsWith('portrait')?2:3).map((p,i)=>frame(p.src,p.alt||c.title+' 실제 내지 '+(i+1),'mp-art-inside mp-art-inside-'+i)).join('');
  return '<div class="mp-card-visual mp-art-stage mp-art-'+layout+' mp-art-theme-'+theme+'" data-art-case="'+esc(slug)+'">'+background+'<div class="mp-art-pages">'+sheets+'</div></div>';
}

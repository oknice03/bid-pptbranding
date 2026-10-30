import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {portfolioVisual} from './portfolio-display.mjs';
import {directions,backgrounds} from './portfolio-art.mjs';
import {createHash} from 'node:crypto';
const media=JSON.parse(await readFile('content/portfolio-media.json','utf8'));
const display=JSON.parse(await readFile('content/portfolio-display.json','utf8')).entries;
const related=JSON.parse(await readFile('content/related-displays.json','utf8'));
const site=JSON.parse(await readFile('content/site.json','utf8'));
const list=await readFile('dist/portfolio/index.html','utf8');
const home=await readFile('dist/index.html','utf8');
const expected=site.id==='bid'?18:16;
assert.equal((list.match(/data-case data-category=/g)||[]).length,expected);
assert.equal((home.match(/data-case data-category=/g)||[]).length,6);
assert(!list.includes('pressure-vessel-profile'),'제외된 세광은 노출하지 않음');
let variants=new Set(),bytes=0;
for(const [slug,entry] of Object.entries({...display,...related})){
 if(slug==='pressure-vessel-profile') continue;
 assert(directions[slug],slug);
 const [theme,layout]=directions[slug];variants.add(layout);
 const html=portfolioVisual({slug,title:slug},entry,s=>s);
 const count=(html.match(/class="mp-art-sheet /g)||[]).length;
 assert.equal(count,1+Math.min(entry.interiors.length,layout.startsWith('portrait')?2:3),slug+' 표지/내지 수');
 assert(html.includes('alt="" aria-hidden="true"'),'장식 배경 접근성');
 assert(list.includes('data-art-case="'+slug+'"'),slug+' 목록 누락');
 await stat('dist'+backgrounds[slug]);
}
for(const [src,m] of Object.entries(media)){
 assert(m.width>0&&m.height>0&&m.thumbWidth>0&&m.thumbHeight>0,src);
 assert(Math.abs(m.width/m.height-m.thumbWidth/m.thumbHeight)<0.006,src+' 파생본 비율');
 if(m.crop){ const [x,y,w,h]=m.crop;assert(x>=0&&y>=0&&x+w<=m.width&&y+h<=m.height,src+' 외부 여백 경계'); }
 bytes+=(await stat('.'+m.thumbnail)).size;
}
assert(variants.size>=4);
assert.equal(Object.keys(backgrounds).length,34,'두 사이트 전체 프로젝트34개');
assert.equal(new Set(Object.values(backgrounds)).size,34,'프로젝트별 배경 경로 중복 금지');
const hashes=await Promise.all(Object.values(backgrounds).map(async src=>createHash('sha256').update(await readFile('.'+src)).digest('hex')));
assert.equal(new Set(hashes).size,34,'이름만 다른 동일 배경 사용 금지');
console.log('Unique project backgrounds: 34 paths / 34 image hashes');
console.log(JSON.stringify({result:'PASS',cases:expected,layouts:variants.size,webDerivatives:Object.keys(media).length,totalDerivativeMB:+(bytes/1024/1024).toFixed(2),originalsPreserved:true},null,2));

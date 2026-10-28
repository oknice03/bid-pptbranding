import {readFile,readdir,stat,access} from 'node:fs/promises';
import {sortPortfolio} from './portfolio-display.mjs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {buildLlmsText} from './search-assets.mjs';
export async function checkSearchAssets(site,root){
 const catalog=JSON.parse(await readFile('content/cases.json','utf8'));
 for(const name of await readdir('content/cases').catch(()=>[]))if(name.endsWith('.json'))catalog.push(JSON.parse(await readFile(path.join('content/cases',name),'utf8')));
 const display=JSON.parse(await readFile('content/portfolio-display.json','utf8'));
 const ready=sortPortfolio(catalog.filter(c=>c.status==='ready'),display.entries);
 const guides=JSON.parse(await readFile('content/guides.json','utf8'));
 const llms=await readFile(path.join(root,'llms.txt'),'utf8');
 assert.equal(llms,buildLlmsText(site,ready,guides),'AI 안내 파일이 공개 데이터와 일치해야 합니다.');
 assert(Buffer.byteLength(llms)<20000,'AI 안내 파일 크기');
 assert(!/C:[/\\]|E:[/\\]|source-images|generated_images/.test(llms),'내부 경로 노출');
 for(const c of catalog.filter(c=>c.status==='draft'))assert(!llms.includes('/portfolio/'+c.slug+'/'),'초안의 AI 안내 노출');
 let links=0;
 for(const m of llms.matchAll(/\]\((https:\/\/[^)]+)\)/g)){
  const url=new URL(m[1]);assert(url.protocol==='https:');
  if(url.origin!==site.domain)continue;
  let file=path.join(root,decodeURIComponent(url.pathname));
  if((await stat(file).catch(()=>null))?.isDirectory())file=path.join(file,'index.html');
  await access(file);links++;
  if(url.hash){const html=await readFile(file,'utf8');assert(html.includes('id="'+url.hash.slice(1)+'"'),'AI 안내 앵커 누락');}
 }
 const source=await readFile('index.html','utf8'),home=await readFile(path.join(root,'index.html'),'utf8');
 for(const m of source.matchAll(/<meta name="(?:naver|google)-site-verification"[^>]*>/g))assert(home.includes(m[0]),'소유권 확인 메타 태그 보존');
 for(const name of await readdir('.'))if(/^(?:google|naver)[a-f0-9]+\.html$/.test(name))assert.deepEqual(await readFile(name),await readFile(path.join(root,name)),'소유권 파일 보존');
 const robots=await readFile(path.join(root,'robots.txt'),'utf8');
 const preview=robots.includes('Disallow: /');
 if(!preview)assert(robots.includes('Sitemap: '+site.domain+'/sitemap.xml'),'자기 도메인 사이트맵');
 return {llmsBytes:Buffer.byteLength(llms),llmsLocalLinksChecked:links,verificationPreserved:true,previewNoindex:preview};
}

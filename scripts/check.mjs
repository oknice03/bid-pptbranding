import {readFile,readdir,stat,access} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {checkSearchAssets} from './search-check.mjs';
const root=path.resolve('dist'), site=JSON.parse(await readFile('content/site.json','utf8'));
const walk=async dir=>(await Promise.all((await readdir(dir,{withFileTypes:true})).map(x=>x.isDirectory()?walk(path.join(dir,x.name)):path.join(dir,x.name)))).flat();
const files=await walk(root), pages=files.filter(x=>x.endsWith('.html')&&!/google[a-f0-9]+\.html$/.test(x));
const sitemap=await readFile(path.join(root,'sitemap.xml'),'utf8');
const unescape=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const urls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>unescape(m[1]));
assert.equal(new Set(urls).size,urls.length,'sitemap 중복');
const titles=new Set(), canonicals=new Set(), descriptions=new Set();
let linkCount=0,schemaCount=0;
for(const file of pages) {
  const html=await readFile(file,'utf8');
  if(file.includes(path.sep+'portfolio'+path.sep)&&!file.endsWith(path.sep+'portfolio'+path.sep+'index.html')) {
    for(const h of html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gs))assert(h[1].includes(site.service),'사례 H2에 구체적인 서비스 주제 필요: '+file);
    const ownMedia=[...html.matchAll(/<figure class="mp-cover mp-page-figure">[\s\S]*?<img src="([^"]+)"/g)].map(x=>x[1]);
    assert.equal(new Set(ownMedia).size,ownMedia.length,'실제 페이지 중복 렌더링: '+file);
  }
 const rel=path.relative(root,file).replaceAll('\\','/');
 const pagePath=rel==='index.html'?'/':'/'+rel.replace(/index\.html$/,'');
  const url=new URL(pagePath,site.domain);

  for(const heading of html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)){
    const text=unescape(heading[1].replace(/<[^>]+>/g,''));
    assert(/(?:회사소개서|공사지명원) 제작/.test(text),rel+': H2 핵심 주제 확인 '+text);
    assert.equal((text.match(/(?:회사소개서|공사지명원) 제작/g)||[]).length,1,rel+': H2 키워드 중복 '+text);
  }
  if(rel==='index.html'){
    const faq=JSON.parse(await readFile('content/faq.json','utf8'));
    const graph=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m=>{const d=JSON.parse(m[1]);return d['@graph']??[d];});
    const definitions=graph.filter(x=>x['@type']==='FAQPage');assert.equal(definitions.length,1,'FAQ 스키마 중복');
    const questions=definitions[0].mainEntity;
    const visible=[...html.matchAll(/<details class="faq-item"[^>]*><summary><h3>(.*?)<\/h3><\/summary><p class="faq-answer">(.*?)<\/p>/g)];
    assert.equal(visible.length,faq.items.length,'FAQ 화면 질문 수');
    assert.equal(questions.length,faq.items.length,'FAQ 스키마 질문 수');
    faq.items.forEach((q,i)=>{assert.equal(unescape(visible[i][1]),q.question);assert.equal(unescape(visible[i][2]),q.answer);assert.equal(questions[i].name,q.question);assert.equal(questions[i].acceptedAnswer.text,q.answer);});
  }
  if(/^guides\/(materials|outline|estimate)\/index.html$/.test(rel)){
    assert(html.includes(site.service+' 실제 사례와 구성 예시'),'가이드 관련 사례 누락');
    assert(html.includes('href="/#faq"'),'가이드 FAQ 연결 누락');
  }
 assert.equal((html.match(/<h1(?:>|\s)/g)||[]).length,1,rel+': h1');
 const title=html.match(/<title>(.*?)<\/title>/s)?.[1];assert(title&&!titles.has(title),rel+': 제목 중복');titles.add(title);
 const canonical=html.match(/rel="canonical" href="([^"]+)"/)?.[1];
 assert.equal(canonical,url.href,rel+': canonical');assert(!canonicals.has(canonical));canonicals.add(canonical);
 const description=html.match(/<meta name="description" content="([^"]+)"/)?.[1];
 assert(description&&description.length>=25&&!descriptions.has(description),rel+': 구체적인 고유 소개글 필요');descriptions.add(description);
 for(const key of ['og:title','og:description','og:image','twitter:card'])assert(html.includes('"'+key+'"'),rel+': 공유 메타 누락 '+key);
 if(!rel.endsWith('404.html'))assert(html.includes('rel="describedby" href="/llms.txt"'),'AI 안내 링크 누락');
 const noindex=html.includes('content="noindex,follow"');
 if(!rel.endsWith('404.html'))assert(urls.includes(url.href),rel+': sitemap 누락');
 else assert(noindex&&!urls.includes(url.href),'404는 색인 대상 아님');
 for(const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
   const data=JSON.parse(m[1]);schemaCount++;
   if(data['@graph'])assert(data['@graph'].some(x=>x['@id']==='https://pptbranding.com/#organization'),rel+': 브랜드 식별자');
 }
 for(const m of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
  const value=unescape(m[1]);if(!value||/^(tel:|mailto:|data:)/.test(value))continue;
  const target=new URL(value,url);let destRoot;
  if(target.origin===site.domain)destRoot=root;
  else if(target.origin===site.otherDomain&&process.env.PEER_DIST)destRoot=path.resolve(process.env.PEER_DIST);
  else continue;
  let targetFile=path.join(destRoot,decodeURIComponent(target.pathname));
  if((await stat(targetFile).catch(()=>null))?.isDirectory())targetFile=path.join(targetFile,'index.html');
  await access(targetFile).catch(()=>{throw new Error(rel+': 깨진 내부 링크 '+value)});
  linkCount++;
  if(target.hash&&targetFile.endsWith('.html')) {
    const targetHTML=await readFile(targetFile,'utf8'),id=decodeURIComponent(target.hash.slice(1));
    assert(targetHTML.includes('id="'+id+'"'),rel+': 앵커 없음 '+value);
  }
 }
 for(const m of html.matchAll(/<img\b[^>]*>/g)) {
   const decorative=/class="mp-art-background"/.test(m[0]) && /alt=""/.test(m[0]) && /aria-hidden="true"/.test(m[0]);
   assert(decorative || /\balt="[^"]+"/.test(m[0]),rel+': 이미지 대체텍스트');
 }
}
assert(!files.some(x=>/\.(pdf|zip|pptx?|docx?|xlsx?)$/i.test(x)),'비공개 문서가 출력에 포함되었습니다.');
assert(!files.some(x=>/[/\\](content|scripts|\.git|\.claude)[/\\]/.test(x)),'소스 폴더 유출');
const searchAssets=await checkSearchAssets(site,root);
const imagePrivacy=JSON.parse(await readFile('content/image-privacy.json','utf8'));
for(const blocked of imagePrivacy.blocked) assert(!files.includes(path.join(root,blocked.slice(1))),'가림 전 이미지 배포 금지: '+blocked);
console.log(JSON.stringify({result:'PASS',domain:site.domain,htmlPages:pages.length,sitemapURLs:urls.length,internalLinksChecked:linkCount,jsonLdBlocks:schemaCount,privateDocuments:0,...searchAssets},null,2));

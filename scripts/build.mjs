import { readFile, writeFile, readdir, mkdir, copyFile, access, rm, lstat } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {validateStory,renderCase} from './case-page.mjs';
import {validateFaq,faqSchema,renderFaq} from './faq.mjs';
import {buildLlmsText} from './search-assets.mjs';

const root=process.cwd(), out=path.resolve(root,'dist');
const readJSON=async name=>JSON.parse(await readFile(path.join(root,name),'utf8'));
const site=await readJSON('content/site.json');
assert(['https://pptbranding.com','https://bid.pptbranding.com'].includes(site.domain),'승인된 서비스 도메인만 사용하세요.');
const extra=await readdir(path.join(root,'content/cases')).catch(e=>{if(e.code==='ENOENT')return [];throw e;});
const all=[...await readJSON('content/cases.json')];
for(const name of extra.filter(x=>x.endsWith('.json')).sort()) all.push(await readJSON('content/cases/'+name));
const seen=new Set();
for(const c of all) {
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(c.slug),'잘못된 사례 주소');
  assert(!seen.has(c.slug),'중복 사례 주소: '+c.slug);seen.add(c.slug);
  assert(['draft','ready'].includes(c.status),'상태는 draft 또는 ready: '+c.slug);
}
const cases=all.filter(c=>c.status==='ready').sort((a,b)=>(a.order??999)-(b.order??999)||a.slug.localeCompare(b.slug));
assert(cases.length>0,'공개 후보 사례가 없습니다.');
const images=new Set(['/assets/img/logo.png','/assets/img/profile.png']);
const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&new Date(value).toISOString().slice(0,10)===value;
for(const c of cases) {
  for(const key of ['title','category','summary','source']) assert(typeof c[key]==='string'&&c[key].trim(),c.slug+': '+key+' 필요');
  assert(validDate(c.updated),c.slug+': 수정 날짜 형식 확인');
  assert(c.images?.length&&c.sections?.length>=2&&c.highlights?.length,c.slug+': 이미지·본문·특징 필요');
  for(const s of c.sections) assert(s.heading?.trim()&&s.text?.trim(),c.slug+': 빈 본문');
  validateStory(c);
  for(const img of c.images) {
    assert(/^\/assets\/img\/[^?#]+$/u.test(img.src)&&!img.src.includes('..')&&!img.src.includes('\\'),c.slug+': 이미지 경로 확인');
    assert(/\.(jpg|jpeg|png|webp)$/i.test(img.src)&&img.alt?.trim()&&img.caption?.trim(),c.slug+': 이미지 설명 필요');
    images.add(img.src);
  }
}
const related=await readJSON('content/related.json');
const guides=await readJSON('content/guides.json');
const faq=await readJSON('content/faq.json');
validateFaq(faq,site);
assert(validDate(faq.updated),'FAQ 수정 날짜 확인');
const original=await readFile(path.join(root,'index.html'),'utf8');
assert(validDate(site.updated),'사이트 수정 날짜 확인');
for(const g of guides) {
  assert(/^[a-z0-9-]+$/.test(g.slug)&&validDate(g.updated)&&g.sections.length,'가이드 데이터 확인');
  assert(g.sections.every(s=>s.heading.includes(site.service)&&s.text?.trim()),'가이드 제목·본문 확인');
  for(const slug of g.relatedCases??[])assert(cases.some(c=>c.slug===slug),'가이드 관련 사례 없음: '+slug);
}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const absolute=p=>new URL(p,site.domain).href;
const json=x=>JSON.stringify(x).replace(/</g,'\\u003c');
const orgId='https://pptbranding.com/#organization';
const organization={'@type':'Organization','@id':orgId,name:'피피티브랜딩',alternateName:['PPT BRANDING','PPT 브랜딩'],url:'https://pptbranding.com/',logo:'https://pptbranding.com/assets/img/logo.png',description:'광고대행사 출신 기획자가 기획부터 디자인까지 직접 진행하는 회사소개서·공사지명원 제작 브랜드',telephone:'+82-10-7510-0215',email:'oknice03@gmail.com',sameAs:['https://blog.naver.com/powerpointhelper','https://wp.pptbranding.com/']};
const service={'@type':'Service','@id':site.domain+'/#service',name:'피피티브랜딩 '+site.service,serviceType:site.service,url:site.domain+'/',provider:{'@id':orgId},areaServed:{'@type':'Country',name:'대한민국'}};
const website={'@type':'WebSite','@id':site.domain+'/#website',url:site.domain+'/',name:'피피티브랜딩 '+site.service,publisher:{'@id':orgId},inLanguage:'ko-KR'};
const base=[organization,website,service];
const noindex=process.env.SITE_NOINDEX==='1'||['deploy-preview','branch-deploy'].includes(process.env.CONTEXT);
const noScript='<noscript><style>.mp-filters{display:none}@media(max-width:720px){.header-inner{height:auto;min-height:76px;flex-wrap:wrap;padding-top:20px}.main-nav{position:static;transform:none;opacity:1;visibility:visible;pointer-events:auto;width:100%;padding:16px 0;display:flex}.nav-toggle{display:none}}</style></noscript>';
const schema=graph=>'<script type="application/ld+json">'+json({'@context':'https://schema.org','@graph':graph})+'</script>';
const pages=[];
const newest=values=>values.filter(Boolean).sort().at(-1);
const updated=newest([site.updated,faq.updated,...cases.map(c=>c.updated),...guides.map(g=>g.updated)]);
const guideExamples=g=>'<section class="mp-section"><div class="wrap"><h2 class="mp-title">'+site.service+' 실제 사례와 구성 예시</h2><p class="mp-note">안내한 준비·기획 내용을 실제 작업에서 어떻게 정리했는지 살펴보세요.</p><div class="mp-grid">'+(g.relatedCases??[]).map(slug=>card(cases.find(c=>c.slug===slug))).join('')+'</div></div></section>';
const canonicalCase=c=>'/portfolio/'+c.slug+'/';
const nav=()=>'<nav class="main-nav" id="mainNav" aria-label="주 메뉴"><a href="/#services">제작 서비스</a><a href="/portfolio/">포트폴리오</a><a href="/guides/">제작 가이드</a><a href="https://pptbranding.com/about/">브랜드 소개</a><a href="'+site.otherDomain+'/" class="nav-link-outer">'+site.otherService+'</a><a href="/#contact" class="nav-cta">문의하기</a></nav>';
const header=()=>'<a class="skip-link" href="#main">본문 바로가기</a><header class="site-header" id="top"><div class="wrap header-inner"><a href="/" class="brand"><img src="/assets/img/logo.png" alt="피피티브랜딩 PPT BRANDING" class="brand-logo"></a>'+nav()+'<button class="nav-toggle" id="navToggle" aria-label="메뉴 열기" aria-expanded="false" aria-controls="mainNav"><span></span><span></span><span></span></button></div></header>';
const footer=()=>'<footer class="site-footer"><div class="wrap"><img src="/assets/img/logo.png" alt="피피티브랜딩 PPT BRANDING" class="footer-logo"><nav class="mp-footer-nav" aria-label="하단 메뉴"><a href="https://pptbranding.com/services/">전체 서비스</a><a href="https://pptbranding.com/about/">브랜드 소개</a><a href="/portfolio/">'+site.service+' 사례</a><a href="/guides/">제작 가이드</a><a href="/#faq">'+site.service+' 자주 묻는 질문</a><a href="'+site.otherDomain+'/">'+site.otherService+' 보러가기</a><a href="https://blog.naver.com/powerpointhelper">네이버 블로그</a></nav><div class="mp-footer-contact"><a href="tel:01075100215">010-7510-0215</a><a href="mailto:oknice03@gmail.com">oknice03@gmail.com</a></div><p>© PPT BRANDING. All Rights Reserved.</p></div></footer>';
const crumbs=items=>'<nav class="mp-breadcrumb" aria-label="현재 위치"><a href="/">홈</a>'+items.map(([name,url])=>'<span aria-hidden="true">/</span>'+(url?'<a href="'+esc(url)+'">'+esc(name)+'</a>':'<span aria-current="page">'+esc(name)+'</span>')).join('')+'</nav>';
const intro=(title,desc,kicker='PPT BRANDING',meta='')=>'<div class="mp-intro"><div class="wrap"><p class="mp-kicker">'+esc(kicker)+'</p><h1>'+esc(title)+'</h1><p class="mp-lead">'+esc(desc)+'</p>'+meta+'</div></div>';
const card=c=>'<article class="mp-card" data-case data-category="'+esc(c.category)+'"><a href="'+canonicalCase(c)+'"><div class="mp-card-visual"><img src="'+esc(c.images[0].src)+'" alt="'+esc(c.images[0].alt)+'" loading="lazy" decoding="async"></div><div class="mp-card-body"><span class="mp-category">'+esc(c.category)+'</span><h3>'+esc(c.title)+'</h3><p>'+esc(c.summary)+'</p><span class="mp-card-more">'+(c.storyKind==='production'?'선별 실제 페이지 '+c.images.filter(img=>img.kind!=='mockup').length+'장 · 제작 과정 보기':'사례 자세히 보기')+' <span aria-hidden="true">↗</span></span></div></a></article>';
const guideCards=()=>'<div class="mp-guide-grid">'+guides.map((g,i)=>'<article class="mp-guide"><a href="/guides/'+g.slug+'/"><span class="mp-category">GUIDE '+String(i+1).padStart(2,'0')+'</span><h3>'+esc(g.title)+'</h3><p>'+esc(g.summary)+'</p><span class="mp-card-more">가이드 읽기 →</span></a></article>').join('')+'</div>';
const seoHeading=text=>text.includes(site.service)?text:site.service+' '+text;
const cta=()=>'<aside class="mp-cta"><h2>'+site.service+', 구성부터 상담하세요.</h2><p>사용 목적과 현재 갖고 계신 자료를 알려주시면 필요한 기획과 디자인 범위를 함께 정리합니다.</p><a class="btn btn-accent" href="tel:01075100215">전화로 제작 상담</a> <a class="btn btn-outline-light" href="mailto:oknice03@gmail.com">이메일 문의</a></aside>';
function page({url,title,description,body,graph=[],image=cases[0].images[0].src,date=updated,trail=[],exclude=false}){
 const breadcrumb={'@type':'BreadcrumbList',itemListElement:[{name:'홈',url:'/'},...trail].map((p,i)=>({'@type':'ListItem',position:i+1,name:p.name,item:absolute(p.url)}))};
 const webpage={'@type':'WebPage','@id':absolute(url)+'#webpage',url:absolute(url),name:title,description,inLanguage:'ko-KR',isPartOf:{'@id':website['@id']},about:{'@id':service['@id']},publisher:{'@id':orgId},dateModified:date};
 const data=[...base,webpage,...(trail.length?[breadcrumb]:[]),...graph];
 const html='<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>'+esc(title)+' | 피피티브랜딩</title><meta name="description" content="'+esc(description)+'"><link rel="canonical" href="'+absolute(url)+'"><meta name="robots" content="'+(noindex||exclude?'noindex,follow':'index,follow,max-image-preview:large')+'"><meta property="og:type" content="website"><meta property="og:site_name" content="피피티브랜딩"><meta property="og:locale" content="ko_KR"><meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(description)+'"><meta property="og:url" content="'+absolute(url)+'"><meta property="og:image" content="'+absolute(image)+'"><meta property="og:image:alt" content="'+esc(title)+'"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'+esc(title)+'"><meta name="twitter:description" content="'+esc(description)+'"><meta name="twitter:image" content="'+absolute(image)+'"><link rel="icon" href="/assets/img/logo.png"><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"><link rel="stylesheet" href="/css/style.css"><link rel="stylesheet" href="/css/pages.css">'+schema(data)+'</head><body>'+header()+'<main id="main">'+body+'</main>'+footer()+'<script src="/js/pages.js" defer></script></body></html>';
 pages.push({url,html:html.replace('</head>',noScript+'</head>'),date,image,exclude});
}

page({url:'/portfolio/',title:site.service+' 포트폴리오',description:'업종별 '+site.service+' 사례를 확인하세요. 각 사례의 표지와 내부 페이지, 정보 구성과 디자인 특징을 개별 페이지에서 살펴볼 수 있습니다.',trail:[{name:'포트폴리오',url:'/portfolio/'}],
body:'<div class="wrap">'+crumbs([['포트폴리오']])+'</div>'+intro('한 장의 인상부터,\n회사를 설명하는 흐름까지.',site.service+' 사례의 표지와 내부 페이지를 함께 보세요. 이미지뿐 아니라 정보의 구성과 디자인 특징도 정리했습니다.','PORTFOLIO / '+site.service)+'<section class="mp-section"><div class="wrap"><h2 class="mp-title">'+site.service+' 사례</h2><div class="mp-filters"><label>사례 검색<input id="caseSearch" type="search" placeholder="업종 또는 구성 특징 검색"></label><label>업종별 보기<select id="caseCategory"><option value="">전체 업종</option>'+[...new Set(cases.map(c=>c.category))].map(c=>'<option>'+esc(c)+'</option>').join('')+'</select></label><output id="caseCount" aria-live="polite">'+cases.length+'개 사례</output></div><div class="mp-grid">'+cases.map(card).join('')+'</div><p class="mp-empty" id="caseEmpty" hidden>검색 결과가 없습니다. 다른 단어를 입력하거나 전체 업종을 선택해 주세요.</p></div></section><section class="mp-section"><div class="wrap"><div class="mp-heading-row"><h2>함께 살펴볼 '+site.otherService+' 사례</h2><a class="mp-link" href="'+site.otherDomain+'/portfolio/">전체 보기 →</a></div><div class="mp-grid">'+related.map(c=>'<article class="mp-card"><a href="'+esc(c.url)+'"><div class="mp-card-visual"><img loading="lazy" src="'+site.otherDomain+esc(c.image)+'" alt="'+esc(c.title)+' 디자인"></div><div class="mp-card-body"><span class="mp-category">PPT BRANDING / '+site.otherService+'</span><h3>'+esc(c.title)+'</h3><p>'+esc(c.summary)+'</p><span class="mp-card-more">사례 자세히 보기 ↗</span></div></a></article>').join('')+'</div>'+cta()+'</div></section>',
graph:[{'@type':'ItemList',name:site.service+' 포트폴리오',itemListElement:cases.map((c,i)=>({'@type':'ListItem',position:i+1,name:c.title,url:absolute(canonicalCase(c))}))}]});

for(const c of cases) {
 const url=canonicalCase(c);
 const relatedCases=[...cases.filter(x=>x.slug!==c.slug&&x.category===c.category),...cases.filter(x=>x.slug!==c.slug&&x.category!==c.category)].slice(0,3);
 page({url,title:c.title+' 제작 사례',description:c.summary,image:c.images[0].src,date:c.updated,trail:[{name:'포트폴리오',url:'/portfolio/'},{name:c.title,url}],
 body:renderCase(c,{site,esc,crumbs,intro,card,relatedCases}),
 graph:[{'@type':'CreativeWork','@id':absolute(url)+'#work',name:c.title,description:c.summary,url:absolute(url),image:c.images.map(img=>absolute(img.src)),citation:(c.sources??[]).map(s=>s.url),creator:{'@id':orgId},about:{'@id':service['@id']},inLanguage:'ko-KR',mainEntityOfPage:{'@id':absolute(url)+'#webpage'}}]});
}
page({url:'/guides/',title:site.service+' 가이드',description:site.service+'를 준비할 때 확인할 자료, 목차와 견적 상담 기준을 안내합니다.',trail:[{name:'제작 가이드',url:'/guides/'}],body:'<div class="wrap">'+crumbs([['제작 가이드']])+'</div>'+intro('제작 전에,\n먼저 정리하면 좋은 것들.',site.service+'를 처음 의뢰하시는 분을 위한 준비 안내입니다. 자료, 목차, 견적 상담 순서로 살펴보세요.','GUIDE / '+site.service)+'<section class="mp-section"><div class="wrap"><h2 class="mp-title">'+site.service+' 준비 자료·목차·견적 안내</h2>'+guideCards()+cta()+'</div></section>'});
for(const g of guides)page({url:'/guides/'+g.slug+'/',title:g.title,description:g.summary,date:g.updated,trail:[{name:'제작 가이드',url:'/guides/'},{name:g.title,url:'/guides/'+g.slug+'/'}],body:'<div class="wrap">'+crumbs([['제작 가이드','/guides/'],[g.title]])+'</div>'+intro(g.title,g.summary,'GUIDE / '+site.service)+'<section class="mp-section"><div class="wrap mp-case-layout"><article class="mp-prose">'+g.sections.map(s=>'<h2>'+esc(seoHeading(s.heading))+'</h2><p>'+esc(s.text)+'</p>'+(s.items?'<ul>'+s.items.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'')).join('')+'<p><a class="mp-link" href="/#faq">'+site.service+' 자주 묻는 질문 확인하기 →</a></p><p class="mp-note">작성: 피피티브랜딩 · 업데이트: '+esc(g.updated)+'<br>구체적인 제작 범위와 조건은 자료 확인 후 협의합니다.</p><a class="mp-link" href="/portfolio/">실제 '+site.service+' 사례 보기 →</a></article><aside class="mp-sidebar"><span class="mp-category">함께 읽는 안내</span><h2>'+site.service+' 준비 안내</h2>'+guides.filter(x=>x.slug!==g.slug).map(x=>'<p><a class="mp-link" href="/guides/'+x.slug+'/">'+esc(x.title)+'</a></p>').join('')+'<a class="btn btn-accent" href="tel:01075100215">제작 상담하기</a></aside></div><div class="wrap">'+cta()+'</div></section>'+guideExamples(g)});
if(site.id==='company') {
 page({url:'/services/',title:'회사소개서·공사지명원 제작 서비스',description:'피피티브랜딩의 회사소개서 제작과 공사지명원 제작 서비스를 비교하고 각 서비스의 실제 포트폴리오를 확인하세요.',trail:[{name:'제작 서비스',url:'/services/'}],body:'<div class="wrap">'+crumbs([['제작 서비스']])+'</div>'+intro('전달할 내용은 다르게.\n기획의 기준은 일관되게.','회사의 사업을 소개하는 자료와 공사 역량을 설명하는 자료는 필요한 내용이 다릅니다. 목적에 맞는 서비스와 사례를 살펴보세요.','SERVICES')+'<section class="mp-section"><div class="wrap"><div class="mp-service-grid"><article class="mp-service"><span class="mp-category">COMPANY PROFILE</span><h2>회사소개서 제작</h2><p>사업 소개, 제품·서비스, 회사의 경쟁력을 전달할 때 필요한 자료입니다. 내용 정리와 목차 기획부터 브랜드에 맞는 디자인까지 진행합니다.</p><a class="btn btn-outline" href="/#services">서비스 상세 안내</a><p><a class="mp-link" href="/portfolio/">회사소개서 제작 사례 →</a></p></article><article class="mp-service"><span class="mp-category">CONSTRUCTION PROFILE</span><h2>공사지명원 제작</h2><p>공사 분야, 시공 실적, 보유 역량 등 건설 관련 사업을 소개하는 자료입니다. 회사의 업종과 제출 목적에 따라 필요한 내용을 구성합니다.</p><a class="btn btn-outline" href="https://bid.pptbranding.com/">서비스 상세 안내</a><p><a class="mp-link" href="https://bid.pptbranding.com/portfolio/">공사지명원 제작 사례 →</a></p></article></div>'+cta()+'</div></section>'});
 page({url:'/about/',title:'피피티브랜딩 브랜드 소개',description:site.description,trail:[{name:'브랜드 소개',url:'/about/'}],body:'<div class="wrap">'+crumbs([['브랜드 소개']])+'</div>'+intro('기획과 디자인,\n대표가 직접 진행합니다.',site.description,'ABOUT / PPT BRANDING')+'<section class="mp-section"><div class="wrap mp-profile"><img src="/assets/img/profile.png" alt="피피티브랜딩 대표"><div class="mp-prose"><h2>회사소개서 제작, 이야기부터 정리합니다.</h2><p>피피티브랜딩은 광고대행사 출신 기획자가 회사소개서와 공사지명원의 기획·디자인을 직접 진행하는 브랜드입니다. 사업 내용을 분석하고 목차와 메시지를 정리한 뒤 시각 디자인으로 연결합니다.</p><h2>회사소개서·공사지명원 제작 서비스</h2><p>pptbranding.com은 회사소개서 제작, bid.pptbranding.com은 공사지명원 제작을 안내합니다. 두 사이트는 피피티브랜딩의 서비스별 홈페이지이며 같은 상담 연락처를 사용합니다.</p><h2>회사소개서 제작 진행 범위</h2><ul><li>보유 자료 검토와 목차·스토리라인 기획</li><li>사업 내용과 경쟁력의 문장 정리</li><li>브랜드에 맞는 슬라이드 디자인</li><li>PPT 원본 전달과 편집 방법 안내</li></ul><h2>회사소개서 제작 공식 상담 채널</h2><p>전화 <a class="mp-link" href="tel:01075100215">010-7510-0215</a><br>이메일 <a class="mp-link" href="mailto:oknice03@gmail.com">oknice03@gmail.com</a><br>네이버 블로그 <a class="mp-link" href="https://blog.naver.com/powerpointhelper">피피티브랜딩 제작 이야기</a></p><a class="btn btn-outline" href="/services/">서비스와 사례 살펴보기</a></div></div></section>'});
}
page({url:'/404.html',title:'페이지를 찾을 수 없습니다',description:'페이지 주소를 확인하거나 포트폴리오 목록에서 원하는 사례를 찾아주세요.',exclude:true,body:intro('페이지를 찾을 수 없습니다.','주소가 바뀌었거나 없는 페이지입니다. 아래 메뉴에서 다시 찾아주세요.','404')+'<section class="mp-section"><div class="wrap"><a class="btn btn-accent" href="/">홈으로</a> <a class="btn btn-outline" href="/portfolio/">포트폴리오 보기</a></div></section>'});

let home=original.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(tag,raw)=>{const value=JSON.parse(raw);return value['@type']==='FAQPage'?'':value['@type']==='ProfessionalService'?schema([...base,faqSchema(faq,site.domain)]):tag;});
home=home.replace(/<section class="section" id="faq">[\s\S]*?<\/section>/,renderFaq(faq,esc));
home=home.replace(/<nav class="main-nav" id="mainNav">[\s\S]*?<\/nav>/,nav());
home=home.replace(/<footer class="site-footer">[\s\S]*?<\/footer>/,footer());
const featured='<section class="section" id="portfolio"><div class="wrap"><h2 class="section-eyebrow">'+site.service+' 사례</h2><h3 class="section-title">디자인과 구성을 함께 살펴보세요.</h3><p class="section-desc">업종별 실제 포트폴리오입니다. 사례를 누르면 표지와 내부 페이지, 구성 특징을 자세히 볼 수 있습니다.</p><div class="mp-grid">'+cases.slice(0,6).map(card).join('')+'</div><div class="mp-center"><a class="btn btn-outline" href="/portfolio/">전체 포트폴리오 '+cases.length+'개 보기 →</a></div></div></section>';
assert(/<section class="section(?: section-alt)?" id="portfolio">/.test(home),'홈 포트폴리오 삽입 위치 확인');
home=home.replace(/<section class="section(?: section-alt)?" id="portfolio">[\s\S]*?<\/section>/,featured);
home=home.replace(/<div class="lightbox" id="lightbox"[\s\S]*?<\/div>/,'');
home=home.replace('<script src="js/main.js"></script>','<script src="/js/pages.js" defer></script>');
home=home.replace('</head>','<meta name="robots" content="'+(noindex?'noindex,follow':'index,follow,max-image-preview:large')+'"><link rel="stylesheet" href="/css/pages.css"></head>');
home=home.replace('이렇게 해주는 곳은 이곳 뿐입니다','기획부터 디자인까지, 필요한 과정을 함께합니다');
home=home.replaceAll('http://pptbranding.com','https://pptbranding.com');
home=home.replace(/(<meta (?:property="og:image"|name="twitter:image") content=")[^"]+"/g,'$1'+absolute(cases[0].images[0].src)+'"');
home=home.replace(/(<section class="section contact-section" id="contact">)/,'<section class="section section-alt"><div class="wrap"><div class="mp-heading-row"><h2>'+site.service+' 준비 가이드</h2><a class="mp-link" href="/guides/">가이드 전체 보기 →</a></div>'+guideCards()+'</div></section>$1');
pages.unshift({url:'/',html:home.replace('</head>',noScript+'</head>'),date:updated,image:cases[0].images[0].src,exclude:false});

const llmsText=buildLlmsText(site,cases,guides);
for(const p of pages) if(!p.exclude) p.html=p.html.replace('</head>','<link rel="describedby" href="/llms.txt" type="text/plain"></head>');

// Copy only assets referenced by the final rendered pages, not superseded home galleries.
for(const p of pages) for(const match of p.html.matchAll(/(?:src|href)="(\/?assets\/img\/[^"]+)"/g)) images.add('/'+match[1].replace(/^\//,''));
for(const img of images) await access(path.join(root,img.slice(1)));
const imagePrivacy=await readJSON('content/image-privacy.json');
for(const blocked of imagePrivacy.blocked) assert(!images.has(blocked),'가림 전 이미지가 공개 대상에 포함되었습니다: '+blocked);

// Only generated dist can be cleared. Originals, PDFs, raw portfolio folders and Git stay untouched.
const info=await lstat(out).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
assert(out===path.join(root,'dist')&&out!==root,'출력 경로 확인');
if(info){assert(info.isDirectory()&&!info.isSymbolicLink(),'출력 경로가 실제 폴더여야 합니다.');await access(path.join(out,'.pptbranding-build'));await rm(out,{recursive:true});}
await mkdir(out,{recursive:true});
await writeFile(path.join(out,'.pptbranding-build'),'Generated static output only.\n');
const put=async(name,data)=>{const target=path.join(out,name);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,data);};
for(const p of pages)await put(p.url==='/'?'index.html':p.url.endsWith('/')?p.url.slice(1)+'index.html':p.url.slice(1),p.html);
for(const file of [...images].map(x=>x.slice(1)).concat(['css/style.css','css/pages.css','js/pages.js'])){
 const target=path.join(out,file);await mkdir(path.dirname(target),{recursive:true});await copyFile(path.join(root,file),target);
}
for(const name of await readdir(root))if(/^google[a-f0-9]+\.html$/.test(name)||/^naver[a-f0-9]+\.html$/.test(name))await copyFile(path.join(root,name),path.join(out,name));
await put('robots.txt',noindex?'User-agent: *\nDisallow: /\n':'User-agent: *\nAllow: /\n\nSitemap: '+site.domain+'/sitemap.xml\n');
await put('_headers','/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n'+(noindex?'  X-Robots-Tag: noindex, nofollow\n':''));
await put('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'+pages.filter(p=>!p.exclude).map(p=>'<url><loc>'+esc(absolute(p.url))+'</loc><lastmod>'+p.date+'</lastmod><image:image><image:loc>'+esc(absolute(p.image))+'</image:loc></image:image></url>').join('\n')+'\n</urlset>\n');
console.log(JSON.stringify({domain:site.domain,cases:cases.length,indexablePages:pages.filter(p=>!p.exclude).length,drafts:all.length-cases.length,noindex,output:out},null,2));
await put('llms.txt',llmsText);

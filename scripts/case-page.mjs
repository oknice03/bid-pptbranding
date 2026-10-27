// Semantic, source-backed case detail. Existing single-image cases stay supported.
import assert from 'node:assert/strict';
export function validateStory(c) {
  const indexes=c.sections.filter(s=>s.image!==undefined).map(s=>s.image);
  assert(indexes.every(i=>Number.isInteger(i)&&i>0&&i<c.images.length),c.slug+': 본문 이미지 번호 확인');
  assert.equal(new Set(indexes).size,indexes.length,c.slug+': 본문 이미지 중복');
  if(c.storyKind==='production') {
    assert(c.sources?.length&&c.facts?.length,c.slug+': 제작기 출처와 요약 정보 필요');
    assert.equal(indexes.length,c.images.length-1,c.slug+': 실제 페이지를 해당 설명과 연결하세요.');
  }
  for(const source of c.sources??[]) {
    const url=new URL(source.url);
    assert(url.protocol==='https:'&&['wp.pptbranding.com','blog.naver.com'].includes(url.hostname)&&!url.username&&!url.password,c.slug+': 출처는 공식 공개 제작기만 허용');
    assert(source.title?.trim(),c.slug+': 출처 제목 필요');
  }
  for(const f of c.facts??[])assert(f.label?.trim()&&f.value?.trim(),c.slug+': 요약 정보 확인');
  for(const img of c.images)if(img.width!==undefined||img.height!==undefined)assert(Number.isInteger(img.width)&&img.width>0&&Number.isInteger(img.height)&&img.height>0,c.slug+': 이미지 크기 확인');
}
export function renderCase(c,{site,esc,crumbs,intro,card,relatedCases}) {
 const keyword=site.service;
 const h2=text=>'<h2>'+esc(text.includes(keyword)?text:keyword+' '+text)+'</h2>';
 const figure=(img,i)=>'<figure class="mp-cover mp-page-figure"><a href="'+esc(img.src)+'" aria-label="'+esc(img.alt)+' 공개용 이미지 확대 보기"><img src="'+esc(img.src)+'" alt="'+esc(img.alt)+'" '+(img.width?'width="'+img.width+'" height="'+img.height+'" ':'')+(i?'loading="lazy"':'fetchpriority="high"')+' decoding="async"></a><figcaption>'+esc(img.caption)+' <span>이미지를 누르면 공개용 이미지를 확대해서 볼 수 있습니다.</span></figcaption></figure>';
 const selection=c.selection?.mode==='curated'?'<p class="mp-note mp-selection">'+esc(c.selection.note)+'. 전체 문서가 아닌 선별한 페이지입니다.</p>':'';
 const assigned=new Set(c.sections.map(s=>s.image).filter(i=>i!==undefined));
 const facts=c.facts?.length?'<dl class="mp-case-facts" aria-label="프로젝트 요약">'+c.facts.map(f=>'<div><dt>'+esc(f.label)+'</dt><dd>'+esc(f.value)+'</dd></div>').join('')+'</dl>':'';
 const jump=c.storyKind==='production'?'<nav class="mp-case-jump" aria-label="사례 본문 바로가기"><a href="#production-story">제작 과정과 실제 페이지 ↓</a><a href="#case-sources">공개 제작기 보기</a></nav>':'';
 const story=c.sections.map((s,i)=>'<section class="mp-story-section"'+(i===0?' id="production-story"':'')+'>'+h2(s.heading)+'<p>'+esc(s.text)+'</p>'+(s.image!==undefined?figure(c.images[s.image],s.image):'')+'</section>').join('');
 const sources=c.sources?.length?'<section class="mp-source-box" id="case-sources">'+h2('과정 참고: 공개 제작기')+'<p>피피티브랜딩이 공개한 제작기를 바탕으로 정리했습니다. 프로젝트의 제작 과정과 추가 설명은 원문에서도 확인할 수 있습니다.</p><ul>'+c.sources.map(s=>'<li><a class="mp-link" href="'+esc(s.url)+'">'+esc(s.title)+' ↗</a></li>').join('')+'</ul></section>':'';
 const note=c.storyKind==='production'?'공개 제작기에 기록된 진행 내용과 완성 페이지를 소개합니다. 완성 디자인은 피피티브랜딩의 작업이며, 문서 안의 수치·사업 실적·고객사 목록은 해당 고객 기업의 제작 당시 자료입니다. 원문의 기존 가림은 유지하며, 추가 보호가 필요한 정보는 공개용 이미지에만 최소 범위로 가립니다.':'기존 공개 포트폴리오의 구성과 디자인을 설명한 페이지입니다. 이미지에 표시된 시점·수치와 현재 기업 정보는 다를 수 있습니다.';
 return '<div class="wrap">'+crumbs([['포트폴리오','/portfolio/'],[c.title]])+'</div>'+intro(c.title+' 제작 사례',c.summary,'PORTFOLIO / '+c.category,'<div class="mp-meta"><span>'+esc(keyword)+'</span><span>'+esc(c.category)+'</span><span>'+(c.storyKind==='production'?'선별 실제 페이지 '+c.images.filter(img=>img.kind!=='mockup').length+'장 · 제작 과정 수록':'디자인 구성 사례')+'</span><span>설명 업데이트 · '+esc(c.updated)+'</span></div>')+
 '<section class="mp-section"><div class="wrap mp-case-layout"><article>'+selection+figure(c.images[0],0)+facts+jump+
 '<div class="mp-prose">'+story+c.images.slice(1).map((img,i)=>assigned.has(i+1)?'':figure(img,i+1)).join('')+
 '<section class="mp-story-section">'+h2('사례 핵심 정리')+'<ul>'+c.highlights.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></section>'+
 sources+'<p class="mp-note">'+note+'</p><section class="mp-story-section">'+h2('관련 정보와 자주 묻는 질문')+'<p>참고하고 싶은 페이지와 사용 목적을 함께 알려주세요. 같은 양식을 그대로 적용하기보다 회사의 사업 내용과 보유 자료에 맞춰 목차와 표현 방향을 정리합니다.</p><ul class="mp-related-reading"><li><a class="mp-link" href="/guides/materials/">'+esc(keyword)+' 준비 자료</a></li><li><a class="mp-link" href="/guides/outline/">'+esc(keyword)+' 목차 구성 방법</a></li><li><a class="mp-link" href="/guides/estimate/">'+esc(keyword)+' 비용·수정·납품 안내</a></li><li><a class="mp-link" href="/#faq">'+esc(keyword)+' 자주 묻는 질문</a></li></ul></section></div></article>'+
 '<aside class="mp-sidebar"><span class="mp-category">PPT BRANDING</span>'+h2('상담')+'<p>자료 정리와 목차 구성부터 함께 진행합니다. 현재 자료와 필요한 결과물의 형태를 알려주세요.</p><a class="btn btn-accent" href="tel:01075100215">전화 상담하기</a><a class="mp-link" href="/#services">'+esc(keyword)+' 서비스 보기</a><a class="mp-link" href="/portfolio/">전체 포트폴리오 보기</a></aside></div></section>'+
 '<section class="mp-section"><div class="wrap"><div class="mp-heading-row">'+h2('함께 보는 '+keyword+' 사례')+'<a class="mp-link" href="/portfolio/">전체 사례 →</a></div><div class="mp-grid">'+relatedCases.map(card).join('')+'</div></div></section>';
}

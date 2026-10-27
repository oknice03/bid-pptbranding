// Shared gallery: real final pages, cover-containing mockup and source-backed copy.
export function renderCuratedArticle(c,{site,esc}) {
 const h2=t=>'<h2>'+esc(t.includes(site.service)?t:site.service+' · '+t)+'</h2>';
 const sentences=t=>String(t).split(/(?<=[.!?])\s+|\n+/).filter(Boolean).map(s=>'<p>'+esc(s)+'</p>').join('');
 const hero=c.cardImage;
 const image=(img,label,i)=>'<figure class="pilot-page'+(img.width>img.height?' pilot-landscape':'')+'"><a class="pilot-zoom" href="'+esc(img.src)+'" data-title="'+esc(label)+'" aria-label="'+esc(label)+' 최종 페이지 확대 보기"><img src="'+esc(img.src)+'" alt="'+esc(img.alt)+'" width="'+img.width+'" height="'+img.height+'" loading="lazy" decoding="async"></a><figcaption><span>선별 '+i+' · '+esc(label)+'</span><span>눌러서 확대 ↗</span></figcaption>'+(img.caption?'<div class="pilot-disclosure">'+sentences(img.caption)+'</div>':'')+'</figure>';
 const intro=c.sections.filter(s=>s.image===undefined);
 const pages=c.sections.filter(s=>s.image!==undefined);
 const facts=(c.facts??[]).map(f=>'<div><dt>'+esc(f.label)+'</dt><dd>'+esc(f.value)+'</dd></div>').join('');
 return '<article class="pilot-story"><figure class="mp-cover pilot-hero"><img src="'+esc(hero.src)+'" alt="'+esc(hero.alt)+'" fetchpriority="high"><figcaption>'+esc(hero.generated?'실제 표지를 배치한 AI 목업입니다.':'표지를 포함한 완성 디자인 목업입니다.')+'</figcaption></figure>'+
 '<div class="pilot-overview"><p class="mp-category">SELECTED DESIGN / 선별 디자인</p>'+h2(c.storyKind==='production'?'기획과 제작 이야기':'디자인 구성')+
 intro.map(s=>sentences(s.text)).join('')+(facts?'<dl class="pilot-facts">'+facts+'</dl>':'')+
 (pages.length?'<p class="pilot-selection-note">구도와 정보 전달 방식이 돋보이는 최종 내지 '+pages.length+'장을 골랐습니다.</p><nav class="pilot-jump" aria-label="선별 페이지 바로가기">'+pages.map((s,i)=>'<a href="#sample-'+(i+1)+'">'+esc(s.heading.replace(site.service,'').replace(/^[ ·:]+/,''))+'</a>').join('')+'</nav>':'')+'</div>'+
 pages.map((s,i)=>'<section class="pilot-section" id="sample-'+(i+1)+'"><p class="mp-category">SELECTED '+String(i+1).padStart(2,'0')+'</p>'+h2(s.heading)+sentences(s.text)+image(c.images[s.image],s.heading.replace(site.service,'').replace(/^[ ·:]+/,''),i+1)+'</section>').join('')+
 '<section class="pilot-section">'+h2('디자인 핵심 정리')+'<ul class="pilot-highlights">'+c.highlights.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></section>'+
 (c.sources?.length?'<section class="pilot-section" id="case-sources">'+h2('공개 제작기')+c.sources.map(s=>'<p><a class="mp-link" href="'+esc(s.url)+'">'+esc(s.title)+' ↗</a></p>').join('')+'</section>':'')+
 '<section class="pilot-end">'+h2('관련 정보와 자주 묻는 질문')+'<p>사업 내용과 준비된 자료를 알려주세요.</p><p>필요한 원고와 디자인 범위를 함께 정리합니다.</p><a class="btn btn-accent" href="tel:01075100215">제작 상담하기</a><a class="mp-link" href="/guides/materials/">'+esc(site.service)+' 준비 자료</a><a class="mp-link" href="/guides/outline/">'+esc(site.service)+' 목차 구성</a><a class="mp-link" href="/guides/estimate/">'+esc(site.service)+' 비용·수정·납품 안내</a><a class="mp-link" href="/#faq">'+esc(site.service)+' 자주 묻는 질문</a></section>'+
 '<div class="pilot-disclosure"><p>전체 문서와 초안은 공개하지 않습니다.</p><p>수치와 기업 정보는 제작 당시 자료를 기준으로 합니다.</p><p>'+(c.storyKind==='production'?'제작 설명은 공개 제작기 또는 담당자 확인을 바탕으로 작성했습니다.':'설명은 실제 완성본의 구성과 디자인을 기준으로 작성했습니다.')+'</p></div></article>'+
 '<dialog class="pilot-lightbox" aria-labelledby="pilot-lightbox-title"><div class="pilot-lightbox-bar"><strong id="pilot-lightbox-title">최종 완성 페이지</strong><button type="button" class="pilot-close" aria-label="확대 이미지 닫기">닫기 ×</button></div><div class="pilot-lightbox-scroll"><img alt="최종 디자인 확대 이미지"></div></dialog>';
}

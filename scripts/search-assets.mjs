// Optional public summary; not an indexing, ranking or AI-citation guarantee.
const md=value=>String(value??'').replace(/\s+/g,' ').replace(/([\\[\]])/g,'\\$1').trim();
export function buildLlmsText(site,cases,guides){
 const link=(title,url,note='')=>'- ['+md(title)+']('+url+')'+(note?': '+md(note):'');
 return [
 '# 피피티브랜딩 | '+site.service,'','> '+md(site.description),'',
 '공식 홈페이지: '+site.domain+'/',
 '피피티브랜딩의 서비스별 홈페이지입니다. '+site.otherService+'은 '+site.otherDomain+'/ 에서 안내합니다.',
 '공개 페이지의 요약과 링크입니다. 제작 범위·수정·납품 조건의 최신 안내는 각 페이지를 확인할 수 있습니다.',
 '전화 010-7510-0215 · 이메일 oknice03@gmail.com','',
 '## '+site.service+' 서비스와 상담','',
 link(site.service+' 서비스',site.domain+'/#services'),
 link(site.service+' 자주 묻는 질문',site.domain+'/#faq'),
 link(site.service+' 상담',site.domain+'/#contact'),
 link('피피티브랜딩 브랜드 소개','https://pptbranding.com/about/'),'',
 '## '+site.service+' 포트폴리오','',
 link('전체 '+site.service+' 사례',site.domain+'/portfolio/'),
 ...cases.filter(c=>c.status==='ready').map(c=>link(c.title+' 제작 사례',site.domain+'/portfolio/'+c.slug+'/',c.summary)),'',
 '## '+site.service+' 준비 가이드','',
 ...guides.map(g=>link(g.title,site.domain+'/guides/'+g.slug+'/',g.summary)),'',
 '## Optional','',
 link(site.otherService+' 서비스',site.otherDomain+'/'),
 link('피피티브랜딩 공개 제작 이야기','https://blog.naver.com/powerpointhelper'),
 link('피피티브랜딩 워드프레스 제작기','https://wp.pptbranding.com/'),
 link('사이트맵',site.domain+'/sitemap.xml'),''
 ].join('\n');
}

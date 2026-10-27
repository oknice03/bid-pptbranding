import assert from 'node:assert/strict';
export function validateFaq(faq,site){
 assert(faq.heading.includes(site.service)&&faq.description?.trim()&&faq.items.length,'FAQ 제목·설명·질문 필요');
 const ids=new Set(),questions=new Set();
 for(const q of faq.items){
  assert(/^[a-z0-9-]+$/.test(q.id)&&!ids.has(q.id),'FAQ ID 중복/형식');
  assert(q.question?.trim()&&q.answer?.trim()&&!questions.has(q.question),'FAQ 질문·답변·중복 확인');
  ids.add(q.id);questions.add(q.question);
  if(q.link)assert(/^\/guides\/(materials|outline|estimate)\/$/.test(q.link.url)&&q.link.label?.trim(),'FAQ 관련 링크 확인');
 }
}
export function faqSchema(faq,domain){
 return {'@type':'FAQPage','@id':domain+'/#faq',mainEntity:faq.items.map(q=>({'@type':'Question',name:q.question,acceptedAnswer:{'@type':'Answer',text:q.answer}}))};
}
export function renderFaq(faq,esc){
 return '<section class="section" id="faq"><div class="wrap"><h2 class="section-eyebrow">'+esc(faq.heading)+'</h2><p class="section-title">'+esc(faq.description)+'</p><div class="faq-list">'+faq.items.map(q=>'<details class="faq-item" id="faq-'+q.id+'"><summary><h3>'+esc(q.question)+'</h3></summary><p class="faq-answer">'+esc(q.answer)+'</p>'+(q.link?'<p class="faq-related"><a class="mp-link" href="'+esc(q.link.url)+'">'+esc(q.link.label)+' →</a></p>':'')+'</details>').join('')+'</div></div></section>';
}

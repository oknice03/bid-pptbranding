(() => {
  const nav = document.getElementById('mainNav'), toggle = document.getElementById('navToggle');
  const close = () => {nav?.classList.remove('open');toggle?.classList.remove('open');toggle?.setAttribute('aria-expanded','false');toggle?.setAttribute('aria-label','메뉴 열기');};
  toggle?.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'메뉴 닫기':'메뉴 열기');});
  nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav?.classList.contains('open')){close();toggle?.focus();}});
  const search=document.getElementById('caseSearch'), filter=document.getElementById('caseCategory'), count=document.getElementById('caseCount');
  function update() {
    let total=0;
    document.querySelectorAll('[data-case]').forEach(card=>{
      const matches=(!search.value||card.textContent.toLowerCase().includes(search.value.toLowerCase()))&&(!filter.value||card.dataset.category===filter.value);
      card.hidden=!matches;if(matches)total++;
    });
    if(count)count.textContent=total+'개 사례';
    const empty=document.getElementById('caseEmpty');if(empty)empty.hidden=total!==0;
  }
  search?.addEventListener('input',update);filter?.addEventListener('change',update);
})();

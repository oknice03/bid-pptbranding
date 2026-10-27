(() => {
  const dialog = document.querySelector('.pilot-lightbox');
  if (!dialog?.showModal) return;
  let trigger;
  const picture = dialog.querySelector('img');
  const scroll = dialog.querySelector('.pilot-lightbox-scroll');
  scroll.tabIndex = 0;
  for (const link of document.querySelectorAll('.pilot-zoom')) {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      trigger = link;
      picture.src = link.href;
      picture.alt = link.querySelector('img').alt;
      dialog.querySelector('strong').textContent = link.dataset.title + ' · 최종 완성본';
      dialog.showModal();
      scroll.scrollTop = 0;
      document.body.style.overflow = 'hidden';
      dialog.querySelector('button').focus();
    });
  }
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {document.body.style.overflow = ''; trigger?.focus();});
})();

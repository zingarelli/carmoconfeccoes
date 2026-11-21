/* Only public, cached post data is read here. Credentials stay outside the site. */
(() => {
  const panel = document.querySelector('[data-instagram]');
  if (!panel) return;

  function instagramUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && ['instagram.com', 'www.instagram.com'].includes(url.hostname)
        && /^\/(p|reel|tv)\/[\w-]+\/?$/.test(url.pathname) ? url.href : null;
    } catch { return null; }
  }

  async function loadLatestPost() {
    try {
      const response = await fetch('data/instagram.json', { signal: AbortSignal.timeout(6000) });
      if (!response.ok) return;
      const { post } = await response.json();
      if (!post || !instagramUrl(post.url) || !/^imagens\/instagram\/latest\.(jpg|png|webp)$/.test(post.image || '')) return;

      // Preload before replacing the fallback: a missing cache image must not break the card.
      const image = new Image();
      image.src = post.image;
      await image.decode();
      const displayedImage = panel.querySelector('[data-instagram-image]');
      displayedImage.src = post.image;
      displayedImage.alt = 'Imagem da publicação mais recente de @carmo.confeccoes no Instagram';
      panel.querySelector('[data-instagram-title]').textContent = 'Acabou de chegar no Instagram';
      const caption = typeof post.caption === 'string' ? post.caption.trim() : '';
      panel.querySelector('[data-instagram-caption]').textContent = caption.length > 220
        ? `${caption.slice(0, 217)}…` : caption || 'Veja os detalhes desta novidade no Instagram da loja.';
      panel.querySelector('[data-instagram-link]').href = instagramUrl(post.url);
      panel.querySelector('[data-instagram-link-label]').textContent = 'Ver publicação';
      const date = new Date(post.timestamp);
      if (Number.isFinite(date.getTime())) {
        const time = panel.querySelector('[data-instagram-date]');
        time.dateTime = date.toISOString();
        time.textContent = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeZone: 'America/Sao_Paulo' }).format(date);
        time.hidden = false;
      }
    } catch {
      // The static profile link remains available offline, without JS, or on API/cache failure.
    }
  }
  loadLatestPost();
})();

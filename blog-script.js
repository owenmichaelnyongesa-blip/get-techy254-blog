// ============================================================
//  GET.TECHY254 BLOG — MAIN SCRIPT
//  Handles: article loading, filtering, single post, sidebar
// ============================================================

const PAGE_SIZE = 9;
let currentPage = 0;
let currentCat  = 'all';
let allArticles = [];

// ── HELPERS ───────────────────────────────────────────────
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function readTime(content) {
  const words = (content || '').replace(/<[^>]+>/g, '').split(/\s+/).length;
  return Math.max(1, Math.round(words / 200)) + ' min read';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function catLabel(cat) {
  const map = {
    'web-dev': 'Web Development', 'mpesa': 'M-Pesa Integration',
    'freelance': 'Freelancing in Kenya', 'tools': 'Tools & Resources',
    'business': 'Digital Business', 'supabase': 'Supabase',
    'tutorials': 'Tutorials'
  };
  return map[cat] || cat || 'General';
}

function getYouTubeId(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^"&?\/\s]{11})/);
  return match ? match[1] : null;
}

function buildVideoEmbed(url) {
  if (!url) return '';
  const ytId = getYouTubeId(url);
  if (ytId) {
    return `<div class="video-embed">
      <iframe src="https://www.youtube.com/embed/${ytId}" allowfullscreen loading="lazy"></iframe>
    </div>`;
  }
  // Direct video file
  return `<div class="video-embed">
    <video controls preload="metadata">
      <source src="${url}"/>
      Your browser does not support video.
    </video>
  </div>`;
}

function fallbackImg(cat) {
  const colors = {
    'web-dev': '1A5C3A', 'mpesa': 'C4720A', 'freelance': '2D6A4F',
    'tools': '5B3427', 'business': '8B4513', 'supabase': '2C3E50',
  };
  const col = colors[cat] || '1A5C3A';
  const label = catLabel(cat).replace(/&/g,'%26');
  return `https://placehold.co/800x500/${col}/FDFBF6?text=${encodeURIComponent(label)}&font=playfair-display`;
}

// ── RENDER FEATURED ────────────────────────────────────────
function renderFeatured(article) {
  const el = document.getElementById('featuredArticle');
  if (!el || !article) return;
  const img = article.cover_image || fallbackImg(article.category);
  const hasVideo = !!article.video_url;
  el.innerHTML = `
    <div class="featured-image-wrap" onclick="openArticle('${article.slug}')">
      <img src="${img}" alt="${article.title}" loading="eager"
           onerror="this.src='${fallbackImg(article.category)}'"/>
      <div class="featured-cat-badge">${catLabel(article.category)}</div>
      ${hasVideo ? `<div class="media-badge">&#x25B6; VIDEO</div>` : ''}
    </div>
    <div class="featured-content">
      <div>
        <div class="featured-label">// Featured Article</div>
        <div class="featured-title" onclick="openArticle('${article.slug}')">${article.title}</div>
        <div class="featured-excerpt">${article.excerpt || ''}</div>
        <div class="article-meta">
          <span class="meta-author">Nyongesa Michael Owen</span>
          <span class="meta-dot">&middot;</span>
          <span class="meta-date">${formatDateShort(article.published_at)}</span>
          <span class="meta-dot">&middot;</span>
          <span class="meta-read">&#x23F1; ${readTime(article.content)}</span>
        </div>
      </div>
      <a href="blog-post.html?slug=${article.slug}" class="read-more">
        Read Full Article &#x2192;
      </a>
    </div>`;
}

// ── RENDER ARTICLE CARD ────────────────────────────────────
function renderCard(article) {
  const img = article.cover_image || fallbackImg(article.category);
  const hasVideo = !!article.video_url;
  return `
    <div class="article-card reveal" onclick="openArticle('${article.slug}')">
      <div class="article-card-img">
        <img src="${img}" alt="${article.title}" loading="lazy"
             onerror="this.src='${fallbackImg(article.category)}'"/>
        ${hasVideo ? `<div class="media-badge">&#x25B6; VIDEO</div>` : ''}
      </div>
      <div class="article-card-cat">${catLabel(article.category)}</div>
      <div class="article-card-title">${article.title}</div>
      <div class="article-card-excerpt">${(article.excerpt || '').slice(0, 120)}${(article.excerpt||'').length > 120 ? '...' : ''}</div>
      <div class="article-card-meta">
        <span>${formatDateShort(article.published_at)}</span>
        <span class="meta-dot">&middot;</span>
        <span>${readTime(article.content)}</span>
        ${article.tags ? `<span class="tag">${article.tags.split(',')[0].trim()}</span>` : ''}
      </div>
    </div>`;
}

// ── LOAD ARTICLES FROM SUPABASE ────────────────────────────
async function loadArticles(cat = 'all', reset = false) {
  if (reset) { currentPage = 0; currentCat = cat; }

  let query = supabaseClient
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (cat !== 'all') query = query.eq('category', cat);

  const from = currentPage * PAGE_SIZE;
  query = query.range(from, from + PAGE_SIZE - 1);

  const { data, error } = await query;
  if (error) { console.error(error); return; }

  const grid = document.getElementById('articlesGrid');

  if (reset || currentPage === 0) {
    grid.innerHTML = '';
    // First article is featured
    if (data && data.length > 0 && currentPage === 0 && cat === 'all') {
      renderFeatured(data[0]);
      data.shift();
    }
  }

  if (!data || data.length === 0) {
    if (currentPage === 0) grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--muted);font-style:italic">No articles found. Check back soon!</div>`;
    document.getElementById('loadMoreBtn').style.display = 'none';
    return;
  }

  grid.innerHTML += data.map(renderCard).join('');
  currentPage++;

  // Hide load more if fewer than page size returned
  const btn = document.getElementById('loadMoreBtn');
  if (btn) btn.style.display = data.length < PAGE_SIZE ? 'none' : 'block';

  // Animate new cards
  document.querySelectorAll('.reveal:not(.visible)').forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), i * 80);
    revealObs.observe(el);
  });

  // Load sidebar popular posts once
  if (currentPage === 1) loadSidebar();
}

// ── SIDEBAR ────────────────────────────────────────────────
async function loadSidebar() {
  const { data } = await supabaseClient
    .from('blog_posts')
    .select('id, title, slug, cover_image, category, published_at')
    .eq('status', 'published')
    .order('views', { ascending: false })
    .limit(4);

  if (!data) return;

  const el = document.getElementById('popularPosts');
  if (!el) return;
  el.innerHTML = data.map(a => `
    <div class="sidebar-post" onclick="openArticle('${a.slug}')">
      <img class="sidebar-post-img" src="${a.cover_image || fallbackImg(a.category)}"
           alt="${a.title}" loading="lazy"
           onerror="this.src='${fallbackImg(a.category)}'"/>
      <div>
        <div class="sidebar-post-title">${a.title}</div>
        <div class="sidebar-post-date">${formatDateShort(a.published_at)}</div>
      </div>
    </div>`).join('');
}

// ── SINGLE POST ────────────────────────────────────────────
async function loadPost(slug) {
  const { data: article, error } = await supabaseClient
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !article) {
    document.getElementById('articleTitle').textContent = 'Article not found.';
    return;
  }

  // Update meta
  document.title = `${article.title} — Get.Techy254 Blog`;
  document.getElementById('pageDesc')?.setAttribute('content', article.excerpt || '');

  // Hero
  document.getElementById('articleCat').textContent = catLabel(article.category);
  document.getElementById('articleTitle').textContent = article.title;
  document.getElementById('articleExcerpt').textContent = article.excerpt || '';
  document.getElementById('articleDate').textContent = formatDate(article.published_at);

  const coverImg = document.getElementById('articleCoverImg');
  if (coverImg) {
    coverImg.src = article.cover_image || fallbackImg(article.category);
    coverImg.onerror = () => coverImg.src = fallbackImg(article.category);
    coverImg.alt = article.title;
  }

  // Sidebar meta
  const rtEl = document.getElementById('readTime');
  if (rtEl) rtEl.textContent = readTime(article.content);
  const scEl = document.getElementById('sidebarCat');
  if (scEl) scEl.textContent = catLabel(article.category);
  const sdEl = document.getElementById('sidebarDate');
  if (sdEl) sdEl.textContent = formatDateShort(article.published_at);

  // Tags
  const tagsEl = document.getElementById('articleTags');
  if (tagsEl && article.tags) {
    tagsEl.innerHTML = article.tags.split(',').map(t =>
      `<span class="tag-pill" style="font-size:0.6rem">${t.trim()}</span>`).join('');
  }

  // Build article body — content + optional video
  const bodyEl = document.getElementById('articleBody');
  if (bodyEl) {
    let html = '';

    // Video at top if exists and position is 'top'
    if (article.video_url && article.video_position !== 'bottom') {
      html += buildVideoEmbed(article.video_url);
      if (article.video_caption) {
        html += `<p class="video-caption">${article.video_caption}</p>`;
      }
    }

    // Main content
    html += article.content || '';

    // Video at bottom if position is 'bottom'
    if (article.video_url && article.video_position === 'bottom') {
      html += buildVideoEmbed(article.video_url);
      if (article.video_caption) {
        html += `<p class="video-caption">${article.video_caption}</p>`;
      }
    }

    // Share bar
    const shareUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent(article.title + ' — Get.Techy254 Blog');
    html += `
      <div class="share-bar">
        <span class="share-label">Share this article</span>
        <button class="share-btn" onclick="navigator.clipboard.writeText(window.location.href).then(()=>this.textContent='Copied! ✓')">Copy Link</button>
        <a class="share-btn" href="https://wa.me/?text=${shareText}%20${shareUrl}" target="_blank">WhatsApp</a>
        <a class="share-btn" href="https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}" target="_blank">X / Twitter</a>
        <a class="share-btn" href="https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}" target="_blank">LinkedIn</a>
      </div>`;

    bodyEl.innerHTML = html;

    // Build table of contents from h2 tags
    buildTOC();

    // Highlight code blocks
    document.querySelectorAll('pre code').forEach(block => {
      block.innerHTML = block.innerHTML
        .replace(/(\/\/.+)/g, '<span style="color:#6A9955">$1</span>')
        .replace(/(".*?")/g, '<span style="color:#CE9178">$1</span>')
        .replace(/\b(const|let|var|function|return|if|else|await|async|import|export|from|class|new|this)\b/g, '<span style="color:#569CD6">$1</span>');
    });
  }

  // Increment view count
  supabaseClient.from('blog_posts').update({ views: (article.views || 0) + 1 }).eq('id', article.id).then(() => {});

  // Load related articles
  loadRelated(article.category, article.id);
}

// ── TABLE OF CONTENTS ──────────────────────────────────────
function buildTOC() {
  const headings = document.querySelectorAll('.article-body h2');
  const tocWidget = document.getElementById('tocWidget');
  const tocList   = document.getElementById('tocList');
  if (!tocWidget || !tocList || headings.length < 2) return;

  tocWidget.style.display = 'block';
  headings.forEach((h, i) => {
    const id = `heading-${i}`;
    h.id = id;
    const li = document.createElement('li');
    li.innerHTML = `<a href="#${id}" style="font-size:0.78rem;color:var(--muted);text-decoration:none;display:block;padding:0.2rem 0;border-left:2px solid var(--rule);padding-left:0.6rem;transition:all 0.2s" onmouseover="this.style.borderColor='var(--green)';this.style.color='var(--green)'" onmouseout="this.style.borderColor='var(--rule)';this.style.color='var(--muted)'">${h.textContent}</a>`;
    tocList.appendChild(li);
  });
}

// ── RELATED ARTICLES ───────────────────────────────────────
async function loadRelated(category, excludeId) {
  const { data } = await supabaseClient
    .from('blog_posts')
    .select('id, title, slug, cover_image, category, excerpt, published_at, content')
    .eq('status', 'published')
    .eq('category', category)
    .neq('id', excludeId)
    .limit(3);

  const grid = document.getElementById('relatedGrid');
  if (!grid) return;
  if (!data || data.length === 0) {
    grid.closest('div').style.display = 'none'; return;
  }
  grid.innerHTML = data.map(renderCard).join('');
  grid.querySelectorAll('.reveal').forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), i * 100);
  });
}

// ── NAVIGATION ────────────────────────────────────────────
function openArticle(slug) {
  window.location.href = `blog-post.html?slug=${slug}`;
}

// ── SCROLL REVEAL ──────────────────────────────────────────
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 80);
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// ── BACK TO TOP ────────────────────────────────────────────
const bttBtn = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
  if (bttBtn) bttBtn.classList.toggle('visible', window.scrollY > 600);
});
if (bttBtn) bttBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ── MOBILE NAV ─────────────────────────────────────────────
document.getElementById('menuBtn')?.addEventListener('click', () =>
  document.getElementById('mobNav').classList.add('open'));
document.getElementById('mobClose')?.addEventListener('click', () =>
  document.getElementById('mobNav').classList.remove('open'));

// ── SEARCH ────────────────────────────────────────────────
document.getElementById('searchBtn')?.addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('searchBar').classList.add('open');
  document.getElementById('searchInput').focus();
});
document.getElementById('searchClose')?.addEventListener('click', () =>
  document.getElementById('searchBar').classList.remove('open'));

document.getElementById('searchInput')?.addEventListener('keydown', async (e) => {
  if (e.key !== 'Enter') return;
  const q = e.target.value.trim();
  if (!q) return;
  document.getElementById('searchBar').classList.remove('open');
  window.location.href = `index.html?search=${encodeURIComponent(q)}`;
});

// ── CATEGORY FILTER ────────────────────────────────────────
document.querySelectorAll('.cat-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadArticles(btn.dataset.cat, true);
  });
});

// ── LOAD MORE ─────────────────────────────────────────────
document.getElementById('loadMoreBtn')?.addEventListener('click', () =>
  loadArticles(currentCat));

// ── TAG CLOUD ─────────────────────────────────────────────
document.querySelectorAll('.tag-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    window.location.href = `index.html?tag=${pill.dataset.tag}`;
  });
});

// ── NEWSLETTER ────────────────────────────────────────────
async function subscribeNewsletter() {
  const email = document.getElementById('nlEmail')?.value.trim();
  if (!email) return;
  await supabaseClient.from('blog_subscribers').insert([{ email }]);
  document.getElementById('nlMsg').style.display = 'block';
  document.getElementById('nlEmail').value = '';
}
async function subscribeNewsletter2() {
  const email = document.getElementById('nlEmail2')?.value.trim();
  if (!email) return;
  await supabaseClient.from('blog_subscribers').insert([{ email }]);
  document.getElementById('nlMsg2').style.display = 'block';
  document.getElementById('nlEmail2').value = '';
}

// ── INIT ──────────────────────────────────────────────────
const params = new URLSearchParams(window.location.search);
const slug   = params.get('slug');
const cat    = params.get('cat') || 'all';
const search = params.get('search');

if (slug) {
  // Single post page
  loadPost(slug);
} else {
  // Blog homepage
  if (cat !== 'all') {
    document.querySelectorAll('.cat-btn').forEach(b => {
      if (b.dataset.cat === cat) b.classList.add('active');
      else b.classList.remove('active');
    });
  }
  loadArticles(cat, true);
}

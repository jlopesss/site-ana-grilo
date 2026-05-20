#!/usr/bin/env node
// Converte arquivos markdown de blog/_posts/ em páginas HTML completas.
// Uso: node scripts/build-post.js [--force]

import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'blog', '_posts');
const BLOG_DIR  = path.join(ROOT, 'blog');
const BLOG_INDEX = path.join(BLOG_DIR, 'index.html');
const FORCE     = process.argv.includes('--force');

const MONTHS = ['jan.','fev.','mar.','abr.','mai.','jun.','jul.','ago.','set.','out.','nov.','dez.'];

const SERVICE_LABELS = {
  'voz-clinica':             'Voz Clínica — quando procurar uma fonoaudióloga',
  'voz-artistica':           'Voz Artística — desenvolva sua expressão vocal',
  'harmonizacao-vocal-trans':'Harmonização Vocal Trans — sua voz, sua identidade',
  'oratoria-comunicacao':    'Oratória e Comunicação — fale com mais presença',
  'motricidade-orofacial':   'Motricidade Orofacial — função e estética oral',
  'move-voz-empresarial':    'Move Voz Empresarial — comunicação corporativa',
};

// ── SVGs das artes decorativas do post ────────────────────────────────────────

const FROND_SVG = `<svg viewBox="0 0 180 520" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M 90 512 C 85 448 72 378 78 310 C 84 244 106 204 102 148 C 98 96 80 56 84 12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M 82 425 C 58 410 34 390 18 362 C 46 358 68 386 82 425 Z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round" opacity="0.85"/>
  <path d="M 84 423 C 108 408 132 388 148 360 C 122 358 104 388 84 423 Z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round" opacity="0.85"/>
  <path d="M 82 425 C 58 408 36 388 18 362" stroke="currentColor" stroke-width="0.65" opacity="0.4" stroke-linecap="round"/>
  <path d="M 84 423 C 108 408 130 390 148 360" stroke="currentColor" stroke-width="0.65" opacity="0.4" stroke-linecap="round"/>
  <path d="M 80 338 C 57 322 36 302 22 278 C 48 274 66 300 80 338 Z" stroke="currentColor" stroke-width="1" stroke-linejoin="round" opacity="0.75"/>
  <path d="M 82 336 C 105 320 124 298 138 274 C 114 272 98 302 82 336 Z" stroke="currentColor" stroke-width="1" stroke-linejoin="round" opacity="0.75"/>
  <path d="M 80 338 C 56 320 38 300 22 278" stroke="currentColor" stroke-width="0.6" opacity="0.35" stroke-linecap="round"/>
  <path d="M 82 336 C 104 320 122 300 138 274" stroke="currentColor" stroke-width="0.6" opacity="0.35" stroke-linecap="round"/>
  <path d="M 80 252 C 62 238 44 222 32 204 C 50 200 68 218 80 252 Z" stroke="currentColor" stroke-width="0.9" stroke-linejoin="round" opacity="0.65"/>
  <path d="M 82 250 C 100 236 118 218 130 200 C 112 198 96 218 82 250 Z" stroke="currentColor" stroke-width="0.9" stroke-linejoin="round" opacity="0.65"/>
  <path d="M 80 172 C 65 158 50 144 40 128 C 56 124 70 140 80 172 Z" stroke="currentColor" stroke-width="0.8" stroke-linejoin="round" opacity="0.55"/>
  <path d="M 82 170 C 97 156 110 142 118 126 C 106 124 96 142 82 170 Z" stroke="currentColor" stroke-width="0.8" stroke-linejoin="round" opacity="0.55"/>
  <path d="M 82 88 C 74 74 70 56 74 40 C 82 50 86 66 82 88 Z" stroke="currentColor" stroke-width="0.7" stroke-linejoin="round" opacity="0.45"/>
  <path d="M 84 86 C 92 72 96 54 92 38 C 84 48 84 66 84 86 Z" stroke="currentColor" stroke-width="0.7" stroke-linejoin="round" opacity="0.45"/>
  <circle cx="90" cy="512" r="4.5" stroke="currentColor" stroke-width="1" opacity="0.5"/>
  <circle cx="84" cy="12" r="2.5" stroke="currentColor" stroke-width="0.8" opacity="0.45"/>
</svg>`;

const WAVE_SVG = `<svg viewBox="0 0 160 480" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M 80 8 C 112 32 132 64 120 96 C 108 128 48 156 40 188 C 32 220 72 252 80 268 C 88 284 128 316 120 348 C 112 380 48 408 40 440 C 36 460 56 472 80 472" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" opacity="0.8"/>
  <path d="M 80 8 C 48 32 28 64 40 96 C 52 128 112 156 120 188 C 128 220 88 252 80 268 C 72 284 32 316 40 348 C 48 380 112 408 120 440 C 124 460 104 472 80 472" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" opacity="0.8"/>
  <path d="M 80 8 C 100 30 112 60 104 90 C 96 120 62 148 58 178 C 54 208 78 240 80 256 C 82 272 106 304 100 334 C 94 364 62 392 58 422 C 55 444 66 462 80 472" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" opacity="0.4"/>
  <path d="M 80 8 C 60 30 48 60 56 90 C 64 120 98 148 102 178 C 106 208 82 240 80 256 C 78 272 54 304 60 334 C 66 364 98 392 102 422 C 105 444 94 462 80 472" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" opacity="0.4"/>
  <line x1="80" y1="8" x2="80" y2="472" stroke="currentColor" stroke-width="0.6" stroke-dasharray="3 8" opacity="0.25"/>
  <circle cx="122" cy="96"  r="3" stroke="currentColor" stroke-width="0.9" opacity="0.6"/>
  <circle cx="38"  cy="188" r="3" stroke="currentColor" stroke-width="0.9" opacity="0.6"/>
  <circle cx="80"  cy="268" r="3" stroke="currentColor" stroke-width="0.9" opacity="0.6"/>
  <circle cx="122" cy="348" r="3" stroke="currentColor" stroke-width="0.9" opacity="0.6"/>
  <circle cx="38"  cy="440" r="3" stroke="currentColor" stroke-width="0.9" opacity="0.6"/>
  <circle cx="38"  cy="96"  r="3" stroke="currentColor" stroke-width="0.9" opacity="0.4"/>
  <circle cx="122" cy="188" r="3" stroke="currentColor" stroke-width="0.9" opacity="0.4"/>
  <circle cx="38"  cy="348" r="3" stroke="currentColor" stroke-width="0.9" opacity="0.4"/>
  <circle cx="122" cy="440" r="3" stroke="currentColor" stroke-width="0.9" opacity="0.4"/>
  <circle cx="80" cy="8"   r="4" stroke="currentColor" stroke-width="1" opacity="0.6"/>
  <circle cx="80" cy="472" r="4" stroke="currentColor" stroke-width="1" opacity="0.6"/>
</svg>`;

function artBlock() {
  const cls = (svg, c) => svg.replace('<svg ', `<svg class="${c}" `);
  return `    <div class="post-art" aria-hidden="true">
      ${cls(FROND_SVG, 'post-art__l1')}
      ${cls(WAVE_SVG,  'post-art__r1')}
      ${cls(FROND_SVG, 'post-art__l2')}
      ${cls(WAVE_SVG,  'post-art__r2')}
      ${cls(FROND_SVG, 'post-art__l3')}
    </div>`;
}

function isoDate(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function formatDate(d) {
  const dt = new Date(d);
  return `${dt.getUTCDate()} ${MONTHS[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
}

function slugFromFilename(f) {
  return f.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
}

function estimateReadingTime(markdown) {
  const words = markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

function ctaBlock(texto, title) {
  const msg = encodeURIComponent(`Olá, li o artigo "${title}" e gostaria de agendar uma avaliação.`);
  const wa  = `https://wa.me/5521968270262?text=${msg}`;
  return `<div class="post-cta-inline">
        <p>${texto}</p>
        <a href="${wa}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">
          Falar com Ana Grilo pelo WhatsApp
        </a>
      </div>`;
}

function injectCta(html, ctaTexto, title) {
  if (!ctaTexto) return html;
  const MARKER = '<p>---cta---</p>';
  if (html.includes(MARKER)) {
    return html.replace(MARKER, ctaBlock(ctaTexto, title));
  }
  // Sem marcador: injeta no antepenúltimo parágrafo
  const total = (html.match(/<\/p>/g) || []).length;
  const target = Math.max(1, total - 2);
  let count = 0;
  return html.replace(/<\/p>/g, match => {
    count++;
    return count === target ? `</p>\n      ${ctaBlock(ctaTexto, title)}` : match;
  });
}

// ── Componentes de HTML ────────────────────────────────────────────────────────

function header() {
  return `  <header class="navbar" id="navbar" role="banner">
    <div class="container navbar__inner">
      <a href="/" class="navbar__logo" aria-label="Página inicial — Ana Grilo">
        <span class="navbar__logo-name"><em>Ana</em> Grilo</span>
        <span class="navbar__logo-sub">Fonoaudióloga</span>
      </a>

      <nav class="navbar__nav" id="nav-menu" role="navigation" aria-label="Menu principal">
        <a href="/#servicos">Serviços</a>
        <a href="/#faq">FAQ</a>
        <a href="/#sobre">Sobre</a>
        <a href="/#contato">Contato</a>
        <a href="/blog/">Blog</a>
      </nav>

      <div class="navbar__actions">
        <button class="theme-toggle" id="theme-toggle" aria-label="Alternar modo claro/escuro" title="Alternar tema">
          <svg class="icon-sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          <svg class="icon-moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>

        <a href="https://wa.me/5521968270262?text=Olá%2C%20estou%20vindo%20do%20seu%20site%20e%20gostaria%20de%20agendar%20uma%20consulta." class="btn btn-primary" target="_blank" rel="noopener noreferrer" aria-label="Agendar pelo WhatsApp">
          Agendar consulta
        </a>

        <button class="hamburger" id="hamburger" aria-label="Abrir menu" aria-expanded="false" aria-controls="nav-menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>`;
}

function footer() {
  return `  <footer role="contentinfo">
    <div class="container">
      <div class="footer__inner">
        <p class="footer__copy">
          &copy; <span id="footer-year"></span> Fonoaudióloga Ana Grilo . Todos os direitos reservados.
        </p>
        <nav class="footer__links" aria-label="Links do rodapé">
          <a href="/#servicos">Serviços</a>
          <a href="/#faq">FAQ</a>
          <a href="/#sobre">Sobre</a>
          <a href="/#contato">Contato</a>
          <a href="/blog/">Blog</a>
        </nav>
      </div>
      <p class="footer__credit">
        <a href="https://www.instagram.com/tattoo.jhonatan" target="_blank" rel="noopener noreferrer">Designed by Jhonatan Lopes</a>
      </p>
    </div>
  </footer>`;
}

function buildRelatedSection(frontmatter, currentSlug, allPosts) {
  const cards = [];

  // 1. Serviços relacionados (todos que foram indicados)
  if (frontmatter.servicos_relacionados?.length) {
    for (const s of frontmatter.servicos_relacionados) {
      const slug = typeof s === 'string' ? s : s.servico || s;
      const label = SERVICE_LABELS[slug] || slug;
      cards.push(`          <a href="/${slug}/" class="post-related__card">
            <span class="post-related__tag">Serviço</span>
            <p class="post-related__heading">${label}</p>
            <span class="post-related__date">Ver serviço &rarr;</span>
          </a>`);
    }
  }

  // 2. Posts similares para completar até 6 cards
  if (cards.length < 6) {
    const currentCategory = frontmatter.category || '';
    const currentTags     = frontmatter.tags || [];

    const scored = allPosts
      .filter(p => p.slug !== currentSlug)
      .map(p => {
        let score = 0;
        if (currentCategory && p.frontmatter.category === currentCategory) score += 10;
        score += (currentTags.filter(t => (p.frontmatter.tags || []).includes(t))).length * 3;
        return { post: p, score };
      })
      .sort((a, b) => b.score - a.score); // empate mantém ordem de allPosts (data desc)

    for (const { post } of scored.slice(0, 6 - cards.length)) {
      const iso     = isoDate(post.frontmatter.date);
      const display = formatDate(post.frontmatter.date);
      cards.push(`          <a href="/blog/${post.slug}/" class="post-related__card">
            <span class="post-related__tag">${post.frontmatter.category || 'Blog'}</span>
            <p class="post-related__heading">${post.frontmatter.title}</p>
            <span class="post-related__date"><time datetime="${iso}">${display}</time></span>
          </a>`);
    }
  }

  if (!cards.length) return '';

  return `
    <section class="post-related">
      <div class="container">
        <h2 class="post-related__title">Veja também</h2>
        <div class="post-related__grid">
${cards.join('\n')}
        </div>
      </div>
    </section>`;
}

function buildPostHTML(slug, frontmatter, markdown, htmlBody, allPosts) {
  const iso         = isoDate(frontmatter.date);
  const displayDate = formatDate(frontmatter.date);
  const readingTime = frontmatter.reading_time || estimateReadingTime(markdown);
  const category    = frontmatter.category || '';
  const title       = frontmatter.title || '';
  const description = frontmatter.description || '';
  const breadcrumb  = title.length > 40 ? title.slice(0, 40) + '…' : title;
  const ogImage     = frontmatter.image
    ? `https://www.anagrilovoz.com${frontmatter.image}`
    : 'https://www.anagrilovoz.com/img/og-image.jpg';
  const ogImageAlt  = frontmatter.image ? title : 'Ana Grilo, fonoaudióloga especializada em voz e comunicação';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="${description}" />${frontmatter.tags?.length ? `\n  <meta name="keywords" content="${frontmatter.tags.join(', ')}" />` : ''}
  <meta name="robots" content="index, follow" />
  <meta name="geo.region" content="BR-RJ" />
  <meta name="geo.placename" content="Niterói, Rio de Janeiro" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${title} | Ana Grilo Fonoaudióloga" />
  <meta property="og:description" content="${description}" />
  <meta property="og:locale" content="pt_BR" />
  <meta property="og:url" content="https://anagrilovoz.com/blog/${slug}/" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${ogImageAlt}" />
  <meta property="article:published_time" content="${iso}" />
  <meta property="article:author" content="Ana Grilo" />
  <link rel="canonical" href="https://anagrilovoz.com/blog/${slug}/" />
  <meta name="theme-color" content="#4A8C65" />
  <link rel="icon" href="../../img/favicon/favicon.svg" type="image/svg+xml" />
  <link rel="icon" href="../../img/favicon/favicon.ico" sizes="32x32" />
  <link rel="icon" href="../../img/favicon/favicon-32.png" type="image/png" sizes="32x32" />
  <link rel="apple-touch-icon" href="../../img/favicon/favicon-180.png" />
  <link rel="manifest" href="../../img/favicon/site.webmanifest" />
  <title>${title} | Ana Grilo</title>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "${title}",
    "description": "${description}",
    "url": "https://anagrilovoz.com/blog/${slug}/",
    "datePublished": "${iso}",
    "dateModified": "${iso}",
    "author": {
      "@type": "Person",
      "name": "Ana Grilo",
      "jobTitle": "Fonoaudióloga",
      "url": "https://anagrilovoz.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Ana Grilo Fonoaudióloga",
      "url": "https://anagrilovoz.com",
      "logo": { "@type": "ImageObject", "url": "https://anagrilovoz.com/img/og-image.jpg" }
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": "https://anagrilovoz.com/blog/${slug}/" }
  }
  </script>

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Outfit:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,700;0,800;0,900;1,400;1,500;1,700;1,900&family=Fuggles&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../../css/style.css" />

  <style>
    body { display: flex; flex-direction: column; min-height: 100vh; }
    main { flex: 1; }

    .post-header {
      padding: 6rem 0 3rem;
      text-align: center;
      position: relative;
    }
    .post-breadcrumb {
      display: flex; justify-content: center; gap: 0.4rem;
      font-size: 0.8rem; opacity: 0.55; margin-bottom: 1.5rem; flex-wrap: wrap;
    }
    .post-breadcrumb a { color: inherit; text-decoration: none; }
    .post-breadcrumb a:hover { color: var(--color-primary, #4A8C65); }
    .post-breadcrumb__sep { opacity: 0.4; }

    .post-tag {
      display: inline-block; font-size: 0.7rem; font-weight: 700;
      letter-spacing: 0.1em; text-transform: uppercase;
      color: var(--color-primary, #4A8C65);
      background: color-mix(in srgb, var(--color-primary, #4A8C65) 12%, transparent);
      padding: 0.25rem 0.65rem; border-radius: 100px; margin-bottom: 1.25rem;
      text-decoration: none; transition: background 0.18s, color 0.18s;
    }
    .post-tag:hover { background: var(--color-primary, #4A8C65); color: #fff; }
    .post-title {
      font-size: clamp(1.8rem, 5vw, 2.8rem); font-weight: 700; line-height: 1.2;
      max-width: 760px; margin: 0 auto 1.25rem; color: var(--color-heading, inherit);
    }
    .post-meta {
      display: flex; justify-content: center; align-items: center;
      gap: 0.75rem; font-size: 0.85rem; opacity: 0.55; flex-wrap: wrap;
    }
    .post-meta__dot { width: 3px; height: 3px; border-radius: 50%; background: currentColor; }

    .post-body {
      max-width: 800px; margin: 0 auto; padding: 2.5rem 0 4rem;
      --container-pad: clamp(0.75rem, 2.5vw, 1.5rem);
    }
    .post-hero-img {
      margin: 2rem auto 0;
      max-width: 860px;
      border-radius: 12px;
      overflow: hidden;
      line-height: 0;
    }
    .post-hero-img img {
      width: 100%;
      height: auto;
      display: block;
    }

    .post-body p  { font-size: 1.05rem; line-height: 1.8; margin-bottom: 1.4rem; color: var(--color-text, inherit); }
    .post-body h2 { font-size: 1.4rem; font-weight: 700; margin: 2.5rem 0 0.85rem; color: var(--color-heading, inherit); line-height: 1.25; }
    .post-body h3 { font-size: 1.1rem; font-weight: 600; margin: 1.75rem 0 0.6rem; color: var(--color-heading, inherit); }
    .post-body ul, .post-body ol { margin: 0 0 1.4rem 1.5rem; }
    .post-body li { font-size: 1.05rem; line-height: 1.75; margin-bottom: 0.4rem; }
    .post-body strong { font-weight: 700; }
    .post-body em     { font-style: italic; }
    .post-body blockquote {
      border-left: 3px solid var(--color-primary, #4A8C65); margin: 2rem 0;
      padding: 1rem 1.5rem;
      background: color-mix(in srgb, var(--color-primary, #4A8C65) 6%, transparent);
      border-radius: 0 8px 8px 0; font-size: 1.05rem; font-style: italic; line-height: 1.7;
    }
    .post-body hr { border: none; border-top: 1px solid var(--color-border, rgba(0,0,0,0.1)); margin: 3rem 0; }

    .post-cta-inline {
      text-align: center; margin: 2.5rem 0;
      padding: 2rem 1.5rem;
      background: color-mix(in srgb, var(--color-primary, #4A8C65) 7%, transparent);
      border-radius: 12px;
    }
    .post-cta-inline p { margin-bottom: 1.25rem; font-size: 1.05rem; font-style: italic; }
    .post-cta-inline .btn { display: inline-block; }

    .post-author {
      display: flex; align-items: center; gap: 1.25rem;
      border-top: 1px solid var(--color-border, rgba(0,0,0,0.1));
      padding-top: 2rem; margin-top: 3rem;
    }
    .post-author__avatar {
      width: 140px; height: 140px; border-radius: 12px; flex-shrink: 0; overflow: hidden;
      border: 2px solid color-mix(in srgb, var(--color-primary, #4A8C65) 25%, transparent);
    }
    .post-author__avatar img { width: 100%; height: 100%; object-fit: cover; object-position: center top; }
    .post-body .post-author__name { font-weight: 700; font-size: 1.1rem; margin-bottom: 0; }
    .post-body .post-author__bio  { font-size: 0.95rem; opacity: 0.65; line-height: 1.6; margin: 0; }

    .post-related { padding: 3rem 0 clamp(4rem, 8vw, 8rem); border-top: 1px solid var(--color-border, rgba(0,0,0,0.08)); }
    .post-related__title { font-size: 1.2rem; font-weight: 700; margin-bottom: 1.5rem; text-align: center; }
    .post-related__grid  { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem; }
    .post-related__card  {
      border: 1px solid var(--color-border, rgba(0,0,0,0.08)); border-radius: 12px;
      padding: 1.25rem; background: var(--color-surface, #fff);
      text-decoration: none; color: inherit; display: block;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .post-related__card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(74,140,101,0.1); }
    .post-related__tag     { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: var(--color-primary, #4A8C65); margin-bottom: 0.5rem; display: block; }
    .post-related__heading { font-size: 0.95rem; font-weight: 600; line-height: 1.35; margin-bottom: 0.4rem; }
    .post-related__date    { font-size: 0.78rem; opacity: 0.5; }

    @media (max-width: 720px) {
      .post-body   { padding-left: 1rem; padding-right: 1rem; }
      .post-header { padding: 5rem 1rem 2rem; }
      .post-author { flex-direction: column; text-align: center; }
    }

    /* ── Artes orgânicas decorativas ─────────────────────────── */
    article.post-article { position: relative; }
    .post-art {
      position: absolute; inset: 0;
      pointer-events: none;
      color: var(--color-primary, #4A8C65);
      opacity: 0.45;
    }
    .post-art svg { position: absolute; width: auto; height: clamp(440px, 56vh, 880px); }
    .post-art__l1 { left:  2%; top:  2%; }
    .post-art__r1 { right: 2%; top: 18%; }
    .post-art__l2 { left:  2%; top: 36%; }
    .post-art__r2 { right: 2%; top: 55%; }
    .post-art__l3 { left:  2%; top: 73%; }
    @media (max-width: 1100px) { .post-art { display: none; } }
  </style>

  <script async src="https://www.googletagmanager.com/gtag/js?id=G-MZKM69FL6J"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-MZKM69FL6J');
  </script>
</head>
<body>

${header()}

  <main>
    <article class="post-article" itemscope itemtype="https://schema.org/BlogPosting">
${artBlock()}

      <header class="post-header">
        <div class="container">
          <nav class="post-breadcrumb" aria-label="Breadcrumb">
            <a href="/">Início</a>
            <span class="post-breadcrumb__sep" aria-hidden="true">/</span>
            <a href="/blog/">Blog</a>
            <span class="post-breadcrumb__sep" aria-hidden="true">/</span>
            <span aria-current="page">${breadcrumb}</span>
          </nav>
          <a href="/blog/?cat=${encodeURIComponent(category)}" class="post-tag">${category}</a>
          <h1 class="post-title" itemprop="headline">${title}</h1>
          <div class="post-meta">
            <span itemprop="author" itemscope itemtype="https://schema.org/Person">
              Por <strong itemprop="name">Ana Grilo</strong>
            </span>
            <span class="post-meta__dot" aria-hidden="true"></span>
            <time datetime="${iso}" itemprop="datePublished">${displayDate}</time>
            <span class="post-meta__dot" aria-hidden="true"></span>
            <span>${readingTime} min de leitura</span>
          </div>
          ${frontmatter.image ? `<figure class="post-hero-img">
            <img src="${frontmatter.image}" alt="${title}" width="1200" height="630" loading="eager" itemprop="image">
          </figure>` : ''}
        </div>
      </header>

      <div class="post-body container" itemprop="articleBody">
${htmlBody}
        <hr />

        <div class="post-author">
          <div class="post-author__avatar">
            <img src="../../img/ana-sobre-2.jpeg" alt="Foto da Ana Grilo" width="140" height="140" loading="lazy" />
          </div>
          <div>
            <p class="post-author__name">Ana Grilo</p>
            <p class="post-author__bio">
              Fonoaudióloga especializada em voz e comunicação. Graduada pela UFRJ, especialista em Voz pelo CEV-SP e mestre em Artes Cênicas pela UNIRIO. Atende em Niterói e online.
            </p>
          </div>
        </div>
      </div>

    </article>
${buildRelatedSection(frontmatter, slug, allPosts)}
  </main>

${footer()}

  <script src="../../js/main.js"></script>
</body>
</html>`;
}

function buildPostCard(slug, frontmatter, markdown = '') {
  const iso         = isoDate(frontmatter.date);
  const displayDate = formatDate(frontmatter.date);
  const readingTime = frontmatter.reading_time || estimateReadingTime(markdown);
  const tagsAttr = (frontmatter.tags || []).join(',');
  const imgHtml = frontmatter.image
    ? `<div class="post-card__img"><img src="${frontmatter.image}" alt="${frontmatter.title}" loading="lazy" width="800" height="450"></div>`
    : '';
  return `<!-- POST:${slug} -->
          <article class="post-card" data-category="${frontmatter.category || ''}" data-tags="${tagsAttr}">
            <a href="/blog/${slug}/" class="post-card__link" aria-label="Ler: ${frontmatter.title}">
              ${imgHtml}
              <div class="post-card__tag-bar">
                <span class="post-card__tag">${frontmatter.category || ''}</span>
              </div>
              <div class="post-card__body">
                <h2 class="post-card__title">${frontmatter.title}</h2>
                <p class="post-card__excerpt">${frontmatter.description || ''}</p>
                <div class="post-card__meta">
                  <time datetime="${iso}">${displayDate}</time>
                  <span class="post-card__meta-dot" aria-hidden="true"></span>
                  <span>${readingTime} min de leitura</span>
                </div>
              </div>
            </a>
          </article>
          <!-- /POST:${slug} -->`;
}

function injectCardInIndex(slug, cardHTML) {
  let content = fs.readFileSync(BLOG_INDEX, 'utf8');
  const startMarker = `<!-- POST:${slug} -->`;
  const endMarker   = `<!-- /POST:${slug} -->`;

  if (content.includes(startMarker)) {
    // Substitui card existente (edição de post)
    const slugEsc = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`<!-- POST:${slugEsc} -->[\\s\\S]*?\\s*<!-- /POST:${slugEsc} -->`, 'g');
    content = content.replace(re, cardHTML);
    fs.writeFileSync(BLOG_INDEX, content, 'utf8');
    console.log(`  index.html: card atualizado para "${slug}".`);
    return;
  }

  const MARKER = '          <!-- COLE NOVOS POSTS AQUI -->';
  if (!content.includes(MARKER)) {
    console.warn('  AVISO: marcador não encontrado em blog/index.html');
    return;
  }
  content = content.replace(MARKER, `${cardHTML}\n\n${MARKER}`);
  fs.writeFileSync(BLOG_INDEX, content, 'utf8');
  console.log(`  index.html: card adicionado para "${slug}".`);
}

// ── main ──────────────────────────────────────────────────────────────────────

if (!fs.existsSync(POSTS_DIR)) {
  console.log('Nenhum post encontrado em blog/_posts/.');
  process.exit(0);
}

const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));

if (files.length === 0) {
  console.log('Nenhum arquivo .md em blog/_posts/.');
  process.exit(0);
}

// 1ª passagem: lê frontmatter de todos os posts para montar a lista
const allPosts = files.map(filename => {
  const raw = fs.readFileSync(path.join(POSTS_DIR, filename), 'utf8');
  const { data: frontmatter, content: markdown } = matter(raw);
  return { filename, slug: slugFromFilename(filename), frontmatter, markdown };
}).filter(p => p.frontmatter.title && p.frontmatter.date && !p.frontmatter.draft)
  .sort((a, b) => {
    const diff = new Date(b.frontmatter.date) - new Date(a.frontmatter.date);
    if (diff !== 0) return diff;
    // Desempate: alfabético pelo nome do arquivo (garante ordem determinística)
    return a.filename.localeCompare(b.filename);
  });

// 2ª passagem: gera HTML de cada post
for (const post of allPosts) {
  const { slug, frontmatter, markdown, filename } = post;
  const destDir  = path.join(BLOG_DIR, slug);
  const destFile = path.join(destDir, 'index.html');

  if (fs.existsSync(destFile) && !FORCE) {
    console.log(`Pulando "${slug}" (HTML já existe; use --force para regenerar).`);
    continue;
  }

  console.log(`Processando: ${filename} → blog/${slug}/index.html`);

  const cleanMd = markdown.replace(/\\([#>\-\*_\[\]!`~])/g, '$1');
  const htmlBody = injectCta(marked.parse(cleanMd), frontmatter.cta_texto, frontmatter.title);
  const postHTML = buildPostHTML(slug, frontmatter, markdown, htmlBody, allPosts);

  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(destFile, postHTML, 'utf8');
  console.log(`  Gerado: blog/${slug}/index.html`);

  injectCardInIndex(slug, buildPostCard(slug, frontmatter, markdown));
}

// Gera sitemap.xml incluindo posts do blog
const BASE_URL = 'https://www.anagrilovoz.com';
const today = new Date().toISOString().slice(0, 10);

const staticPages = [
  { loc: '/',                          lastmod: '2026-05-14', priority: '1.0', changefreq: 'monthly' },
  { loc: '/voz-clinica/',              lastmod: '2026-05-14', priority: '0.8', changefreq: 'monthly' },
  { loc: '/voz-artistica/',            lastmod: '2026-05-14', priority: '0.8', changefreq: 'monthly' },
  { loc: '/harmonizacao-vocal-trans/', lastmod: '2026-05-14', priority: '0.9', changefreq: 'monthly' },
  { loc: '/oratoria-comunicacao/',     lastmod: '2026-05-14', priority: '0.8', changefreq: 'monthly' },
  { loc: '/motricidade-orofacial/',    lastmod: '2026-05-14', priority: '0.8', changefreq: 'monthly' },
  { loc: '/move-voz-empresarial/',     lastmod: '2026-05-14', priority: '0.7', changefreq: 'monthly' },
  { loc: '/sobre-ana/',                lastmod: '2026-05-14', priority: '0.7', changefreq: 'monthly' },
  { loc: '/blog/',                     lastmod: today,        priority: '0.8', changefreq: 'weekly'  },
];

const postEntries = allPosts.map(p => ({
  loc:        `/blog/${p.slug}/`,
  lastmod:    (p.frontmatter.date ? new Date(p.frontmatter.date).toISOString().slice(0, 10) : today),
  priority:   '0.7',
  changefreq: 'yearly',
}));

const urlTag = ({ loc, lastmod, priority, changefreq }) =>
  `  <url>\n    <loc>${BASE_URL}${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...staticPages, ...postEntries].map(urlTag).join('\n')}\n</urlset>\n`;

fs.writeFileSync(path.join(__dirname, '../sitemap.xml'), sitemapXml, 'utf8');
console.log(`Sitemap atualizado com ${postEntries.length} post(s).`);

console.log('Concluído.');

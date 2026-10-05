// yt_watch_shot.cjs — DETERMINISTIC capture of a YouTube /watch page for an evidence card (QCR-332).
//
// Why it exists: a "live" screenshot of a video page taken with the MCP browser captured the pre-roll
// AD (with a third party's face) inside the player, plus a "Sponsored" card and competitor thumbnails
// in the sidebar — and it went on air. A YouTube page is therefore never photographed "as is": the
// player receives the video's OWN real poster
// (i.ytimg.com/vi/<id>/maxresdefault.jpg), o <video> (que pode estar num ad) é escondido, os
// slots de anúncio, a barra lateral de recomendações e os comentários são removidos, e o script
// só salva o PNG depois de PROVAR no DOM que nada disso sobrou. A prova vai em <out>.meta.json
// (ad_free:true) — `prepare_reference_shot.py` recusa print de youtube.com sem essa prova.
//
// Uso: node reference-pipeline/yt_watch_shot.cjs "<watch url>" /abs/out.png [--mode poster|frame] [--t 12] [--keep-sidebar]
//   poster (default): player mostra o pôster maxresdefault do vídeo (o que o usuário vê antes do play).
//   frame:            espera o anúncio acabar (skip quando possível, até 120 s), pausa e busca o segundo --t
//                     do vídeo REAL; se o ad não sair no prazo, cai para poster.
// Saída: PNG (viewport 1280x900 @2x, full-page) + <out>.meta.json { ad_free, checks, video_id, mode, ... }.
const fs = require('fs');
const path = require('path');
// playwright-core: resolve dinamicamente (os caches do npx mudam de hash; o path fixo do headless_capture.cjs apodreceu)
function loadPlaywright() {
  const cands = [];
  // 1) the local install: cd reference-pipeline && npm install && npx playwright install chromium
  try { cands.push(require.resolve('playwright', { paths: [__dirname] })); } catch {}
  try { cands.push(require.resolve('playwright-core')); } catch {}
  const npx = path.join(process.env.HOME, '.npm', '_npx');
  try { for (const d of fs.readdirSync(npx)) for (const n of ['playwright-core', 'playwright']) { const c = path.join(npx, d, 'node_modules', n); if (fs.existsSync(path.join(c, 'package.json'))) cands.push(c); } } catch {}
  for (const c of cands) { try { const m = require(c); if (m && m.chromium) return m; } catch {} }
  throw new Error('playwright-core não encontrado (npx cache vazio?) — rode `npx playwright --version` uma vez');
}
const { chromium } = loadPlaywright();

const argv = process.argv.slice(2);
const url = argv[0], out = argv[1];
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const MODE = opt('--mode', 'poster');
const T = parseFloat(opt('--t', '12'));
const KEEP_SIDEBAR = argv.includes('--keep-sidebar');
if (!url || !out) { console.error('uso: yt_watch_shot.cjs <url> <out.png> [--mode poster|frame] [--t s]'); process.exit(2); }
const vid = (url.match(/[?&]v=([\w-]{11})/) || url.match(/youtu\.be\/([\w-]{11})/) || url.match(/shorts\/([\w-]{11})/) || [])[1];
if (!vid) { console.error('não achei o video id na URL'); process.exit(2); }

const AD_SEL = ['#player-ads', '#masthead-ad', 'ytd-ad-slot-renderer', 'ytd-promoted-sparkles-web-renderer',
  'ytd-promoted-video-renderer', 'ytd-banner-promo-renderer', 'ytd-in-feed-ad-layout-renderer', 'ytd-display-ad-renderer',
  'ytd-companion-slot-renderer', 'ytd-action-companion-ad-renderer', '.ytp-ad-overlay-container', '.ytp-ad-module',
  'ytd-engagement-panel-section-list-renderer[target-id*="ads"]', 'ytd-merch-shelf-renderer', 'ytd-mealbar-promo-renderer',
  'tp-yt-paper-dialog', 'ytd-popup-container', 'ytd-consent-bump-v2-lightbox', '#dismissible.ytd-ad-slot-renderer'];

(async () => {
  const exe = process.env.MAESTRO_CHROMIUM;   // optional: point at a specific Chromium/Chrome binary
  const browser = await chromium.launch({ ...(exe ? { executablePath: exe } : {}), headless: true, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, locale: 'pt-BR',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36' });
  const page = await ctx.newPage();
  const meta = { url, video_id: vid, mode: MODE, t: T, captured_at: new Date().toISOString(), checks: {}, ad_free: false, viewport: '1280x900@2x' };
  try {
    try { await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }); }
    catch { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }); }
    // consent (pt-BR / en)
    for (const rx of [/aceitar tudo/i, /accept all/i, /aceitar/i, /accept/i, /concordo/i, /agree/i]) {
      try { const b = page.getByRole('button', { name: rx }).first(); if (await b.isVisible({ timeout: 400 })) { await b.click({ timeout: 800 }); break; } } catch {}
    }
    await page.waitForSelector('#movie_player, .html5-video-player', { timeout: 30000 });
    await page.waitForTimeout(1500);

    let adSeen = false, adCleared = false;
    if (MODE === 'frame') {
      const t0 = Date.now();
      while (Date.now() - t0 < 120000) {
        const ad = await page.evaluate(() => { const p = document.querySelector('.html5-video-player'); return !!p && (p.classList.contains('ad-showing') || p.classList.contains('ad-interrupting')); });
        if (!ad) { adCleared = true; break; }
        adSeen = true;
        for (const s of ['.ytp-skip-ad-button', '.ytp-ad-skip-button', '.ytp-ad-skip-button-modern', 'button[class*="skip"]']) {
          try { const b = page.locator(s).first(); if (await b.isVisible({ timeout: 200 })) { await b.click({ timeout: 500 }); } } catch {}
        }
        await page.waitForTimeout(1500);
      }
      if (adCleared) {
        await page.evaluate(async (t) => { const v = document.querySelector('video'); if (!v) return; v.muted = true; try { await v.play(); } catch {} v.pause(); v.currentTime = t; await new Promise(r => v.addEventListener('seeked', r, { once: true })); }, T);
        await page.waitForTimeout(800);
      }
    }
    meta.checks.ad_seen_while_waiting = adSeen; meta.checks.ad_cleared = adCleared;
    const usePoster = MODE === 'poster' || !adCleared;
    meta.mode_effective = usePoster ? 'poster' : 'frame';

    // limpeza + pôster + prova, tudo dentro da página
    const result = await page.evaluate(({ vid, usePoster, keepSidebar, AD_SEL }) => {
      const removed = {};
      for (const s of AD_SEL) { const n = document.querySelectorAll(s); if (n.length) { removed[s] = n.length; n.forEach(e => e.remove()); } }
      // sidebar: ESVAZIA (não remove) — remover faz o player ocupar a largura toda e o título cai fora da janela do card
      if (!keepSidebar) { const sec = document.querySelector('#secondary'); if (sec) { removed['#secondary(children)'] = sec.children.length; sec.replaceChildren(); sec.style.visibility = 'hidden'; } }
      const cm = document.querySelector('ytd-comments, #comments'); if (cm) { cm.remove(); removed['#comments'] = 1; }
      const p = document.querySelector('.html5-video-player');
      const v = document.querySelector('video');
      if (usePoster && p) {
        p.classList.remove('ad-showing', 'ad-interrupting', 'playing-mode'); p.classList.add('paused-mode');
        if (v) { v.pause(); v.style.setProperty('visibility', 'hidden', 'important'); }
        // esconde overlays do ad e o "chrome" do player que denuncia estado
        // remove TODO nó de anúncio do player (o YouTube mantém ~17 contêineres ytp-ad-* vazios mesmo sem ad) + chrome que denuncia estado
        p.querySelectorAll('[class*="ytp-ad"], .ytp-ce-element, .ytp-cued-thumbnail-overlay, .ytp-chrome-top, .ytp-gradient-top, .ytp-paid-content-overlay').forEach(e => e.remove());
        p.style.backgroundImage = `url(https://i.ytimg.com/vi/${vid}/maxresdefault.jpg)`;
        p.style.backgroundSize = 'cover'; p.style.backgroundPosition = 'center'; p.style.backgroundRepeat = 'no-repeat';
        // controles em estado "pausado no 0:00", sem barra vermelha de progresso do ad
        const prog = p.querySelector('.ytp-play-progress'); if (prog) prog.style.transform = 'scaleX(0)';
        const timeCur = p.querySelector('.ytp-time-current'); if (timeCur) timeCur.textContent = '0:00';
        const timeDur = p.querySelector('.ytp-time-duration'); const d = document.querySelector('ytd-thumbnail-overlay-time-status-renderer');
        if (timeDur && v && isFinite(v.duration) && v.duration > 60) timeDur.textContent = new Date(v.duration * 1000).toISOString().substr(v.duration >= 3600 ? 11 : 14, v.duration >= 3600 ? 8 : 5);
      }
      document.querySelectorAll('body *').forEach(e => { const cs = getComputedStyle(e); if ((cs.position === 'fixed' || cs.position === 'sticky') && !e.closest('.html5-video-player') && e.id !== 'masthead-container') e.style.setProperty('display', 'none', 'important'); });
      window.scrollTo(0, 0);
      // PROVA
      const checks = {
        player_present: !!p,
        ad_showing_class: !!p && (p.classList.contains('ad-showing') || p.classList.contains('ad-interrupting')),
        ad_overlays_left: p ? Array.from(p.querySelectorAll('[class*="ytp-ad"]')).filter(e => e.offsetWidth > 0 && e.offsetHeight > 0 && getComputedStyle(e).display !== 'none').length : -1,
        ad_slots_left: AD_SEL.reduce((n, s) => n + document.querySelectorAll(s).length, 0),
        sponsored_text_left: Array.from(document.querySelectorAll('#primary *')).filter(e => e.children.length === 0 && /^(Sponsored|Patrocinado|Anúncio|Ad)$/i.test((e.textContent || '').trim())).length,
        sidebar_left: !!document.querySelector('#secondary ytd-compact-video-renderer, #secondary ytd-item-section-renderer, #secondary ytd-ad-slot-renderer, #secondary img'),
        comments_left: !!document.querySelector('ytd-comments, #comments'),
        poster_applied: usePoster ? (p && p.style.backgroundImage.includes(vid)) : null,
        video_visible: v ? getComputedStyle(v).visibility !== 'hidden' : false,
        title: (document.querySelector('h1.ytd-watch-metadata, h1 yt-formatted-string, #title h1') || {}).textContent || '',
        channel: (document.querySelector('#owner #channel-name a, ytd-channel-name a') || {}).textContent || '',
        removed,
      };
      return checks;
    }, { vid, usePoster, keepSidebar: KEEP_SIDEBAR, AD_SEL });
    Object.assign(meta.checks, result);
    meta.checks.title = (meta.checks.title || '').trim(); meta.checks.channel = (meta.checks.channel || '').trim();
    meta.ad_free = !!(result.player_present && !result.ad_showing_class && result.ad_overlays_left === 0 && result.ad_slots_left === 0
      && result.sponsored_text_left === 0 && (KEEP_SIDEBAR || !result.sidebar_left) && !result.comments_left
      && (usePoster ? (result.poster_applied && !result.video_visible) : true));
    // pôster precisa carregar
    await page.waitForTimeout(1200);
    await page.screenshot({ path: out, fullPage: true });
    fs.writeFileSync(out.replace(/\.png$/i, '') + '.meta.json', JSON.stringify(meta, null, 2));
    console.log(JSON.stringify({ saved: out, ad_free: meta.ad_free, mode: meta.mode_effective, title: meta.checks.title, channel: meta.checks.channel, removed: result.removed }, null, 1));
    if (!meta.ad_free) { console.error('AD_FREE=false — NÃO use este print. checks:', JSON.stringify(result)); process.exitCode = 3; }
  } catch (e) {
    meta.error = String(e); fs.writeFileSync(out.replace(/\.png$/i, '') + '.meta.json', JSON.stringify(meta, null, 2));
    console.error('ERRO:', e); process.exitCode = 1;
  } finally { await browser.close(); }
})();

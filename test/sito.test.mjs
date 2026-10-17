// Prova del sito vero: la build in dist/ servita da vite preview e aperta in Chromium.
// Controlla che la casa si carichi senza errori, che le due versioni e la piantina funzionino,
// che le texture KTX2 arrivino compresse e che le draw call restino sotto la soglia.
//
// Uso: npm run build && npm test
// CHROMIUM=/percorso/chrome usa un Chromium gia' installato al posto di quello di Playwright.
// Senza scheda grafica (WebGL software) il caricamento richiede qualche decina di secondi.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { preview } from 'vite';
import { chromium } from 'playwright';

let server, browser, page;
const errori = [];

before(async () => {
  server = await preview({ preview: { port: 4179, strictPort: true }, logLevel: 'error' });
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM || undefined,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  page.on('pageerror', (e) => errori.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  await page.goto('http://localhost:4179/');
  await page.waitForFunction(() => window.__casa, null, { timeout: 280000 });
  // qualita' leggera: un solo passaggio di disegno, le draw call si contano direttamente
  await page.click('#btn-qualita');
}, { timeout: 300000 });

after(async () => {
  await browser?.close();
  await new Promise((r) => server?.httpServer.close(r));
});

test('la casa si carica senza errori', () => {
  assert.deepEqual(errori, []);
});

test('le texture fotografiche arrivano compresse (KTX2)', async () => {
  const n = await page.evaluate(() => {
    const viste = new Set();
    window.__casa.scene.traverse((o) => {
      for (const m of [].concat(o.material || [])) for (const k of ['map', 'normalMap']) if (m[k]?.isCompressedTexture) viste.add(m[k].source);
    });
    return viste.size;
  });
  assert.ok(n >= 30, `texture compresse: ${n}`);
});

test('vista esterna sotto le 600 draw call, ombre incluse', async () => {
  const calls = await page.evaluate(() => {
    const c = window.__casa, R = c.renderer;
    c.camera.position.set(-22, 14, 32); c.orbit.target.set(5, -2, -3); c.orbit.update();
    R.shadowMap.needsUpdate = true;
    R.render(c.scene, c.camera);
    return R.info.render.calls;
  });
  assert.ok(calls > 50 && calls < 600, `draw call: ${calls}`);
});

test('le due versioni del soggiorno si alternano', async () => {
  for (const v of ['v2', 'v1']) {
    await page.click(`#btn-${v}`);
    const stato = await page.evaluate((v) => ({
      bottone: document.getElementById(`btn-${v}`).classList.contains('on'),
      visibili: Object.entries(window.__casa.varianti).filter(([, g]) => g.visible).map(([t]) => t).sort(),
    }), v);
    assert.equal(stato.bottone, true);
    assert.deepEqual(stato.visibili, [`aperto.${v}`, v].sort());
  }
});

test('la piantina quotata si apre e si chiude', async () => {
  await page.click('#btn-piantina');
  await page.waitForSelector('#piantina svg', { timeout: 30000 });
  await page.click('#pg-chiudi');
  assert.equal(await page.evaluate(() => document.body.classList.contains('piantina')), false);
});

test('da ferma la scena non si ridisegna', async () => {
  await page.waitForTimeout(1500);
  const prima = await page.evaluate(() => window.__casa.renderer.info.render.frame);
  await page.waitForTimeout(2000);
  const dopo = await page.evaluate(() => window.__casa.renderer.info.render.frame);
  assert.equal(dopo - prima, 0);
});

test('nessun errore dopo le prove', () => {
  assert.deepEqual(errori, []);
});

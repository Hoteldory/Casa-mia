// Converte le texture fotografiche in KTX2 (Basis Universal), con le mipmap gia' dentro.
//
// Sulla scheda grafica una texture KTX2 resta compressa (BC7 sui computer, ASTC o ETC sui telefoni):
// occupa da 4 a 8 volte meno di un webp o di un jpg, che il browser scompatta pixel per pixel.
//
// Sorgenti: tools/sorgenti/tex/*.webp (le prepara tools/texture_foto.py). Uscita: public/tex/*.ktx2.
//
// Tutto in ETC1S, il formato piu' leggero da scaricare:
// - normal map (_n): lineari, con il preset per le normal map dell'encoder, qualita' massima. In UASTC
//   sarebbero piu' fedeli ma 4-5 volte piu' pesanti, e qui danno solo un rilievo leggero;
// - trame grigie dei materiali "dettaglio" (_d) e ruvidita' (_r): lineari (sono dati, non colori);
// - foto a colori dei materiali "naturali" (_d): sRGB.
// Le immagini si girano in verticale in fase di codifica: le texture compresse non si possono girare
// al caricamento, e cosi' restano orientate come i webp di prima (normal map comprese).
//
// Uso: node tools/texture_ktx2.mjs  (serve python3 con Pillow per leggere i webp)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodeToKTX2 } from 'ktx2-encoder';

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..');
const SORGENTI = join(RADICE, 'tools', 'sorgenti');
// le foto che tengono i loro colori (vedi FOTO in src/data/stile.js, naturale: true)
const NATURALI = new Set(['terreno', 'coppi', 'juta', 'ghiaia']);

// webp -> RGBA grezzo, con Pillow
const PY = `import sys, struct
from PIL import Image
im = Image.open(sys.stdin.buffer).convert('RGBA')
sys.stdout.buffer.write(struct.pack('<II', *im.size) + im.tobytes())`;
function decodifica(buf) {
  const out = execFileSync('python3', ['-I', '-c', PY], { input: buf, maxBuffer: 256 * 1024 * 1024 });
  const width = out.readUInt32LE(0), height = out.readUInt32LE(4);
  return { width, height, data: new Uint8Array(out.buffer, out.byteOffset + 8, width * height * 4) };
}

const comuni = { imageDecoder: decodifica, generateMipmap: true, isYFlip: true, isKTX2File: true };
const ETC1S = (srgb, qualita = 200) => ({
  ...comuni, isUASTC: false, qualityLevel: qualita, compressionLevel: 4,
  isInputSRGB: srgb, isSetKTX2SRGBTransferFunc: srgb, isPerceptual: srgb,
});
const NORMALE = { ...ETC1S(false, 255), isNormalMap: true };

function opzioni(nome) {
  const [src, mappa] = nome.split('_');
  if (mappa === 'n') return NORMALE;
  if (mappa === 'd' && NATURALI.has(src)) return ETC1S(true);
  return ETC1S(false);
}

let prima = 0, dopo = 0;
const da = join(SORGENTI, 'tex'), a = join(RADICE, 'public', 'tex');
mkdirSync(a, { recursive: true });
for (const f of readdirSync(da).filter((x) => x.endsWith('.webp')).sort()) {
  const nome = f.replace(/\.webp$/, '');
  const buf = readFileSync(join(da, f));
  const ktx = await encodeToKTX2(buf, opzioni(nome));
  writeFileSync(join(a, `${nome}.ktx2`), ktx);
  prima += buf.length; dopo += ktx.length;
  console.log(`tex/${nome}.ktx2`.padEnd(20), `${(buf.length / 1024).toFixed(0).padStart(5)} KB ->`, `${(ktx.length / 1024).toFixed(0).padStart(5)} KB`);
}
console.log(`totale: ${(prima / 1048576).toFixed(1)} MB -> ${(dopo / 1048576).toFixed(1)} MB da scaricare`);

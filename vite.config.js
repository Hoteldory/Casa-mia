import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Il traduttore Basis Universal per le texture KTX2 (public/tex/*.ktx2) arriva dal pacchetto di
// three, alla stessa versione del KTX2Loader: si serve in sviluppo e si copia nella build come basis/.
const BASIS = fileURLToPath(new URL('./node_modules/three/examples/jsm/libs/basis/', import.meta.url));
const FILE_BASIS = ['basis_transcoder.js', 'basis_transcoder.wasm'];
const traduttoreBasis = {
  name: 'traduttore-basis',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const f = FILE_BASIS.find((x) => req.url?.split('?')[0].endsWith(`/basis/${x}`));
      if (!f) return next();
      res.setHeader('Content-Type', f.endsWith('.wasm') ? 'application/wasm' : 'text/javascript');
      res.end(readFileSync(BASIS + f));
    });
  },
  generateBundle() {
    for (const f of FILE_BASIS) this.emitFile({ type: 'asset', fileName: `basis/${f}`, source: readFileSync(BASIS + f) });
  },
};

export default { base: './', plugins: [traduttoreBasis] };

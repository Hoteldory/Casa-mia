// Musica soft per il tour, generata al momento con Web Audio (nessun file da scaricare):
// accordi lenti di pad caldi e qualche nota di "piano" in pentatonica, con un riverbero
// fatto di rumore che si spegne. Parte solo dopo un clic (regola dei browser).
const ACCORDI = [
  // Fmaj7, Dm9, Bbmaj7, C6/9 (frequenze in Hz)
  [87.31, 174.61, 220.0, 261.63, 329.63],
  [73.42, 146.83, 174.61, 220.0, 329.63],
  [58.27, 116.54, 146.83, 174.61, 220.0],
  [65.41, 130.81, 196.0, 220.0, 293.66],
];
const NOTE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // do re mi sol la do

export function creaMusica() {
  let ac = null, master = null, riverbero = null, timer = null, accesa = false, passo = 0;

  function prepara() {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain();
    master.gain.value = 0;
    master.connect(ac.destination);
    // riverbero: risposta all'impulso di rumore che decade in 3,5 s
    riverbero = ac.createConvolver();
    const len = Math.floor(ac.sampleRate * 3.5);
    const ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    riverbero.buffer = ir;
    const wet = ac.createGain();
    wet.gain.value = 0.55;
    riverbero.connect(wet).connect(master);
  }

  function voce(freq, t0, durata, volume, tipo) {
    const o1 = ac.createOscillator(), o2 = ac.createOscillator();
    o1.type = tipo; o2.type = 'sine';
    o1.frequency.value = freq; o2.frequency.value = freq * 1.003; // leggero chorus
    const filtro = ac.createBiquadFilter();
    filtro.type = 'lowpass'; filtro.frequency.value = 900;
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(volume, t0 + Math.min(2.2, durata / 3));
    g.gain.setValueAtTime(volume, t0 + durata - 2.5);
    g.gain.linearRampToValueAtTime(0, t0 + durata);
    o1.connect(filtro); o2.connect(filtro);
    filtro.connect(g);
    g.connect(master); g.connect(riverbero);
    o1.start(t0); o2.start(t0);
    o1.stop(t0 + durata + 0.1); o2.stop(t0 + durata + 0.1);
  }

  function nota(freq, t0) {
    // "piano": attacco secco, decadimento esponenziale, due armoniche
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.06, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + 2.8);
    for (const [k, v] of [[1, 1], [2, 0.25], [3, 0.08]]) {
      const o = ac.createOscillator();
      o.type = 'sine'; o.frequency.value = freq * k;
      const gk = ac.createGain(); gk.gain.value = v;
      o.connect(gk).connect(g);
      o.start(t0); o.stop(t0 + 3);
    }
    g.connect(master); g.connect(riverbero);
  }

  function battuta() {
    const t0 = ac.currentTime + 0.05, D = 8;
    const acc = ACCORDI[passo % ACCORDI.length];
    acc.forEach((f, i) => voce(f, t0, D + 2.5, i === 0 ? 0.05 : 0.03, i === 0 ? 'triangle' : 'sine'));
    // tre o quattro note sparse sopra l'accordo
    for (let k = 0; k < 4; k++) if (Math.random() < 0.75) nota(NOTE[Math.floor(Math.random() * NOTE.length)], t0 + 0.6 + k * 1.9 + Math.random() * 0.4);
    passo++;
  }

  return {
    get accesa() { return accesa; },
    avvia() {
      if (accesa) return;
      if (!ac) prepara();
      ac.resume();
      accesa = true;
      master.gain.cancelScheduledValues(ac.currentTime);
      master.gain.setValueAtTime(master.gain.value, ac.currentTime);
      master.gain.linearRampToValueAtTime(0.9, ac.currentTime + 3);
      battuta();
      timer = setInterval(battuta, 8000);
    },
    ferma() {
      if (!accesa) return;
      accesa = false;
      clearInterval(timer);
      master.gain.cancelScheduledValues(ac.currentTime);
      master.gain.setValueAtTime(master.gain.value, ac.currentTime);
      master.gain.linearRampToValueAtTime(0, ac.currentTime + 2);
    },
  };
}

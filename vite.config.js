// Three.js va in un file a parte (three-[hash].js): cambia di rado, cosi' dopo una modifica alla
// casa il browser riscarica solo il codice della casa. Da sola la libreria e' circa 880 KB (circa
// 230 KB compressa) e non si puo' dividere oltre: il limite dell'avviso e' alzato per lei.
export default {
  base: './',
  build: {
    chunkSizeWarningLimit: 950,
    rolldownOptions: {
      output: {
        codeSplitting: { groups: [{ name: 'three', test: /node_modules[\\/]three[\\/]/ }] },
      },
    },
  },
};

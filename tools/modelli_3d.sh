#!/usr/bin/env bash
# Scarica da Poly Haven (CC0) i modelli 3D e li alleggerisce per il sito con gltf-transform:
# meno triangoli (meshoptimizer), texture webp a 512 px, geometria compressa meshopt.
# Uso: bash tools/modelli_3d.sh   (serve accesso a dl.polyhaven.org e a npm)
set -euo pipefail
cd "$(dirname "$0")/.."
TMP=$(mktemp -d)
BASE=https://dl.polyhaven.org/file/ph-assets/Models
# nome Poly Haven, file nel sito, quota di vertici da tenere (1 = non semplificare)
MODELLI=(
  "potted_plant_01 pianta_alta 0.08"
  "potted_plant_02 pianta_media 0.2"
  "potted_plant_04 pianta_piccola 1"
)
scarica() { # $1 nome: il .gltf, il .bin e le texture (alcune stanno nella cartella jpg)
  local n=$1 d="$TMP/$1"
  mkdir -p "$d"
  curl -sf "$BASE/gltf/1k/$n/${n}_1k.gltf" -o "$d/${n}_1k.gltf"
  python3 - "$d/${n}_1k.gltf" <<'PY' | while read -r u; do
import json, sys
g = json.load(open(sys.argv[1]))
for b in g['buffers']: print(b['uri'])
for i in g.get('images', []): print(i['uri'])
PY
    mkdir -p "$d/$(dirname "$u")"
    curl -sf "$BASE/gltf/1k/$n/$u" -o "$d/$u" || curl -sf "$BASE/jpg/1k/$n/$(basename "$u")" -o "$d/$u"
  done
}
for riga in "${MODELLI[@]}"; do
  set -- $riga
  scarica "$1"
  if [ "$3" = 1 ]; then semplifica=(--simplify false); else semplifica=(--simplify-ratio "$3" --simplify-error 0.01); fi
  npx -y @gltf-transform/cli@4 optimize "$TMP/$1/$1_1k.gltf" "public/modelli/$2.glb" \
    --compress meshopt --texture-compress webp --texture-size 512 "${semplifica[@]}"
done
rm -rf "$TMP"

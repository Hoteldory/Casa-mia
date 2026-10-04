"""Scarica da Poly Haven (CC0) le texture fotografiche dei materiali e le prepara per il sito.

Per ogni sorgente scarica la foto (diff), la normal map (nor_gl) e, dove serve, la ruvidita'
(rough), a 1K, e scrive in public/tex/ dei .webp leggeri:

- modo "dettaglio": dalla foto resta solo la trama, in grigio, con media 0.8; il colore lo mette
  il materiale (stile.js), cosi' le tinte scelte per la casa non cambiano;
- modo "naturale": la foto con i suoi colori (coppi, juta, ghiaia).

"alto" toglie le macchie larghe della foto (passa-alto): niente ripetizioni visibili sui muri.
Uso: python3 tools/texture_foto.py   (serve accesso a dl.polyhaven.org)
"""
import io, os, urllib.request
from PIL import Image, ImageFilter, ImageOps

BASE = 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/{n}/{n}_{m}_1k.jpg'
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'tex')

# chiave: (sorgente Poly Haven, modo, contrasto, passa-alto, lato in px, con ruvidita')
SORGENTI = {
    'intonaco':  ('plastered_wall', 'dettaglio', 1.0, True, 1024, False),
    'vernice':   ('painted_plaster_wall', 'dettaglio', 0.6, True, 512, False),
    'listoni':   ('laminate_floor_02', 'dettaglio', 1.0, False, 1024, True),
    'legno':     ('oak_veneer_01', 'dettaglio', 1.4, False, 1024, False),
    'parquet':   ('wood_floor', 'dettaglio', 1.0, False, 1024, True),
    'lino':      ('rough_linen', 'dettaglio', 2.5, True, 512, False),
    'velluto':   ('velour_velvet', 'dettaglio', 2.0, True, 512, False),
    'cuoio':     ('fabric_leather_02', 'dettaglio', 1.2, False, 512, True),
    'cotto':     ('floor_tiles_08', 'dettaglio', 1.0, False, 1024, True),
    'pietra':    ('marble_01', 'dettaglio', 1.0, False, 1024, True),
    'prato':     ('leafy_grass', 'dettaglio', 1.3, True, 1024, False),
    'terreno':   ('sparse_grass', 'naturale', 1.0, False, 1024, False),
    'coppi':     ('roof_tiles', 'naturale', 1.0, False, 1024, True),
    'juta':      ('hessian_230', 'naturale', 1.0, False, 512, False),
    'ghiaia':    ('gravel_floor', 'naturale', 1.0, False, 1024, False),
}


def scarica(nome, mappa):
    url = BASE.format(n=nome, m=mappa)
    with urllib.request.urlopen(url, timeout=120) as r:
        return Image.open(io.BytesIO(r.read()))


def passa_alto(im, raggio):
    # divide per la media locale: restano i dettagli, spariscono le macchie larghe
    from PIL import ImageChops
    sfoc = im.filter(ImageFilter.GaussianBlur(raggio))
    import numpy as np
    a = np.asarray(im, dtype=np.float32) + 1
    b = np.asarray(sfoc, dtype=np.float32) + 1
    m = a.mean()
    return Image.fromarray(np.clip(a / b * m, 0, 255).astype('uint8'))


def main():
    import numpy as np
    os.makedirs(OUT, exist_ok=True)
    for chiave, (nome, modo, k, alto, lato, rough) in SORGENTI.items():
        diff = scarica(nome, 'diff').convert('RGB')
        if modo == 'dettaglio':
            g = ImageOps.grayscale(diff)
            if alto:
                g = passa_alto(g, 48)
            a = np.asarray(g, dtype=np.float32)
            v = 0.8 * (1 + k * (a / a.mean() - 1))
            out = Image.fromarray(np.clip(v * 255, 0, 255).astype('uint8'), 'L')
        else:
            out = diff
        out.resize((lato, lato), Image.LANCZOS).save(os.path.join(OUT, f'{chiave}_d.webp'), quality=82)
        nor = scarica(nome, 'nor_gl').convert('RGB')
        nor.resize((lato, lato), Image.LANCZOS).save(os.path.join(OUT, f'{chiave}_n.webp'), quality=88)
        if rough:
            r = ImageOps.grayscale(scarica(nome, 'rough'))
            r.resize((lato // 2, lato // 2), Image.LANCZOS).save(os.path.join(OUT, f'{chiave}_r.webp'), quality=82)
        print('ok', chiave, nome)


if __name__ == '__main__':
    main()

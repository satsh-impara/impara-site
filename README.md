# impara.org — sitio de Impara

Sitio estático (HTML + CSS + JS, sin dependencias) para **GitHub Pages**, con el mismo lenguaje visual que satsh.org:
fondo negro, campo de estrellas, paneles a pantalla completa, saludos flotando con paralaje, brillo cálido y botones de borde fino.
**Bilingüe** (ES / EN): usa el idioma del navegador y tiene selector que recuerda la elección (`localStorage`, clave `impara-lang`).

| Archivo | Qué es |
|---|---|
| `index.html` | Toda la página (hero, qué es, demo del teléfono, lecciones, idiomas, "muy pronto") |
| `assets/css/impara.css` | Estilos |
| `assets/js/impara.js` | Idioma, paralaje (scroll y cursor), estrellas, demo "Construye la frase" |
| `assets/img/og-impara.png` | Imagen para compartir en redes (1200×630) |
| `404.html`, `robots.txt`, `sitemap.xml`, `CNAME`, `.nojekyll`, `favicon.svg` | Extras para publicar |

## Publicar con el dominio impara.org (GitHub Pages)

1. Sube **el contenido de esta carpeta** a un repositorio (rama `main`, con `index.html` y `CNAME` en la raíz).
2. Settings → Pages → *Deploy from a branch* → `main` / `(root)`; en *Custom domain* escribe `impara.org`.
3. En tu proveedor de dominio crea los registros DNS (A `@` → 185.199.108.153 / .109.153 / .110.153 / .111.153, y CNAME `www` → `TU-USUARIO.github.io`; confirma las IP vigentes en la documentación de GitHub Pages).
4. Cuando GitHub verifique el DNS, activa *Enforce HTTPS*.

Para probarlo en tu equipo: `python -m http.server 8000` dentro de esta carpeta y abre http://localhost:8000

## Cosas que seguramente querrás editar

- **Botón de Google Play**: está como "pronto" (`<span class="btn btn--soon">` al final de `index.html`). Cuando exista la ficha, cámbialo por `<a class="btn" href="URL">`.
- **Lista de idiomas** (`#languages`): son los cursos que hay en desarrollo; ajústala cuando cambie el catálogo.
- **Demo del teléfono**: es una ilustración (lo dice el pie "Vista ilustrativa"). Si tienes capturas reales de la app, puedes sustituir el bloque `.phone`.
- **Textos**: cada texto está en español e inglés con `<span data-lang="es">…</span><span data-lang="en">…</span>`.
- Si el visitante activa "reducir movimiento" en su sistema, se desactivan el paralaje y las animaciones.

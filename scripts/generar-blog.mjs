// Genera el listado del blog y agrega los posts al sitemap.
//
// Uso: node scripts/generar-blog.mjs <carpeta-del-sitio>
//
// Lee cada blog/<slug>/index.html, toma título, descripción y fecha de sus
// etiquetas <meta>, y escribe las tarjetas entre los marcadores POSTS:INICIO y
// POSTS:FIN de blog/index.html. También agrega cada post a sitemap.xml.
// Lo ejecuta la GitHub Action "Publicar sitio" sobre la copia que se publica,
// así que los archivos del repo no cambian.

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SITIO = "https://cimbratech.com";
const raiz = process.argv[2] ?? ".";
const carpetaBlog = path.join(raiz, "blog");

function leerMeta(html, atributo, valor) {
  const patron = new RegExp(
    `<meta\\s+${atributo}="${valor}"\\s+content="([^"]*)"`,
    "i",
  );
  return html.match(patron)?.[1];
}

function fechaLegible(fechaIso) {
  return new Date(`${fechaIso}T12:00:00Z`).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

const posts = [];
for (const entrada of await readdir(carpetaBlog, { withFileTypes: true })) {
  if (!entrada.isDirectory()) continue;
  const archivo = path.join(carpetaBlog, entrada.name, "index.html");
  let html;
  try {
    html = await readFile(archivo, "utf8");
  } catch {
    continue;
  }
  // Los valores ya vienen escapados para HTML desde la plantilla.
  const titulo = leerMeta(html, "property", "og:title");
  const descripcion = leerMeta(html, "name", "description") ?? "";
  const fecha = leerMeta(html, "property", "article:published_time");
  if (!titulo || !/^\d{4}-\d{2}-\d{2}/.test(fecha ?? "")) {
    console.warn(`Se omite blog/${entrada.name}: le falta og:title o article:published_time.`);
    continue;
  }
  posts.push({ slug: entrada.name, titulo, descripcion, fecha: fecha.slice(0, 10) });
}

posts.sort((a, b) => b.fecha.localeCompare(a.fecha) || a.slug.localeCompare(b.slug));

// Listado del blog
const rutaIndice = path.join(carpetaBlog, "index.html");
const indice = await readFile(rutaIndice, "utf8");
const inicio = indice.indexOf("<!-- POSTS:INICIO");
const fin = indice.indexOf("<!-- POSTS:FIN -->");
if (inicio === -1 || fin === -1) {
  throw new Error("blog/index.html no tiene los marcadores POSTS:INICIO y POSTS:FIN.");
}
const finInicio = indice.indexOf("-->", inicio) + 3;
const tarjetas = posts
  .map(
    (p) => `
          <article class="post-card">
            <a href="/blog/${p.slug}/">
              <img src="/assets/blog/${p.slug}.png" alt="" width="1536" height="1024" loading="lazy" />
              <div class="post-card-body">
                <time datetime="${p.fecha}">${fechaLegible(p.fecha)}</time>
                <h2>${p.titulo}</h2>
                <p>${p.descripcion}</p>
              </div>
            </a>
          </article>`,
  )
  .join("");
await writeFile(
  rutaIndice,
  indice.slice(0, finInicio) + tarjetas + "\n          " + indice.slice(fin),
);

// Sitemap
const rutaSitemap = path.join(raiz, "sitemap.xml");
const sitemap = await readFile(rutaSitemap, "utf8");
if (!sitemap.includes("</urlset>")) {
  throw new Error("sitemap.xml no tiene la etiqueta </urlset>.");
}
const urls = posts
  .filter((p) => !sitemap.includes(`${SITIO}/blog/${p.slug}/`))
  .map(
    (p) =>
      `  <url>\n    <loc>${SITIO}/blog/${p.slug}/</loc>\n    <lastmod>${p.fecha}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`,
  )
  .join("");
await writeFile(rutaSitemap, sitemap.replace("</urlset>", `${urls}</urlset>`));

console.log(`Blog generado: ${posts.length} post(s).`);

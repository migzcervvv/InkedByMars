import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { seoPages, siteOrigin } from './src/config/seo.js'
import { studio } from './src/config/studio.js'

const dist = new URL('./dist/', import.meta.url)
const template = await readFile(new URL('index.html', dist), 'utf8')
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;')

for (const [path, page] of Object.entries(seoPages)) {
  const url = new URL(path, siteOrigin).href
  const title = escape(page.title + ' | ' + studio.name)
  const description = escape(page.description)
  const html = template
    .replace(/<title>.*?<\/title>/, () => '<title>' + title + '</title>')
    .replace(/((?:property="og:title")\s+content=")[^"]*/, (_, prefix) => prefix + title)
    .replace(/((?:name="description"|property="og:description")\s+content=")[^"]*/g, (_, prefix) => prefix + description)
    .replace('</head>', '  <link rel="canonical" href="' + url + '">\n    <meta property="og:url" content="' + url + '">\n  </head>')
  const directory = new URL('.' + path.replace(/\/?$/, '/'), dist)
  await mkdir(directory, { recursive: true })
  await writeFile(new URL('index.html', directory), html)
}

const urls = Object.keys(seoPages).map(path => '  <url><loc>' + new URL(path, siteOrigin).href + '</loc></url>')
await writeFile(new URL('sitemap.xml', dist), [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls,
  '</urlset>',
  '',
].join('\n'))
await writeFile(new URL('robots.txt', dist), 'User-agent: *\nAllow: /\nSitemap: ' + siteOrigin + '/sitemap.xml\n')

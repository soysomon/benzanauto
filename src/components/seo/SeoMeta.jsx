import { Helmet } from 'react-helmet-async'
import {
  buildCanonicalUrl,
  buildPageTitle,
  getDefaultDescription,
  getDefaultLocale,
  getDefaultOgImage,
  getSiteName,
  truncateDescription,
} from '../../lib/seo'

export default function SeoMeta({
  title,
  description,
  pathname = '/',
  image,
  type = 'website',
  noIndex = false,
  jsonLd = [],
}) {
  const fullTitle = buildPageTitle(title)
  const metaDescription = truncateDescription(description || getDefaultDescription())
  const canonicalUrl = buildCanonicalUrl(pathname)
  const ogImage = image || getDefaultOgImage()
  const robots = noIndex ? 'noindex,nofollow,noarchive' : 'index,follow,max-image-preview:large'
  const jsonLdEntries = Array.isArray(jsonLd) ? jsonLd.filter(Boolean) : [jsonLd].filter(Boolean)

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:locale" content={getDefaultLocale()} />
      <meta property="og:site_name" content={getSiteName()} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={fullTitle} />

      <meta name="twitter:card" content={ogImage ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLdEntries.map((entry, index) => (
        <script
          key={`${pathname}-jsonld-${index}`}
          type="application/ld+json"
        >
          {JSON.stringify(entry)}
        </script>
      ))}
    </Helmet>
  )
}

/* Logos SVG simplificados de marcas automotrices — monocromáticos */

export function ToyotaLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 198 144" fill="none" className={className}>
      {/* Óvalo exterior */}
      <ellipse cx="99" cy="72" rx="96" ry="70" stroke="currentColor" strokeWidth="7"/>
      {/* Óvalo horizontal interior */}
      <ellipse cx="99" cy="72" rx="68" ry="27" stroke="currentColor" strokeWidth="6"/>
      {/* Óvalo vertical interior */}
      <ellipse cx="99" cy="72" rx="27" ry="70" stroke="currentColor" strokeWidth="6"/>
    </svg>
  )
}

export function HyundaiLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 198 144" fill="none" className={className}>
      {/* Óvalo */}
      <ellipse cx="99" cy="72" rx="96" ry="70" stroke="currentColor" strokeWidth="7"/>
      {/* H estilizada e inclinada */}
      <path
        d="M62 46 L56 98 M56 72 Q99 54 142 72 M136 46 L130 98"
        stroke="currentColor" strokeWidth="9" strokeLinecap="round" fill="none"
      />
    </svg>
  )
}

export function FordLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 240 144" fill="none" className={className}>
      {/* Óvalo */}
      <ellipse cx="120" cy="72" rx="116" ry="68" stroke="currentColor" strokeWidth="7"/>
      {/* Texto Ford en cursiva serif */}
      <text
        x="120" y="89"
        fontFamily="Times New Roman, Georgia, serif"
        fontSize="56"
        textAnchor="middle"
        fill="currentColor"
        fontStyle="italic"
        fontWeight="bold"
      >
        Ford
      </text>
    </svg>
  )
}

export function MitsubishiLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 160 140" fill="currentColor" className={className}>
      {/* Tres rombos — top center, bottom-left, bottom-right */}
      <polygon points="80,4  100,42 80,80 60,42" />
      <polygon points="80,80 60,42 20,42 40,80" />
      <polygon points="80,80 100,42 140,42 120,80" />
    </svg>
  )
}

export function NissanLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 200 144" fill="none" className={className}>
      <ellipse cx="100" cy="72" rx="96" ry="68" stroke="currentColor" strokeWidth="6"/>
      <line x1="4" y1="72" x2="196" y2="72" stroke="currentColor" strokeWidth="6"/>
      <rect x="42" y="52" width="116" height="40" stroke="currentColor" strokeWidth="5" fill="none"/>
      <text x="100" y="84" fontFamily="Arial, sans-serif" fontSize="30" textAnchor="middle" fill="currentColor" fontWeight="bold" letterSpacing="2">NISSAN</text>
    </svg>
  )
}

export function HondaLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 140 160" fill="currentColor" className={className}>
      {/* H de Honda */}
      <path d="
        M18,18 L18,142 L50,142 L50,98 L90,98 L90,142 L122,142 L122,18 L90,18 L90,62 L50,62 L50,18 Z
      "/>
    </svg>
  )
}

export function KiaLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 200 100" fill="none" className={className}>
      <text x="100" y="76" fontFamily="Arial, sans-serif" fontSize="68" textAnchor="middle"
        fill="currentColor" fontWeight="800" letterSpacing="8">KIA</text>
    </svg>
  )
}

export function ChevroletLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 200 140" fill="currentColor" className={className}>
      {/* Bowtie / corbata de Chevrolet */}
      <path d="M0,50 L60,50 L78,90 L122,90 L140,50 L200,50 L200,90 L152,90 L134,50 L66,50 L48,90 L0,90 Z"/>
    </svg>
  )
}

export function IsuzuLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 220 100" fill="none" className={className}>
      {/* Dos "I" estilizadas — símbolo clásico de Isuzu */}
      <rect x="14"  y="10" width="28" height="80" rx="4" fill="currentColor"/>
      <rect x="14"  y="10" width="68" height="22" rx="4" fill="currentColor"/>
      <rect x="14"  y="68" width="68" height="22" rx="4" fill="currentColor"/>
      <rect x="54"  y="10" width="28" height="80" rx="4" fill="currentColor"/>
      <rect x="108" y="10" width="28" height="80" rx="4" fill="currentColor"/>
      <rect x="108" y="10" width="68" height="22" rx="4" fill="currentColor"/>
      <rect x="108" y="68" width="68" height="22" rx="4" fill="currentColor"/>
      <rect x="148" y="10" width="28" height="80" rx="4" fill="currentColor"/>
    </svg>
  )
}

export function JeepLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 220 120" fill="currentColor" className={className}>
      {/* 7 ranuras de la parrilla icónica de Jeep */}
      {[0,1,2,3,4,5,6].map(i => (
        <rect key={i} x={10 + i * 30} y="10" width="18" height="100" rx="9" />
      ))}
    </svg>
  )
}

export function LexusLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 200 140" fill="none" className={className}>
      {/* Óvalo */}
      <ellipse cx="100" cy="70" rx="96" ry="64" stroke="currentColor" strokeWidth="7"/>
      {/* L estilizada con serif */}
      <path
        d="M66 34 L66 106 L134 106"
        stroke="currentColor" strokeWidth="11"
        strokeLinecap="square" strokeLinejoin="miter" fill="none"
      />
    </svg>
  )
}

export function SubaruLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 200 140" fill="currentColor" className={className}>
      {/* Óvalo exterior */}
      <ellipse cx="100" cy="70" rx="96" ry="64" fill="none" stroke="currentColor" strokeWidth="6"/>
      {/* Estrella grande (izquierda) */}
      <circle cx="72" cy="58" r="18"/>
      {/* 5 estrellas pequeñas (derecha — Pléyades) */}
      <circle cx="112" cy="42" r="11"/>
      <circle cx="138" cy="56" r="11"/>
      <circle cx="140" cy="84" r="11"/>
      <circle cx="116" cy="96" r="11"/>
      <circle cx="92"  cy="88" r="11"/>
    </svg>
  )
}

/* Marcas con imagen local en /images/marcas/ como fallback si no hay SVG inline */
const imageMap = {}

/* Mapa de marca → componente SVG (fallback) */
const logoMap = {
  Toyota:      ToyotaLogo,
  Honda:       HondaLogo,
  Isuzu:       IsuzuLogo,
  Jeep:        JeepLogo,
  Lexus:       LexusLogo,
  Hyundai:    HyundaiLogo,
  Ford:       FordLogo,
  Mitsubishi: MitsubishiLogo,
  Subaru:     SubaruLogo,
  Nissan:     NissanLogo,
  Kia:        KiaLogo,
  Chevrolet:  ChevroletLogo,
}

export default function BrandLogo({ brand, className = 'w-10 h-6' }) {
  const Logo = logoMap[brand]
  if (Logo) {
    return <Logo className={className} />
  }

  if (imageMap[brand]) {
    return (
      <img
        src={imageMap[brand]}
        alt={brand}
        className={className}
        style={{ objectFit: 'contain', filter: 'brightness(0) saturate(100%) opacity(0.88)' }}
      />
    )
  }

  return (
    <span className={`flex items-center justify-center font-heading font-700 text-sm ${className}`}>
      {brand.slice(0, 3).toUpperCase()}
    </span>
  )
}

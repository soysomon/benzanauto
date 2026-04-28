const items = [
  'Dealer Autorizado Toyota',
  'Taller Certificado',
  'Garantía Oficial',
  'Repuestos Originales',
  '+20 Años de Experiencia',
  'Financiamiento Disponible',
  'Bar & Grill Exclusivo',
  'Servicio Express',
  'Inspección de 150 Puntos',
  'Entrega Inmediata',
]

function MarqueeItem({ text }) {
  return (
    <div className="flex items-center gap-6 flex-shrink-0">
      <span className="font-heading font-600 text-sm uppercase tracking-widest text-neutral-500 whitespace-nowrap">
        {text}
      </span>
      <span className="w-1.5 h-1.5 bg-b-red rotate-45 flex-shrink-0" />
    </div>
  )
}

export default function TrustMarquee() {
  return (
    <div className="relative bg-neutral-100 border-y border-neutral-200 py-4 overflow-hidden">
      {/* Gradient masks */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-neutral-100 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-neutral-100 to-transparent z-10 pointer-events-none" />

      <div className="flex animate-marquee gap-6">
        {[...items, ...items].map((item, i) => (
          <MarqueeItem key={i} text={item} />
        ))}
      </div>
    </div>
  )
}

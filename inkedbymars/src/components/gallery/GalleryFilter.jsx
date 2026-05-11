import { galleryCategories } from '../../utils/categorizePost'

export function GalleryFilter({ active, onChange }) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Gallery filters">
      {galleryCategories.map((filter) => (
        <button
          key={filter.value}
          type="button"
          onClick={() => onChange(filter.value)}
          className={`shrink-0 border px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] transition ${
            active === filter.value ? 'border-red bg-red text-cream' : 'border-ink/20 text-ink hover:border-red hover:text-red'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}

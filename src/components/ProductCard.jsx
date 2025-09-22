import PropTypes from 'prop-types'

const ProductCard = ({ product, onSelect }) => {
  const {
    name,
    category,
    vendor,
    priceDisplay,
    thumbnailUrl,
    tags,
  } = product

  const handleActivate = (event) => {
    event.preventDefault()
    onSelect?.(product)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect?.(product)
    }
  }

  return (
    <article
      tabIndex={0}
      role="button"
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-card focus:outline-none focus:ring-2 focus:ring-brand/40"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Image coming soon
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {category && (
          <span className="text-[0.65rem] font-heading uppercase tracking-wider text-slate-500">
            {category}
          </span>
        )}
        <h3 className="text-lg font-heading font-semibold text-ink">
          {name}
        </h3>
        {vendor && <p className="text-sm text-slate-500">by {vendor}</p>}
        {priceDisplay ? (
          <p className="text-base font-semibold text-brand">{priceDisplay}</p>
        ) : (
          <p className="text-sm font-medium text-slate-500">
            Quote upon request
          </p>
        )}
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="badge bg-slate-200 text-slate-600">
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="badge bg-slate-100 text-slate-400">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

ProductCard.propTypes = {
  product: PropTypes.shape({
    name: PropTypes.string.isRequired,
    category: PropTypes.string,
    vendor: PropTypes.string,
    priceDisplay: PropTypes.string,
    thumbnailUrl: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  onSelect: PropTypes.func,
}

export default ProductCard

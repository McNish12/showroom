import PropTypes from 'prop-types'

const ProductCard = ({ product, onSelect }) => {
  const { name, priceRange, thumbnailUrl } = product

  const handleClick = (event) => {
    onSelect?.(product, event.currentTarget)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
      aria-label={`View details for ${name}`}
    >
      <div className="flex h-48 items-center justify-center overflow-hidden bg-slate-100">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={name}
            loading="lazy"
            className="max-h-full w-full object-contain transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
            <span className="text-3xl" aria-hidden="true">
              🏆
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest">Image coming soon</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-5 py-6">
        <h3 className="text-lg font-heading font-semibold text-ink">{name}</h3>
        <p className="text-sm font-semibold text-brand">
          {priceRange ? priceRange : 'Price: Contact for quote'}
        </p>
      </div>
    </button>
  )
}

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    priceRange: PropTypes.string,
    thumbnailUrl: PropTypes.string,
  }).isRequired,
  onSelect: PropTypes.func,
}

export default ProductCard

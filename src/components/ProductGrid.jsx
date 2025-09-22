import PropTypes from 'prop-types'
import ProductCard from './ProductCard'

const slugify = (value) =>
  String(value || 'uncategorized')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const ProductGrid = ({ products, categoryOrder, onSelectProduct, totalCount }) => {
  const grouped = products.reduce((acc, product) => {
    const category = product.category || 'Uncategorized'
    if (!acc.has(category)) {
      acc.set(category, [])
    }
    acc.get(category).push(product)
    return acc
  }, new Map())

  const orderedGroups = []
  const seen = new Set()

  categoryOrder.forEach((category) => {
    if (grouped.has(category)) {
      orderedGroups.push([category, grouped.get(category)])
      seen.add(category)
    }
  })

  grouped.forEach((items, category) => {
    if (!seen.has(category)) {
      orderedGroups.push([category, items])
    }
  })

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-heading font-semibold">Product Catalog</h2>
          <p className="muted text-sm">
            Discover a curated selection of branded merchandise for your next launch.
          </p>
        </div>
        <p className="muted text-sm">
          Showing <span className="font-semibold text-ink">{products.length}</span> of {totalCount} products
        </p>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-12 text-center text-slate-500">
          No products match the current filters. Try adjusting your search.
        </div>
      ) : (
        orderedGroups.map(([category, items]) => (
          <div
            key={category}
            id={`category-${slugify(category)}`}
            className="mb-12 border-t border-slate-200 pt-8 first:mt-0 first:border-t-0 first:pt-0"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-2xl font-heading font-semibold uppercase tracking-wide text-ink">
                {category}
              </h3>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {items.length} item{items.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((product) => (
                <ProductCard key={product.id || product.key} product={product} onSelect={onSelectProduct} />
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  )
}

ProductGrid.propTypes = {
  products: PropTypes.arrayOf(PropTypes.object).isRequired,
  categoryOrder: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSelectProduct: PropTypes.func,
  totalCount: PropTypes.number.isRequired,
}

export default ProductGrid

import PropTypes from 'prop-types'
import ProductCard from './ProductCard'

const ProductGrid = ({ products, onSelectProduct }) => {
  if (!products.length) {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-600">
        <p className="text-lg font-semibold text-ink">No products available</p>
        <p className="mt-2 text-sm text-slate-500">
          Please check back soon. We update our catalog regularly with fresh recognition pieces.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onSelect={onSelectProduct} />
      ))}
    </div>
  )
}

ProductGrid.propTypes = {
  products: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onSelectProduct: PropTypes.func,
}

export default ProductGrid

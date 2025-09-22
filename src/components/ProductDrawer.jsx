import { useMemo, useRef } from 'react'
import PropTypes from 'prop-types'
import useFocusTrap from '../hooks/useFocusTrap'

const ProductDrawer = ({ product, onClose, onImageClick }) => {
  const drawerRef = useRef(null)
  useFocusTrap(drawerRef, Boolean(product), { onEscape: onClose })

  const galleryImages = useMemo(() => {
    if (!product) return []
    const unique = Array.from(new Set(product.galleryUrls.filter(Boolean)))
    if (!unique.length && product.thumbnailUrl) {
      return [product.thumbnailUrl]
    }
    return unique
  }, [product])

  const tableColumns = useMemo(() => {
    if (!product || !product.variants.length) return []
    const keys = new Set()
    product.variants.forEach((variant) => {
      Object.keys(variant.columns).forEach((key) => keys.add(key))
    })
    return Array.from(keys)
  }, [product])

  if (!product) return null

  const headingId = `product-${product.id}-heading`

  const handlePrimaryImageClick = (event) => {
    if (!product.thumbnailUrl) return
    onImageClick?.({
      src: product.thumbnailUrl,
      alt: `${product.name} preview`,
      trigger: event.currentTarget,
    })
  }

  const handleGalleryClick = (src) => (event) => {
    onImageClick?.({
      src,
      alt: `${product.name} preview`,
      trigger: event.currentTarget,
    })
  }

  const priceLabel = product.priceRange ? `Price: ${product.priceRange}` : 'Price: Contact for quote'

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-900/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        ref={drawerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="relative z-50 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id={headingId} className="text-xl font-heading font-semibold text-ink">
            {product.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
            aria-label="Close product details"
          >
            <span aria-hidden="true" className="text-2xl leading-none">
              ×
            </span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-8">
          <div className="py-6">
            {product.thumbnailUrl ? (
              <button
                type="button"
                onClick={handlePrimaryImageClick}
                className="flex w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-100"
              >
                <span className="sr-only">Open larger image of {product.name}</span>
                <img
                  src={product.thumbnailUrl}
                  alt={product.name}
                  className="max-h-80 w-full object-contain"
                />
              </button>
            ) : (
              <div className="flex h-64 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-400">
                <span className="text-4xl" aria-hidden="true">
                  🏆
                </span>
                <span className="text-sm font-semibold uppercase tracking-widest">No image available</span>
              </div>
            )}
          </div>

          <div className="space-y-4 text-sm text-slate-600">
            <p className="font-semibold text-ink">{priceLabel}</p>
            {product.description && (
              <p className="whitespace-pre-line leading-relaxed">{product.description}</p>
            )}

            <div className="flex flex-wrap gap-3">
              {product.preview3DLink && (
                <a
                  className="inline-flex items-center justify-center rounded-full bg-brand px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-brand/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
                  href={product.preview3DLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View 3D preview
                </a>
              )}
              {product.templateDownload && (
                <a
                  className="inline-flex items-center justify-center rounded-full border border-brand px-4 py-2 text-xs font-semibold uppercase tracking-widest text-brand transition hover:bg-brand/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
                  href={product.templateDownload}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download template
                </a>
              )}
            </div>
          </div>

          {product.variants.length > 0 && (
            <section className="mt-8">
              <h3 className="text-sm font-heading font-semibold uppercase tracking-widest text-slate-500">
                Pricing Options
              </h3>
              <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                    <tr>
                      <th scope="col" className="px-4 py-3">
                        Variant
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Price
                      </th>
                      {tableColumns.map((column) => (
                        <th key={column} scope="col" className="px-4 py-3">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {product.variants.map((variant, index) => (
                      <tr key={variant.id || `${variant.option}-${index}`}>
                        <td className="px-4 py-3 font-medium text-slate-700">{variant.option}</td>
                        <td className="px-4 py-3">{variant.price || 'Contact for quote'}</td>
                        {tableColumns.map((column) => (
                          <td key={column} className="px-4 py-3 text-sm">
                            {variant.columns[column] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {galleryImages.length > 0 && (
            <section className="mt-8">
              <h3 className="text-sm font-heading font-semibold uppercase tracking-widest text-slate-500">Gallery</h3>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {galleryImages.map((src, index) => (
                  <button
                    type="button"
                    key={`${src}-${index}`}
                    onClick={handleGalleryClick(src)}
                    className="flex h-24 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
                    aria-label="View larger product image"
                  >
                    <img src={src} alt={`${product.name} gallery image`} className="max-h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </aside>
    </div>
  )
}

ProductDrawer.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    priceRange: PropTypes.string,
    description: PropTypes.string,
    preview3DLink: PropTypes.string,
    templateDownload: PropTypes.string,
    thumbnailUrl: PropTypes.string,
    galleryUrls: PropTypes.arrayOf(PropTypes.string),
    variants: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        option: PropTypes.string.isRequired,
        price: PropTypes.string,
        columns: PropTypes.objectOf(PropTypes.string),
      }),
    ),
  }),
  onClose: PropTypes.func,
  onImageClick: PropTypes.func,
}

ProductDrawer.defaultProps = {
  product: null,
  onClose: undefined,
  onImageClick: undefined,
}

export default ProductDrawer

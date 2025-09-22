import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

const placeholder = 'https://dummyimage.com/1200x900/f1f5f9/94a3b8&text=Image+coming+soon'

const ProductDetail = ({ product, onClose }) => {
  const gallery = useMemo(() => {
    if (!product) return []
    const sources = [...(product.gallery || [])]
    if (product.thumbnailUrl) {
      sources.unshift(product.thumbnailUrl)
    }
    const unique = Array.from(new Set(sources.filter(Boolean)))
    return unique.length ? unique : [placeholder]
  }, [product])

  const [activeImage, setActiveImage] = useState(gallery[0] ?? placeholder)

  useEffect(() => {
    setActiveImage(gallery[0] ?? placeholder)
  }, [gallery])

  useEffect(() => {
    if (!product) return
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [product, onClose])

  if (!product) return null

  return (
    <div className="fixed inset-0 z-40 flex">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={() => onClose?.()}
        aria-hidden="true"
      />
      <aside className="relative ml-auto flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl">
        <button
          type="button"
          className="absolute right-6 top-5 text-3xl font-semibold text-slate-400 transition hover:text-slate-700"
          aria-label="Close product detail"
          onClick={() => onClose?.()}
        >
          ×
        </button>
        <div className="flex-1 overflow-y-auto px-6 pb-12 pt-12 sm:px-10">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-slate-100">
                <img
                  src={activeImage}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              </div>
              {gallery.length > 1 && (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                  {gallery.map((image) => (
                    <button
                      type="button"
                      key={image}
                      onClick={() => setActiveImage(image)}
                      className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border transition ${
                        activeImage === image
                          ? 'border-brand shadow'
                          : 'border-slate-200 hover:border-brand/60'
                      }`}
                    >
                      <img
                        src={image}
                        alt="Product thumbnail"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {product.category || 'Featured'}
                </span>
                <h2 className="text-3xl font-heading font-semibold text-ink">
                  {product.name}
                </h2>
                {product.vendor && (
                  <p className="text-sm uppercase tracking-wider text-slate-500">
                    by {product.vendor}
                  </p>
                )}
              </div>

              {product.priceDisplay ? (
                <p className="text-2xl font-semibold text-brand">{product.priceDisplay}</p>
              ) : (
                <p className="text-lg font-semibold text-slate-500">Quote upon request</p>
              )}

              {product.description && (
                <p className="whitespace-pre-line text-base leading-relaxed text-slate-600">
                  {product.description}
                </p>
              )}

              {product.imprintMethods.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-heading font-semibold uppercase tracking-wide text-slate-500">
                    Imprint Methods
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {product.imprintMethods.map((method) => (
                      <span key={method} className="badge bg-brand/10 text-brand">
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {product.tags.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-heading font-semibold uppercase tracking-wide text-slate-500">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <span key={tag} className="badge bg-slate-200 text-slate-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {product.previewUrl && (
                <a
                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-heading font-semibold uppercase tracking-wide text-white transition hover:bg-brand/90"
                  href={product.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Preview in 3D
                </a>
              )}
            </div>
          </div>

          {product.variants.length > 0 && (
            <div className="mt-10">
              <h3 className="mb-4 text-lg font-heading font-semibold text-ink">
                Available Variants
              </h3>
              <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th scope="col" className="px-4 py-3">
                        Option
                      </th>
                      <th scope="col" className="px-4 py-3">
                        SKU
                      </th>
                      <th scope="col" className="px-4 py-3 text-right">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {product.variants.map((variant) => (
                      <tr key={variant.id || variant.name}>
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {variant.displayName}
                        </td>
                        <td className="px-4 py-3 text-xs uppercase tracking-wide text-slate-400">
                          {variant.sku || '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-ink">
                          {variant.priceDisplay || 'Quote'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}

ProductDetail.propTypes = {
  product: PropTypes.shape({
    name: PropTypes.string.isRequired,
    category: PropTypes.string,
    vendor: PropTypes.string,
    priceDisplay: PropTypes.string,
    description: PropTypes.string,
    thumbnailUrl: PropTypes.string,
    gallery: PropTypes.arrayOf(PropTypes.string),
    imprintMethods: PropTypes.arrayOf(PropTypes.string),
    tags: PropTypes.arrayOf(PropTypes.string),
    previewUrl: PropTypes.string,
    variants: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        sku: PropTypes.string,
        displayName: PropTypes.string,
        priceDisplay: PropTypes.string,
      }),
    ),
  }),
  onClose: PropTypes.func,
}

export default ProductDetail

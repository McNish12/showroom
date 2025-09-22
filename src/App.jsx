import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ProductGrid from './components/ProductGrid'
import ProductDrawer from './components/ProductDrawer'
import ImageModal from './components/ImageModal'
import { loadCatalog } from './utils/catalog'

const App = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [expandedImage, setExpandedImage] = useState(null)
  const cardTriggerRef = useRef(null)
  const modalTriggerRef = useRef(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    document.title = 'Honors, Inc.'
    const base = import.meta.env.BASE_URL || '/'
    const href = `${base}favicon.svg`
    const existing = document.querySelector('link[rel="icon"][data-honors-favicon]')
    let link = existing
    let created = false
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      link.dataset.honorsFavicon = 'true'
      document.head.appendChild(link)
      created = true
    }
    const previous = { href: link.href, type: link.type }
    link.type = 'image/svg+xml'
    link.href = href

    return () => {
      if (created) {
        link.remove()
      } else {
        link.type = previous.type
        link.href = previous.href
      }
    }
  }, [])

  const updateCatalog = useCallback(async () => {
    if (!isMountedRef.current) return
    setLoading(true)
    try {
      const data = await loadCatalog()
      if (!isMountedRef.current) return
      setProducts(data)
      setError('')
    } catch (err) {
      if (!isMountedRef.current) return
      console.error('Unable to load catalog data', err)
      const message = err instanceof Error ? err.message : 'An unknown error occurred while loading the catalog.'
      setProducts([])
      setError(message)
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    updateCatalog()
  }, [updateCatalog])

  const selectedProduct = useMemo(
    () => products.find((item) => item.id === selectedProductId) || null,
    [products, selectedProductId],
  )

  useEffect(() => {
    if (!selectedProduct) {
      setExpandedImage(null)
      modalTriggerRef.current = null
    }
  }, [selectedProduct])

  useEffect(() => {
    if (!selectedProductId) return
    const exists = products.some((item) => item.id === selectedProductId)
    if (!exists) {
      setSelectedProductId(null)
    }
  }, [products, selectedProductId])

  useEffect(() => {
    const shouldLock = Boolean(selectedProduct) || Boolean(expandedImage)
    if (!shouldLock) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [selectedProduct, expandedImage])

  const handleSelectProduct = (product, trigger) => {
    setSelectedProductId(product.id)
    cardTriggerRef.current = trigger || null
  }

  const handleCloseDrawer = () => {
    setSelectedProductId(null)
    setExpandedImage(null)
    modalTriggerRef.current = null
    const trigger = cardTriggerRef.current
    cardTriggerRef.current = null
    if (trigger && typeof trigger.focus === 'function') {
      trigger.focus()
    }
  }

  const handleOpenImage = ({ src, alt, trigger }) => {
    if (!src) return
    modalTriggerRef.current = trigger || null
    setExpandedImage({ src, alt: alt || 'Expanded product image' })
  }

  const handleCloseImage = () => {
    setExpandedImage(null)
    const trigger = modalTriggerRef.current
    modalTriggerRef.current = null
    if (trigger && typeof trigger.focus === 'function') {
      trigger.focus()
    }
  }

  const handleRetry = () => {
    updateCatalog()
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-6">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Awards Catalog</span>
          <h1 className="text-3xl font-heading font-bold text-ink">Honors, Inc.</h1>
          <p className="text-sm text-slate-500">
            Discover customizable trophies, plaques, and recognition pieces ready for your next celebration.
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10" role="main">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-slate-600">
            <span
              className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand"
              aria-hidden="true"
            />
            <p className="text-sm font-medium">Loading catalog…</p>
          </div>
        ) : error ? (
          <div className="mx-auto w-full max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 px-6 py-12 text-center text-rose-600">
            <h2 className="text-lg font-heading font-semibold text-rose-700">We couldn’t load the catalog.</h2>
            <p className="mt-2 text-sm">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold uppercase tracking-widest text-white transition hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              Try again
            </button>
          </div>
        ) : (
          <ProductGrid products={products} onSelectProduct={handleSelectProduct} />
        )}
      </main>

      <ProductDrawer product={selectedProduct} onClose={handleCloseDrawer} onImageClick={handleOpenImage} />
      <ImageModal image={expandedImage} onClose={handleCloseImage} />
    </div>
  )
}

export default App

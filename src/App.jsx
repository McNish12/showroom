import { useEffect, useMemo, useState } from 'react'
import TopBar from './components/TopBar'
import SiteHeader from './components/SiteHeader'
import ProductGrid from './components/ProductGrid'
import ProductDetail from './components/ProductDetail'
import Footer from './components/Footer'
import {
  PRODUCTS_CSV_URL,
  VARIANTS_CSV_URL,
  extractProducts,
  extractVariants,
  mergeCatalog,
  buildCollections,
} from './utils/catalog'

const fetchCsv = async (url) => {
  if (!url) return ''
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`Failed to load data (${response.status})`)
  }
  return response.text()
}

function App() {
  const [products, setProducts] = useState([])
  const [collections, setCollections] = useState({ categories: [], imprints: [], tags: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [imprintFilter, setImprintFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [productsCsv, variantsCsv] = await Promise.all([
          fetchCsv(PRODUCTS_CSV_URL),
          fetchCsv(VARIANTS_CSV_URL).catch((err) => {
            console.warn('Variants CSV unavailable', err)
            return ''
          }),
        ])

        const productList = extractProducts(productsCsv)
        const variantList = extractVariants(variantsCsv)
        const enriched = mergeCatalog(productList, variantList)
        const builtCollections = buildCollections(enriched)

        if (active) {
          setProducts(enriched)
          setCollections(builtCollections)
        }
      } catch (err) {
        if (active) {
          const message = err instanceof Error ? err.message : String(err)
          setError(message)
          setProducts([])
          setCollections({ categories: [], imprints: [], tags: [] })
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return products.filter((product) => {
      if (categoryFilter && product.category !== categoryFilter) return false
      if (imprintFilter && !product.imprintMethods.some((method) => method === imprintFilter)) return false
      if (tagFilter && !product.tags.some((tag) => tag === tagFilter)) return false
      if (query && !product.searchTokens.includes(query)) return false
      return true
    })
  }, [products, categoryFilter, imprintFilter, tagFilter, searchTerm])

  useEffect(() => {
    if (!selectedProduct) return
    const exists = filteredProducts.some((product) => product.key === selectedProduct.key)
    if (!exists) {
      setSelectedProduct(null)
    }
  }, [filteredProducts, selectedProduct])

  useEffect(() => {
    setSelectedProduct(null)
  }, [categoryFilter, imprintFilter, tagFilter])

  const totalCount = products.length

  return (
    <div className="flex min-h-screen flex-col bg-slate-50" id="top">
      <TopBar />
      <SiteHeader
        categories={collections.categories}
        activeCategory={categoryFilter}
        onCategoryChange={setCategoryFilter}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        imprintOptions={collections.imprints}
        activeImprint={imprintFilter}
        onImprintChange={setImprintFilter}
        tagOptions={collections.tags}
        activeTag={tagFilter}
        onTagChange={setTagFilter}
      />
      <main className="flex-1 bg-slate-50">
        {loading ? (
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-4 px-4 py-20 text-center text-slate-500">
            <span className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand" />
            <p>Loading catalog data…</p>
          </div>
        ) : error ? (
          <div className="mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 px-6 py-12 text-center text-rose-600">
            <p className="text-lg font-semibold">We couldn’t load the catalog.</p>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        ) : (
          <ProductGrid
            products={filteredProducts}
            categoryOrder={collections.categories}
            onSelectProduct={setSelectedProduct}
            totalCount={totalCount}
          />
        )}
      </main>
      <Footer />
      <ProductDetail product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  )
}

export default App

import { useEffect, useMemo, useRef, useState } from 'react'
import TopBar from './components/TopBar'
import SiteHeader from './components/SiteHeader'
import ProductGrid from './components/ProductGrid'
import ProductDetail from './components/ProductDetail'
import Footer from './components/Footer'
import {
  PRODUCTS_CSV_URL,
  PRODUCTS_LOCAL_CSV_URL,
  VARIANTS_CSV_URL,
  VARIANTS_LOCAL_CSV_URL,
  extractProducts,
  extractVariants,
  mergeCatalog,
  buildCollections,
} from './utils/catalog'

const fetchCsv = async (primaryUrl: string, fallbackUrl?: string) => {
  const attempt = async (target: string) => {
    const response = await fetch(target, { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(`Failed to load ${target} (${response.status})`)
    }
    return response.text()
  }

  let lastError: unknown = null

  if (primaryUrl) {
    try {
      return await attempt(primaryUrl)
    } catch (error) {
      lastError = error
      if (!fallbackUrl) throw error
      console.warn(`Primary catalog source unavailable (${primaryUrl}); trying fallback.`, error)
    }
  }

  if (fallbackUrl) {
    try {
      return await attempt(fallbackUrl)
    } catch (error) {
      lastError = error
      console.error(`Fallback catalog source unavailable (${fallbackUrl}).`, error)
    }
  }

  if (lastError instanceof Error) {
    throw lastError
  }
  if (lastError) {
    throw new Error(String(lastError))
  }

  return ''
}

const normalizeCategory = (value: unknown) => {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : ''
}

const computeCategories = (items: Array<{ category?: string }>) => {
  const special = 'Fast Turn Category'
  const unique = new Set<string>()
  items.forEach((item) => {
    const category = normalizeCategory(item?.category)
    if (category) {
      unique.add(category)
    }
  })
  return Array.from(unique).sort((a, b) => {
    if (a === special) return -1
    if (b === special) return 1
    return a.localeCompare(b)
  })
}

const Showroom = () => {
  const [products, setProducts] = useState<any[]>([])
  const [collections, setCollections] = useState({ categories: [] as string[], imprints: [] as string[], tags: [] as string[] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [imprintFilter, setImprintFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<any>(null)

  const derivedCategories = useMemo(() => computeCategories(products), [products])
  const derivedCategoriesRef = useRef<string[]>(derivedCategories)

  useEffect(() => {
    derivedCategoriesRef.current = derivedCategories
  }, [derivedCategories])

  const displayCategories = useMemo(() => {
    if (collections.categories.length > 0) {
      return collections.categories
    }
    return derivedCategories
  }, [collections.categories, derivedCategories])

  useEffect(() => {
    if (selectedCategory && !displayCategories.includes(selectedCategory)) {
      setSelectedCategory('')
    }
  }, [displayCategories, selectedCategory])

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [productsCsv, variantsCsv] = await Promise.all([
          fetchCsv(PRODUCTS_CSV_URL, PRODUCTS_LOCAL_CSV_URL),
          fetchCsv(VARIANTS_CSV_URL, VARIANTS_LOCAL_CSV_URL).catch((err) => {
            console.warn('Variants CSV unavailable', err)
            return ''
          }),
        ])

        const productList = extractProducts(productsCsv)
        const variantList = extractVariants(variantsCsv)
        const enriched = mergeCatalog(productList, variantList)
        const builtCollections = buildCollections(enriched)
        const categoriesFromSheets =
          builtCollections.categories.length > 0
            ? builtCollections.categories
            : computeCategories(enriched)

        if (active) {
          setProducts(enriched)
          setCollections({
            categories: categoriesFromSheets,
            imprints: builtCollections.imprints,
            tags: builtCollections.tags,
          })
        }
      } catch (err) {
        if (active) {
          const message = err instanceof Error ? err.message : String(err)
          setError(message)
          setCollections((prev) => ({
            categories: prev.categories.length > 0 ? prev.categories : derivedCategoriesRef.current,
            imprints: prev.imprints ?? [],
            tags: prev.tags ?? [],
          }))
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
      if (selectedCategory && product.category !== selectedCategory) return false
      if (imprintFilter && !product.imprintMethods?.some((method: string) => method === imprintFilter)) return false
      if (tagFilter && !product.tags?.some((tag: string) => tag === tagFilter)) return false
      if (query && !product.searchTokens?.includes(query)) return false
      return true
    })
  }, [products, selectedCategory, imprintFilter, tagFilter, searchTerm])

  useEffect(() => {
    if (!selectedProduct) return
    const exists = filteredProducts.some((product) => product.key === selectedProduct.key)
    if (!exists) {
      setSelectedProduct(null)
    }
  }, [filteredProducts, selectedProduct])

  useEffect(() => {
    setSelectedProduct(null)
  }, [selectedCategory, imprintFilter, tagFilter])

  const totalCount = products.length

  return (
    <div className="flex min-h-screen flex-col bg-slate-50" id="top">
      <TopBar />
      <SiteHeader
        categories={displayCategories}
        activeCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
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
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-4 px-4 py-20 text-center text-slate-600">
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
            categoryOrder={displayCategories}
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

export default Showroom

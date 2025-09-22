import Papa from 'papaparse'

const PRODUCT_FIELD_HINTS = {
  id: ['Product ID', 'ID', 'Item ID', 'Handle', 'Slug', 'Key'],
  name: ['Name', 'Product Name', 'Title'],
  priceRange: ['Price Range', 'Price', 'Base Price', 'MSRP'],
  description: ['Description', 'Product Description', 'Details'],
  preview3DLink: ['3D Preview', 'Preview Link', 'Preview URL'],
  templateDownload: ['Template Download', 'Template', 'Spec Sheet'],
  thumbnail: ['Thumbnail Image', 'Thumbnail', 'Primary Image', 'Main Image'],
}

const VARIANT_FIELD_HINTS = {
  productKey: ['Product Handle', 'Product Key', 'Product ID', 'Handle', 'Product Name'],
  option: ['Variant Name', 'Variant', 'Option', 'Option Name', 'Name'],
  price: ['Price', 'Variant Price', 'Unit Price'],
  id: ['Variant ID', 'SKU', 'Code'],
}

const normalizeHeader = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

const makeKey = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')

const isNonEmpty = (value) => String(value ?? '').trim().length > 0

const splitList = (value) =>
  String(value ?? '')
    .split(/[\n;,|]/)
    .map((item) => item.trim())
    .filter(Boolean)

const parseMoney = (value) => {
  if (!isNonEmpty(value)) return null
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(numeric) ? numeric : null
}

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
})

const formatMoney = (value) =>
  Number.isFinite(value) ? moneyFormatter.format(value) : ''

const sanitizeUrl = (value) => {
  if (!isNonEmpty(value)) return null
  const trimmed = String(value).trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  if (trimmed.startsWith('/')) return trimmed
  if (trimmed.startsWith('./') || trimmed.startsWith('../')) return trimmed
  return null
}

const buildHeaderIndex = (row) => {
  const index = new Map()
  Object.keys(row || {}).forEach((header) => {
    const normalized = normalizeHeader(header)
    if (!normalized) return
    if (!index.has(normalized)) {
      index.set(normalized, [])
    }
    index.get(normalized).push(header)
  })
  return index
}

const pickValue = (row, hints, headerIndex) => {
  if (!row) return ''
  for (const hint of hints) {
    const key = normalizeHeader(hint)
    if (key && headerIndex.has(key)) {
      const headers = headerIndex.get(key)
      for (const header of headers) {
        const value = row[header]
        if (isNonEmpty(value)) return String(value).trim()
      }
    }
  }
  for (const hint of hints) {
    const key = normalizeHeader(hint)
    if (!key) continue
    for (const [normalized, headers] of headerIndex.entries()) {
      if (!normalized.includes(key)) continue
      for (const header of headers) {
        const value = row[header]
        if (isNonEmpty(value)) return String(value).trim()
      }
    }
  }
  return ''
}

const gatherGallery = (row) => {
  const images = []
  Object.entries(row || {}).forEach(([header, value]) => {
    if (!isNonEmpty(value)) return
    const normalized = normalizeHeader(header)
    if (normalized.includes('gallery') || normalized.includes('image') || normalized.includes('photo')) {
      splitList(value).forEach((item) => {
        const url = sanitizeUrl(item)
        if (url) images.push(url)
      })
    }
  })
  const unique = Array.from(new Set(images))
  return unique
}

const parseCsvRecords = (csvText) => {
  if (!isNonEmpty(csvText)) return []
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  })
  return parsed.data.map((row) => row)
}

const normalizeProducts = (csvText) => {
  const rows = parseCsvRecords(csvText)
  return rows
    .map((row, index) => {
      const headerIndex = buildHeaderIndex(row)
      const name = pickValue(row, PRODUCT_FIELD_HINTS.name, headerIndex)
      if (!isNonEmpty(name)) return null

      const idSource =
        pickValue(row, PRODUCT_FIELD_HINTS.id, headerIndex) ||
        pickValue(row, PRODUCT_FIELD_HINTS.name, headerIndex) ||
        `product-${index}`

      const key = makeKey(idSource)
      const description = pickValue(row, PRODUCT_FIELD_HINTS.description, headerIndex)
      const priceCandidate = pickValue(row, PRODUCT_FIELD_HINTS.priceRange, headerIndex)
      const basePrice = parseMoney(priceCandidate)
      const priceRange = priceCandidate
        ? basePrice !== null && /^\d+(\.\d+)?$/.test(priceCandidate.trim())
          ? formatMoney(basePrice)
          : priceCandidate.trim()
        : ''
      const thumbnailUrl = sanitizeUrl(pickValue(row, PRODUCT_FIELD_HINTS.thumbnail, headerIndex))
      const galleryUrls = gatherGallery(row)
      if (thumbnailUrl) {
        const idx = galleryUrls.indexOf(thumbnailUrl)
        if (idx !== -1) {
          galleryUrls.splice(idx, 1)
        }
      }

      const preview3DLink = sanitizeUrl(pickValue(row, PRODUCT_FIELD_HINTS.preview3DLink, headerIndex))
      const templateDownload = sanitizeUrl(pickValue(row, PRODUCT_FIELD_HINTS.templateDownload, headerIndex))

      const numericBasePrice = basePrice !== null ? basePrice : null

      return {
        id: key || `product-${index}`,
        key: key || `product-${index}`,
        name: name.trim(),
        priceRange: priceRange ? priceRange : null,
        description: isNonEmpty(description) ? description : null,
        preview3DLink,
        templateDownload,
        thumbnailUrl: thumbnailUrl || null,
        galleryUrls,
        variants: [],
        priceNumbers: numericBasePrice !== null ? [numericBasePrice] : [],
      }
    })
    .filter(Boolean)
}

const normalizeVariants = (csvText) => {
  const rows = parseCsvRecords(csvText)
  const map = new Map()

  rows.forEach((row) => {
    const headerIndex = buildHeaderIndex(row)
    const productKeySource = pickValue(row, VARIANT_FIELD_HINTS.productKey, headerIndex)
    if (!isNonEmpty(productKeySource)) return
    const productKey = makeKey(productKeySource)
    if (!productKey) return

    const option = pickValue(row, VARIANT_FIELD_HINTS.option, headerIndex) || 'Variant'
    const priceRaw = pickValue(row, VARIANT_FIELD_HINTS.price, headerIndex)
    const priceValue = parseMoney(priceRaw)
    const priceLabel = priceValue !== null ? formatMoney(priceValue) : priceRaw.trim()

    const variantId = pickValue(row, VARIANT_FIELD_HINTS.id, headerIndex)

    const excludedHeaders = new Set()
    Object.values(VARIANT_FIELD_HINTS).forEach((hints) => {
      hints.forEach((hint) => excludedHeaders.add(normalizeHeader(hint)))
    })

    const columns = {}
    Object.entries(row || {}).forEach(([header, value]) => {
      if (!isNonEmpty(value)) return
      const normalized = normalizeHeader(header)
      if (!header.trim()) return
      if (excludedHeaders.has(normalized)) return
      columns[header.trim()] = String(value).trim()
    })

    if (!map.has(productKey)) {
      map.set(productKey, [])
    }

    map.get(productKey).push({
      id: isNonEmpty(variantId) ? variantId : null,
      option: option.trim(),
      price: isNonEmpty(priceLabel) ? priceLabel : null,
      priceValue: priceValue !== null ? priceValue : null,
      columns,
    })
  })

  map.forEach((variants) => {
    variants.sort((a, b) => a.option.localeCompare(b.option, undefined, { numeric: true }))
  })

  return map
}

const mergeCatalog = (products, variantsMap) => {
  const merged = products.map((product) => {
    const variants = variantsMap.get(product.key) || []
    const priceNumbers = [...product.priceNumbers]

    variants.forEach((variant) => {
      if (Number.isFinite(variant.priceValue)) {
        priceNumbers.push(variant.priceValue)
      }
    })

    let priceRange = product.priceRange
    if (!priceRange && priceNumbers.length) {
      const min = Math.min(...priceNumbers)
      const max = Math.max(...priceNumbers)
      priceRange = min === max ? formatMoney(min) : `${formatMoney(min)} – ${formatMoney(max)}`
    }

    return {
      id: product.id,
      name: product.name,
      priceRange: priceRange || null,
      description: product.description,
      preview3DLink: product.preview3DLink,
      templateDownload: product.templateDownload,
      thumbnailUrl: product.thumbnailUrl,
      galleryUrls: product.galleryUrls,
      variants,
    }
  })

  merged.sort((a, b) => a.name.localeCompare(b.name))
  return merged
}

const fetchFromSources = async (sources, label) => {
  let lastError = null
  for (const source of sources) {
    if (!source) continue
    try {
      const response = await fetch(source, { cache: 'no-store' })
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }
      const text = await response.text()
      if (!isNonEmpty(text)) {
        throw new Error('Response was empty')
      }
      return text
    } catch (error) {
      console.error(`Failed to load ${label} from ${source}`, error)
      lastError = error
    }
  }
  if (lastError) throw lastError
  throw new Error(`No sources available for ${label}`)
}

export const loadCatalog = async () => {
  const base = import.meta.env.BASE_URL || '/'
  const productSources = []
  if (import.meta.env.VITE_PRODUCTS_CSV_URL) {
    productSources.push(import.meta.env.VITE_PRODUCTS_CSV_URL)
  }
  productSources.push(`${base}data/products.csv`)

  const variantSources = []
  if (import.meta.env.VITE_VARIANTS_CSV_URL) {
    variantSources.push(import.meta.env.VITE_VARIANTS_CSV_URL)
  }
  variantSources.push(`${base}data/variants.csv`)

  const productsCsv = await fetchFromSources(productSources, 'product catalog')
  let variantsCsv = ''
  try {
    variantsCsv = await fetchFromSources(variantSources, 'variant catalog')
  } catch (error) {
    console.warn('Variant data unavailable, continuing without variants.', error)
  }

  const products = normalizeProducts(productsCsv)
  const variants = normalizeVariants(variantsCsv)
  const merged = mergeCatalog(products, variants)

  if (!merged.length) {
    throw new Error('No products were found in the catalog data.')
  }

  return merged
}


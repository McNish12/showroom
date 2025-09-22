import Papa from 'papaparse'

export const PRODUCTS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRU7hseo3Sa3Y5oTSb5fIjItVIC8JKW0lJdRFK4bCpxQJHfz9nTQjSXrh2Bhkx5J5gG69PO4IRUYIg0/pub?gid=653601520&single=true&output=csv'
export const VARIANTS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRU7hseo3Sa3Y5oTSb5fIjItVIC8JKW0lJdRFK4bCpxQJHfz9nTQjSXrh2Bhkx5J5gG69PO4IRUYIg0/pub?gid=140795318&single=true&output=csv'

const normalizeHeader = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

const makeKey = (value) => String(value || '').trim().toLowerCase()

const isNonEmpty = (value) => String(value ?? '').trim().length > 0

const splitList = (value) =>
  String(value || '')
    .split(/[\n;,|]/)
    .map((item) => item.trim())
    .filter(Boolean)

const toMoney = (value) => {
  if (!isNonEmpty(value)) return null
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(numeric) ? numeric : null
}

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
})

const formatMoney = (value) => (Number.isFinite(value) ? moneyFormatter.format(value) : '')

const PRODUCT_HINTS = {
  id: ['Product ID', 'ProductId', 'Item ID', 'ItemId', 'Internal ID', 'Guid', 'Handle'],
  name: ['Name', 'Product Name', 'Item Name', 'Title'],
  description: ['Description', 'Product Description', 'Long Description', 'Details'],
  vendor: ['Vendor', 'Brand', 'Manufacturer', 'Supplier'],
  category: ['Category', 'Department', 'Collection'],
  price: ['Price 1', 'Price', 'Default Price', 'Base Price', 'Retail Price'],
  tags: ['Tags', 'Tag', 'Keywords', 'Collections'],
  imprint: ['Imprint Methods', 'Imprint Method', 'Decoration', 'Decoration Methods'],
  preview: ['Preview', 'Preview URL', '3D Preview', 'Preview Link'],
  thumbnail: ['Thumbnail', 'Thumb', 'Primary Image'],
  image: ['Image', 'Image URL', 'Hero Image', 'Main Image'],
  status: ['Status', 'Approved', 'Active', 'Enabled'],
}

const VARIANT_HINTS = {
  id: ['Variant ID', 'VariantId', 'Variation ID', 'Variant Guid'],
  productId: ['Product ID', 'ProductId', 'Item ID', 'ItemId', 'Product Guid'],
  productName: ['Product Name', 'Item Name', 'Menu Item'],
  name: ['Variant Name', 'Variation Name', 'Name', 'Option'],
  sku: ['Variant SKU', 'SKU', 'Item SKU', 'Code'],
  price: ['Price', 'Variant Price', 'Price 1', 'Retail Price', 'Default Price'],
  option1: ['Option 1', 'Option1', 'Attribute 1', 'Attribute1', 'Choice 1'],
  option2: ['Option 2', 'Option2', 'Attribute 2', 'Attribute2', 'Choice 2'],
  option3: ['Option 3', 'Option3', 'Attribute 3', 'Attribute3', 'Choice 3'],
}

const parseTable = (csvText) => {
  if (!isNonEmpty(csvText)) return []
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  })

  const headers = parsed.meta.fields || []

  return parsed.data.map((row) => {
    const normalized = {}
    headers.forEach((header) => {
      const key = normalizeHeader(header)
      if (!key) return
      normalized[key] = row[header] ?? ''
    })
    return { original: row, normalized }
  })
}

const pick = (row, hints) => {
  if (!row) return ''
  for (const hint of hints) {
    const key = normalizeHeader(hint)
    if (key && key in row.normalized) {
      const value = row.normalized[key]
      if (isNonEmpty(value)) return String(value).trim()
    }
  }
  for (const hint of hints) {
    const key = normalizeHeader(hint)
    if (!key) continue
    const match = Object.entries(row.normalized).find(
      ([candidate, value]) => candidate.includes(key) && isNonEmpty(value),
    )
    if (match) return String(match[1]).trim()
  }
  for (const hint of hints) {
    const key = normalizeHeader(hint)
    if (!key) continue
    const match = Object.entries(row.original).find(
      ([header, value]) => normalizeHeader(header).includes(key) && isNonEmpty(value),
    )
    if (match) return String(match[1]).trim()
  }
  return ''
}

const gatherValues = (row, matcher) => {
  const values = []
  Object.entries(row.original).forEach(([header, value]) => {
    if (!isNonEmpty(value)) return
    const normalized = normalizeHeader(header)
    if (matcher(normalized)) {
      splitList(value).forEach((item) => values.push(item))
    }
  })
  return Array.from(new Set(values.filter(Boolean)))
}

const deriveGallery = (row) =>
  gatherValues(row, (key) =>
    key.includes('image') || key.includes('photo') || key.includes('gallery'),
  )

const deriveImprintMethods = (row) => {
  const explicit = pick(row, PRODUCT_HINTS.imprint)
  const values = []
  if (explicit) values.push(...splitList(explicit))
  values.push(
    ...gatherValues(row, (key) =>
      key.includes('imprint') || key.includes('decoration') || key.includes('printmethod'),
    ),
  )
  return Array.from(new Set(values.filter(Boolean)))
}

const deriveTags = (row) => {
  const explicit = pick(row, PRODUCT_HINTS.tags)
  const values = []
  if (explicit) values.push(...splitList(explicit))
  values.push(...gatherValues(row, (key) => key.includes('tag') || key.includes('keyword')))
  return Array.from(new Set(values.filter(Boolean)))
}

const isApproved = (row) => {
  const status = pick(row, PRODUCT_HINTS.status)
  if (!status) return true
  const value = status.trim().toLowerCase()
  if (!value) return true
  return ['approved', 'active', 'yes', 'true', '1', 'show', 'enabled'].some((token) =>
    value.includes(token),
  )
}

export const extractProducts = (csvText) => {
  const table = parseTable(csvText)
  return table
    .map((row) => {
      if (!isApproved(row)) return null
      const name = pick(row, PRODUCT_HINTS.name)
      if (!name) return null
      const id = pick(row, PRODUCT_HINTS.id)
      const keySource = id || name
      const key = makeKey(keySource)
      if (!key) return null

      const gallery = deriveGallery(row)
      const thumbnail =
        pick(row, PRODUCT_HINTS.thumbnail) || pick(row, PRODUCT_HINTS.image) || gallery[0] || ''

      return {
        key,
        id,
        name,
        category: pick(row, PRODUCT_HINTS.category),
        vendor: pick(row, PRODUCT_HINTS.vendor),
        description: pick(row, PRODUCT_HINTS.description),
        basePrice: toMoney(pick(row, PRODUCT_HINTS.price)),
        previewUrl: pick(row, PRODUCT_HINTS.preview),
        imprintMethods: deriveImprintMethods(row),
        tags: deriveTags(row),
        gallery,
        thumbnailUrl: thumbnail,
        searchTokens: '',
        variants: [],
      }
    })
    .filter(Boolean)
}

export const extractVariants = (csvText) => {
  const table = parseTable(csvText)
  return table
    .map((row) => {
      const productId = pick(row, VARIANT_HINTS.productId)
      const productName = pick(row, VARIANT_HINTS.productName)
      const productKeySource = productId || productName
      const productKey = makeKey(productKeySource)

      const name = pick(row, VARIANT_HINTS.name)
      const options = [
        pick(row, VARIANT_HINTS.option1),
        pick(row, VARIANT_HINTS.option2),
        pick(row, VARIANT_HINTS.option3),
      ].filter(Boolean)

      const sku = pick(row, VARIANT_HINTS.sku)
      const price = toMoney(pick(row, VARIANT_HINTS.price))

      if (!productKey && !name && !options.length && !sku) return null

      return {
        id: pick(row, VARIANT_HINTS.id),
        name,
        sku,
        productKey,
        options,
        price,
      }
    })
    .filter(Boolean)
}

export const mergeCatalog = (products, variants) => {
  const map = new Map()
  products.forEach((product) => {
    map.set(product.key, product)
  })

  variants.forEach((variant) => {
    const product = map.get(variant.productKey)
    if (!product) return
    const descriptor = []
    if (variant.name) descriptor.push(variant.name)
    if (variant.options.length) {
      const optionLabel = variant.options.join(' / ')
      if (!descriptor.includes(optionLabel)) descriptor.push(optionLabel)
    }
    if (!descriptor.length && variant.sku) descriptor.push(`SKU ${variant.sku}`)
    if (!descriptor.length && variant.id) descriptor.push(variant.id)

    const priceDisplay = formatMoney(variant.price)

    product.variants.push({
      ...variant,
      displayName: descriptor.filter(Boolean).join(' — ') || 'Variant',
      priceDisplay,
    })
  })

  products.forEach((product) => {
    const pricePoints = []
    if (Number.isFinite(product.basePrice)) pricePoints.push(product.basePrice)
    product.variants.forEach((variant) => {
      if (Number.isFinite(variant.price)) pricePoints.push(variant.price)
    })

    if (pricePoints.length) {
      const min = Math.min(...pricePoints)
      const max = Math.max(...pricePoints)
      product.priceDisplay =
        min === max ? formatMoney(min) : `${formatMoney(min)} – ${formatMoney(max)}`
    } else {
      product.priceDisplay = ''
    }

    const tokens = [
      product.name,
      product.category,
      product.vendor,
      product.description,
      product.tags.join(' '),
      product.imprintMethods.join(' '),
      product.variants.map((variant) => `${variant.displayName} ${variant.sku || ''}`).join(' '),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    product.searchTokens = tokens
  })

  return products
}

export const buildCollections = (products) => {
  const categorySet = new Set()
  const imprintSet = new Set()
  const tagSet = new Set()

  products.forEach((product) => {
    if (product.category) categorySet.add(product.category)
    product.imprintMethods.forEach((value) => imprintSet.add(value))
    product.tags.forEach((value) => tagSet.add(value))
  })

  const categories = Array.from(categorySet).sort((a, b) => {
    const special = 'Fast Turn Category'
    if (a === special) return -1
    if (b === special) return 1
    return a.localeCompare(b)
  })

  const imprints = Array.from(imprintSet).sort((a, b) => a.localeCompare(b))
  const tags = Array.from(tagSet).sort((a, b) => a.localeCompare(b))

  return { categories, imprints, tags }
}

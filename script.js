/***** Data source URLs *****/
const PRODUCTS_CSV_URL = window.PRODUCTS_CSV || window.SHEET_CSV || "";
const VARIANTS_CSV_URL = window.VARIANTS_CSV || "";
const MODIFIERS_CSV_URL = window.MODIFIERS_CSV || "";

/***** CSV helpers *****/
function smartSplit(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    const n = line[i + 1];
    if (c === '"' && n === '"') {
      cur += '"';
      i++;
      continue;
    }
    if (c === '"') {
      inQ = !inQ;
      continue;
    }
    if (c === ',' && !inQ) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out;
}

const stripQ = (s) => s.replace(/^"(.*)"$/, "$1");

const normalizeHeader = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const makeKey = (value) => String(value || "").trim().toLowerCase();

const isNonEmpty = (value) => String(value || "").trim().length > 0;

function parseCSV(csv) {
  if (!csv) return { headers: [], rows: [] };
  const lines = csv.replace(/\r/g, "").split("\n");
  while (lines.length && !lines[0].trim()) lines.shift();
  if (!lines.length) return { headers: [], rows: [] };

  const headerLine = lines.shift();
  const headers = smartSplit(headerLine).map((h) => stripQ(h.trim()));
  const normalizedHeaders = headers.map((h) => normalizeHeader(h));

  const rows = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const cells = smartSplit(line).map((c) => stripQ(c.trim()));
      const original = {};
      const normalized = {};
      headers.forEach((header, idx) => {
        const value = cells[idx] ?? "";
        original[header] = value;
        normalized[normalizedHeaders[idx]] = value;
      });
      return { original, normalized };
    });

  return { headers, rows };
}

function pick(row, hints) {
  if (!row) return "";
  for (const hint of hints) {
    const key = normalizeHeader(hint);
    if (key && key in row.normalized) {
      const value = row.normalized[key];
      if (isNonEmpty(value)) return value;
    }
  }
  for (const hint of hints) {
    const key = normalizeHeader(hint);
    if (!key) continue;
    const match = Object.entries(row.normalized).find(
      ([candidate, value]) => candidate.includes(key) && isNonEmpty(value)
    );
    if (match) return match[1];
  }
  for (const hint of hints) {
    const key = normalizeHeader(hint);
    if (!key) continue;
    const match = Object.entries(row.original).find(
      ([header, value]) => normalizeHeader(header).includes(key) && isNonEmpty(value)
    );
    if (match) return match[1];
  }
  return "";
}

function splitList(value) {
  if (!isNonEmpty(value)) return [];
  return String(value)
    .split(/[,;\|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/***** Coercions *****/
function toMoney(v) {
  if (!v) return null;
  const n = Number(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function formatMoney(value) {
  if (!Number.isFinite(value)) return "";
  return `$${value.toFixed(2)}`;
}

/***** Field hints *****/
const PRODUCT_HINTS = {
  id: [
    "Product ID",
    "ProductId",
    "Item ID",
    "ItemId",
    "Internal ID",
    "Guid",
    "Handle",
    "Product Guid",
  ],
  name: [
    "Name",
    "Product Name",
    "Item Name",
    "Menu Item",
    "Menu Item Name",
    "Title",
  ],
  description: [
    "Description",
    "Product Description",
    "Long Description",
    "Item Description",
    "Desc",
    "Details",
  ],
  vendor: ["Vendor", "Brand", "Manufacturer", "Supplier"],
  category: ["Category", "Department", "Class", "Menu Category", "Collection"],
  price: ["Price 1", "Price", "Default Price", "Base Price", "Retail Price"],
  imageUrl: ["Image", "Image URL", "Image Link", "Image Src", "Photo"],
  sku: ["SKU", "Product SKU", "Item SKU", "Code", "PLU"],
  tags: ["Tags", "Tag", "Keywords", "Collections"],
};

const VARIANT_HINTS = {
  id: [
    "Variant ID",
    "VariantId",
    "Item Variant ID",
    "Item Variation ID",
    "Variation ID",
    "Variant Guid",
  ],
  productId: [
    "Product ID",
    "ProductId",
    "Item ID",
    "ItemId",
    "Menu Item ID",
    "Product Guid",
    "Item Guid",
  ],
  productName: ["Product Name", "Item Name", "Menu Item", "Parent Name", "Product"],
  name: [
    "Variant Name",
    "Variation Name",
    "Name",
    "Option",
    "Option Name",
    "Title",
  ],
  sku: ["Variant SKU", "SKU", "Item SKU", "Code", "PLU"],
  barcode: ["Barcode", "UPC", "EAN", "GTIN"],
  price: ["Price", "Variant Price", "Price 1", "Retail Price", "Default Price"],
  option1: ["Option 1", "Option1", "Attribute 1", "Attribute1", "Choice 1"],
  option2: ["Option 2", "Option2", "Attribute 2", "Attribute2", "Choice 2"],
  option3: ["Option 3", "Option3", "Attribute 3", "Attribute3", "Choice 3"],
};

const MODIFIER_HINTS = {
  productId: ["Product ID", "ProductId", "Item ID", "ItemId", "Menu Item ID"],
  productName: ["Product Name", "Item Name", "Menu Item", "Parent Name"],
  variantId: ["Variant ID", "VariantId", "Item Variant ID", "Item Variation ID"],
  variantName: ["Variant Name", "Variant", "Variation Name", "Option Name"],
  group: ["Modifier Set Name", "Modifier Group", "Modifier Set", "Group Name", "Group"],
  name: ["Modifier Name", "Name", "Option Name", "Option", "Modifier Option"],
  price: ["Modifier Price", "Price", "Upcharge", "Price Delta", "Cost"],
};

/***** Data extraction *****/
function extractProducts(table) {
  return table.rows
    .map((row) => {
      const name = pick(row, PRODUCT_HINTS.name).trim();
      if (!name) return null;
      const id = pick(row, PRODUCT_HINTS.id).trim();
      const keySource = id || name;
      const key = makeKey(keySource);
      if (!key) return null;
      return {
        key,
        keySource,
        id,
        name,
        description: pick(row, PRODUCT_HINTS.description),
        vendor: pick(row, PRODUCT_HINTS.vendor),
        category: pick(row, PRODUCT_HINTS.category),
        price: toMoney(pick(row, PRODUCT_HINTS.price)),
        imageUrl: pick(row, PRODUCT_HINTS.imageUrl),
        sku: pick(row, PRODUCT_HINTS.sku),
        tags: splitList(pick(row, PRODUCT_HINTS.tags)),
      };
    })
    .filter(Boolean);
}

function extractVariants(table) {
  return table.rows
    .map((row) => {
      const productId = pick(row, VARIANT_HINTS.productId).trim();
      const productName = pick(row, VARIANT_HINTS.productName).trim();
      const productKeySource = productId || productName;
      const productKey = makeKey(productKeySource);
      const id = pick(row, VARIANT_HINTS.id).trim();
      const name = pick(row, VARIANT_HINTS.name).trim();
      const options = [
        pick(row, VARIANT_HINTS.option1).trim(),
        pick(row, VARIANT_HINTS.option2).trim(),
        pick(row, VARIANT_HINTS.option3).trim(),
      ].filter(Boolean);

      if (!productKey && !id && !name && !options.length) return null;

      const variant = {
        id,
        name,
        productKey,
        productKeySource,
        sku: pick(row, VARIANT_HINTS.sku).trim(),
        barcode: pick(row, VARIANT_HINTS.barcode).trim(),
        price: toMoney(pick(row, VARIANT_HINTS.price)),
        options,
      };

      if (!variant.name && variant.options.length) {
        variant.name = variant.options.join(" / ");
      }

      if (!variant.productKey && productName) {
        variant.productKey = makeKey(productName);
      }

      const variantKeySource = id || variant.sku || variant.name || productKeySource;
      variant.variantKey = makeKey(variantKeySource);
      return variant;
    })
    .filter(Boolean);
}

function buildVariantIndex(variants) {
  const index = new Map();
  variants.forEach((variant) => {
    if (!variant.productKey) return;
    const keys = [variant.variantKey, variant.id, variant.sku, variant.name];
    keys
      .map((k) => makeKey(k))
      .filter((key) => key.length)
      .forEach((key) => {
        if (!index.has(key)) index.set(key, variant.productKey);
      });
  });
  return index;
}

function extractModifiers(table, variantIndex) {
  return table.rows
    .map((row) => {
      const productId = pick(row, MODIFIER_HINTS.productId).trim();
      const productName = pick(row, MODIFIER_HINTS.productName).trim();
      let productKey = makeKey(productId || productName);

      const variantIdRaw = pick(row, MODIFIER_HINTS.variantId).trim();
      const variantName = pick(row, MODIFIER_HINTS.variantName).trim();

      if (!productKey && variantIdRaw) {
        const mapped = variantIndex.get(makeKey(variantIdRaw));
        if (mapped) productKey = mapped;
      }

      if (!productKey && variantName) {
        const mapped = variantIndex.get(makeKey(variantName));
        if (mapped) productKey = mapped;
      }

      const group = pick(row, MODIFIER_HINTS.group).trim();
      const name = pick(row, MODIFIER_HINTS.name).trim();
      const price = toMoney(pick(row, MODIFIER_HINTS.price));

      if (!productKey && !group && !name && !variantName) return null;

      if (!productKey && productName) {
        productKey = makeKey(productName);
      }

      return {
        productKey,
        productName,
        variantId: makeKey(variantIdRaw),
        variantName,
        group,
        name,
        price,
      };
    })
    .filter(Boolean);
}

function groupByProduct(items) {
  const map = new Map();
  items.forEach((item) => {
    const key = makeKey(item.productKey);
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  });
  return map;
}

function enrichVariants(variants) {
  variants.forEach((variant) => {
    const parts = [];
    if (variant.name) parts.push(variant.name);
    if (variant.options && variant.options.length) {
      const opt = variant.options.join(" / ");
      if (!parts.includes(opt)) parts.push(opt);
    }
    if (!parts.length && variant.sku) parts.push(`SKU ${variant.sku}`);
    if (!parts.length && variant.id) parts.push(variant.id);
    variant.displayLabel = parts.filter(Boolean).join(" — ") || "Variant";
    variant.displayPrice = Number.isFinite(variant.price)
      ? formatMoney(variant.price)
      : "";
  });
}

function enrichModifiers(modifiers) {
  modifiers.forEach((modifier) => {
    const parts = [];
    if (modifier.group) parts.push(modifier.group);
    if (modifier.name) parts.push(modifier.name);
    else if (modifier.variantName) parts.push(modifier.variantName);
    modifier.displayLabel = parts.filter(Boolean).join(" • ") || modifier.name || modifier.variantName || "Modifier";
    modifier.displayPrice = Number.isFinite(modifier.price)
      ? formatMoney(modifier.price)
      : "";
  });
}

function buildPriceText(basePrice, variants) {
  const prices = [];
  if (Number.isFinite(basePrice)) prices.push(basePrice);
  variants.forEach((variant) => {
    if (Number.isFinite(variant.price)) prices.push(variant.price);
  });
  if (!prices.length) return "";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatMoney(min) : `${formatMoney(min)} – ${formatMoney(max)}`;
}

/***** DOM *****/
const grid = document.getElementById("grid");

function createSection(title, items, limit = 6) {
  if (!items.length) return null;
  const section = document.createElement("div");
  section.className = "card-section";

  const heading = document.createElement("h3");
  heading.textContent = title;
  section.appendChild(heading);

  const list = document.createElement("ul");
  list.className = "card-list";

  items.slice(0, limit).forEach((item) => {
    const li = document.createElement("li");
    li.className = "card-list-item";

    const label = document.createElement("span");
    label.className = "card-list-label";
    label.textContent = item.displayLabel || "";
    li.appendChild(label);

    if (item.displayPrice) {
      const price = document.createElement("span");
      price.className = "price";
      price.textContent = item.displayPrice;
      li.appendChild(price);
    }

    list.appendChild(li);
  });

  if (items.length > limit) {
    const li = document.createElement("li");
    li.className = "card-list-item muted";
    li.textContent = `+${items.length - limit} more`;
    list.appendChild(li);
  }

  section.appendChild(list);
  return section;
}

function render(products) {
  grid.innerHTML = "";
  if (!products.length) {
    const div = document.createElement("div");
    div.className = "empty";
    div.textContent = "No items.";
    grid.appendChild(div);
    return;
  }

  const frag = document.createDocumentFragment();

  products.forEach((product) => {
    const card = document.createElement("article");
    card.className = "card";

    const img = document.createElement("img");
    img.className = "card-img";
    img.loading = "lazy";
    if (product.imageUrl) {
      img.src = product.imageUrl;
    } else {
      img.src = "";
    }
    img.alt = product.name ? `${product.name} image` : "Product image";
    card.appendChild(img);

    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("h2");
    title.className = "card-title";
    title.textContent = product.name || "Unnamed Item";
    body.appendChild(title);

    const subParts = [];
    if (product.vendor) subParts.push(product.vendor);
    if (product.category) subParts.push(product.category);
    if (subParts.length) {
      const sub = document.createElement("p");
      sub.className = "card-sub";
      sub.textContent = subParts.join(" • ");
      body.appendChild(sub);
    }

    if (product.priceText) {
      const price = document.createElement("div");
      price.className = "price";
      price.textContent = product.priceText;
      body.appendChild(price);
    }

    if (isNonEmpty(product.description)) {
      const desc = document.createElement("p");
      desc.className = "card-desc";
      desc.textContent = product.description;
      body.appendChild(desc);
    }

    const metaBadges = [];
    if (product.sku) metaBadges.push(`SKU ${product.sku}`);
    if (product.id && product.id !== product.sku) metaBadges.push(`ID ${product.id}`);
    product.tags.forEach((tag) => metaBadges.push(tag));
    if (product.variantCount) metaBadges.push(`${product.variantCount} variant${product.variantCount === 1 ? "" : "s"}`);
    if (product.modifierCount)
      metaBadges.push(`${product.modifierCount} modifier${product.modifierCount === 1 ? "" : "s"}`);

    if (metaBadges.length) {
      const meta = document.createElement("div");
      meta.className = "card-meta";
      metaBadges.forEach((text) => {
        const span = document.createElement("span");
        span.className = "badge";
        span.textContent = text;
        meta.appendChild(span);
      });
      body.appendChild(meta);
    }

    const variantSection = createSection("Variants", product.variants || []);
    if (variantSection) body.appendChild(variantSection);

    const modifierSection = createSection("Modifiers", product.modifiers || []);
    if (modifierSection) body.appendChild(modifierSection);

    card.appendChild(body);
    frag.appendChild(card);
  });

  grid.appendChild(frag);
}

/***** Data load *****/
async function fetchCsv(url, { optional = false } = {}) {
  if (!url) return "";
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const error = new Error(`Fetch failed (${res.status}) for ${url}`);
    if (optional) {
      console.warn(error.message);
      return "";
    }
    throw error;
  }
  return await res.text();
}

async function loadData() {
  try {
    const [productsCsv, variantsCsv, modifiersCsv] = await Promise.all([
      fetchCsv(PRODUCTS_CSV_URL),
      fetchCsv(VARIANTS_CSV_URL, { optional: true }),
      fetchCsv(MODIFIERS_CSV_URL, { optional: true }),
    ]);

    const productsTable = parseCSV(productsCsv);
    const variantsTable = parseCSV(variantsCsv);
    const modifiersTable = parseCSV(modifiersCsv);

    const products = extractProducts(productsTable);
    const variants = extractVariants(variantsTable);
    const variantIndex = buildVariantIndex(variants);
    const modifiers = extractModifiers(modifiersTable, variantIndex);

    const variantsByProduct = groupByProduct(variants);
    const modifiersByProduct = groupByProduct(modifiers);

    const enriched = products.map((product) => {
      const productVariants = variantsByProduct.get(product.key) || [];
      const productModifiers = modifiersByProduct.get(product.key) || [];
      enrichVariants(productVariants);
      enrichModifiers(productModifiers);

      return {
        ...product,
        priceText: buildPriceText(product.price, productVariants),
        variants: productVariants,
        modifiers: productModifiers,
        variantCount: productVariants.length,
        modifierCount: productModifiers.length,
      };
    });

    render(enriched);
  } catch (e) {
    console.error(e);
    grid.innerHTML = `<div class="empty">There was a problem loading the catalog.</div>`;
  }
}

loadData();

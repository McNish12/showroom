/***** CONFIG: Map your actual Sheet headers (no renames required) *****/
const COLUMN_MAP = {
  // Example guesses — change the right-hand side to your exact header text
  name:              "Name",               // e.g., "Name" or "Product Name"
  sku:               "SKU",                // e.g., "SKU"
  vendor:            "SUPPLIER",           // e.g., "SUPPLIER" or "Vendor"
  imageUrl:          "imageUrl",           // e.g., "imageUrl" or "Image URL"
  pricePrimary:      "Price 1",            // e.g., "Price 1"
  priceSecondary:    "Price 2",            // e.g., "Price 2" (optional)
  lessThanCasePrice: "lessThanCasePrice",  // optional
  caseQuantity:      "caseQuantity",       // optional
  category:          "category",           // optional (for the filter)
  description:       "Description",        // optional (if you have one)
  productUrl:        "productUrl"          // optional (button link)
};

/***** CSV fetch + robust parsing (quotes/commas) *****/
function parseCSV(csv) {
  const lines = csv.replace(/\r/g, "").split("\n").filter(Boolean);
  const headerRow = smartSplit(lines.shift());
  const headers = headerRow.map(h => stripQuotes(h.trim()));
  const rows = lines.map(line => {
    const cells = smartSplit(line).map(c => stripQuotes(c.trim()));
    return Object.fromEntries(headers.map((h,i) => [h, cells[i] ?? ""]));
  });
  return { headers, rows };
}
function smartSplit(line) {
  const out = []; let cur = "", inQ = false;
  for (let i=0;i<line.length;i++){
    const c = line[i], n = line[i+1];
    if (c === '"' && n === '"'){ cur += '"'; i++; continue; }
    if (c === '"'){ inQ = !inQ; continue; }
    if (c === ',' && !inQ){ out.push(cur); cur=""; continue; }
    cur += c;
  }
  out.push(cur);
  return out;
}
const stripQuotes = s => s.replace(/^"(.*)"$/, "$1");

/***** DOM refs *****/
const dom = {
  grid: document.getElementById("grid"),
  search: document.getElementById("search"),
  category: document.getElementById("category"),
  sort: document.getElementById("sort"),
  tpl: document.getElementById("card-tpl")
};

let DATA = [];
let HEADER_INDEX = {};

/***** Helper: create index from headers + mapping *****/
function buildHeaderIndex(headers) {
  const dict = Object.create(null);
  headers.forEach((h, i) => { dict[h] = i; });
  const index = {};
  Object.entries(COLUMN_MAP).forEach(([key, headerName]) => {
    if (headerName && dict[headerName] != null) {
      index[key] = dict[headerName];
    } else {
      console.warn(`Missing header for mapping "${key}" → "${headerName}". Detected headers:`, headers);
    }
  });
  return index;
}

/***** Coercions *****/
const toNumber = v => {
  if (!v) return null;
  const clean = String(v).replace(/[^0-9.\-]/g, "");
  const n = Number(clean);
  return Number.isFinite(n) ? n : null;
};

/***** Row → canonical object (uses HEADER_INDEX positions) *****/
function toObj(cells) {
  const get = key => {
    const idx = HEADER_INDEX[key];
    return idx == null ? "" : (cells[idx] ?? "");
  };
  return {
    name: get("name") || get("sku") || "Unnamed Item",
    sku: get("sku"),
    vendor: get("vendor"),
    imageUrl: get("imageUrl"),
    description: get("description"),
    productUrl: get("productUrl"),
    category: get("category"),
    price: toNumber(get("pricePrimary")),
    price2: toNumber(get("priceSecondary")),
    lessThanCasePrice: toNumber(get("lessThanCasePrice")),
    caseQuantity: toNumber(get("caseQuantity"))
  };
}

/***** Load data *****/
async function loadData() {
  try {
    const res = await fetch(SHEET_CSV, { cache: "no-store" });
    if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
    const csv = await res.text();
    const { headers, rows } = parseCSV(csv);
    HEADER_INDEX = buildHeaderIndex(headers);
    DATA = rows.map(r => {
      // keep original row order; convert via HEADER_INDEX
      const cells = headers.map(h => r[h]);
      return toObj(cells);
    });
    hydrateCategoryFilter(DATA);
    render();
  } catch (err) {
    console.error(err);
    dom.grid.innerHTML = `<div class="empty">There was a problem loading the catalog.</div>`;
  }
}

/***** Filters *****/
function hydrateCategoryFilter(rows) {
  const cats = [...new Set(rows.map(r => r.category).filter(Boolean))].sort();
  dom.category.innerHTML = `<option value="">All categories</option>` + cats.map(c => `<option>${c}</option>`).join("");
}
function applyFilters() {
  const q = (dom.search.value || "").toLowerCase();
  const cat = dom.category.value;
  let rows = DATA.slice();
  if (q) {
    rows = rows.filter(r =>
      [r.name, r.vendor, r.sku, r.description].some(v => (v || "").toLowerCase().includes(q))
    );
  }
  if (cat) rows = rows.filter(r => r.category === cat);
  const [key, dir] = dom.sort.value.split("-");
  const mul = dir === "desc" ? -1 : 1;
  rows.sort((a,b) => {
    const va = key === "price" ? (a.price ?? Number.POSITIVE_INFINITY) : (a.name || "");
    const vb = key === "price" ? (b.price ?? Number.POSITIVE_INFINITY) : (b.name || "");
    return va > vb ? mul : va < vb ? -mul : 0;
  });
  return rows;
}

/***** Render *****
- price: show priceSecondary if it’s lower; otherwise show pricePrimary
- display case badges if provided
************************************/
function render() {
  const rows = applyFilters();
  dom.grid.innerHTML = "";
  if (!rows.length) {
    const div = document.createElement("div");
    div.className = "empty";
    div.textContent = "No items match your filters.";
    dom.grid.appendChild(div);
    return;
  }
  const frag = document.createDocumentFragment();
  rows.forEach(r => frag.appendChild(renderCard(r)));
  dom.grid.appendChild(frag);
}

function renderCard(r) {
  const el = dom.tpl.content.cloneNode(true);
  const img = el.querySelector(".card-img");
  const title = el.querySelector(".card-title");
  const sub = el.querySelector(".card-sub");
  const desc = el.querySelector(".card-desc");
  const meta = el.querySelector(".card-meta");
  const actions = el.querySelector(".card-actions");

  img.src = r.imageUrl || "";
  img.alt = r.name || r.sku || "Product image";
  title.textContent = r.name || r.sku || "Unnamed Item";
  sub.textContent = [r.vendor, r.sku].filter(Boolean).join(" • ");
  desc.textContent = r.description || "";

  const badges = [];
  const displayPrice = r.price2 != null && r.price != null && r.price2 < r.price ? r.price2 : r.price;
  if (displayPrice != null) badges.push(`Price: $${displayPrice.toFixed(2)}`);
  if (r.lessThanCasePrice != null) badges.push(`< ${r.caseQuantity || "case"}: $${r.lessThanCasePrice.toFixed(2)}`);
  if (r.caseQuantity) badges.push(`Case Qty: ${r.caseQuantity}`);
  if (r.category) badges.push(`Category: ${r.category}`);
  meta.innerHTML = badges.map(b => `<span class="badge">${b}</span>`).join(" ");

  if (r.productUrl) {
    const a = document.createElement("a");
    a.href = r.productUrl;
    a.target = "_blank";
    a.rel = "noopener";
    a.className = "button primary";
    a.textContent = "View item";
    actions.appendChild(a);
  }
  return el;
}

/***** Wire up *****/
["input","change"].forEach(evt => {
  dom.search.addEventListener(evt, render);
  dom.category.addEventListener(evt, render);
  dom.sort.addEventListener(evt, render);
});
loadData();

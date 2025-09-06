/***** COLUMN MAP: match your exact Showroom headers (no renames) *****/
const COLUMN_MAP = {
  name:       "Name",     // exact header for name
  price1:     "Price 1",  // exact header for Price 1
  imageUrl:   "image"  // exact header for image URL
};

/***** CSV fetch + parsing *****/
function smartSplit(line) {
  const out=[]; let cur="", inQ=false;
  for (let i=0;i<line.length;i++){
    const c=line[i], n=line[i+1];
    if (c === '"' && n === '"'){ cur+='"'; i++; continue; }
    if (c === '"'){ inQ=!inQ; continue; }
    if (c === ',' && !inQ){ out.push(cur); cur=""; continue; }
    cur += c;
  }
  out.push(cur); return out;
}
const stripQ = s => s.replace(/^"(.*)"$/, "$1");

function parseCSV(csv) {
  const lines = csv.replace(/\r/g,"").split("\n").filter(Boolean);
  const headers = smartSplit(lines.shift()).map(h => stripQ(h.trim()));
  const rows = lines.map(line => {
    const cells = smartSplit(line).map(c => stripQ(c.trim()));
    return Object.fromEntries(headers.map((h,i)=>[h, cells[i] ?? ""]));
  });
  return { headers, rows };
}

/***** Build header index so we don’t depend on order *****/
let HEADER_INDEX = {};
function buildHeaderIndex(headers) {
  const dict = Object.create(null);
  headers.forEach((h,i) => dict[h] = i);
  const idx = {};
  Object.entries(COLUMN_MAP).forEach(([k,h]) => {
    if (h in dict) idx[k] = dict[h];
    else console.warn(`Header not found for ${k} → "${h}". Detected:`, headers);
  });
  return idx;
}

/***** Coercions *****/
function toMoney(v) {
  if (!v) return null;
  const n = Number(String(v).replace(/[^0-9.\-]/g,""));
  return Number.isFinite(n) ? n : null;
}

/***** DOM *****/
const grid = document.getElementById("grid");

/***** Render *****/
function render(rows) {
  grid.innerHTML = "";
  if (!rows.length) {
    const div = document.createElement("div");
    div.className = "empty";
    div.textContent = "No items.";
    grid.appendChild(div);
    return;
  }
  const frag = document.createDocumentFragment();
  rows.forEach(r => {
    const card = document.createElement("article");
    card.className = "card";

    const img = document.createElement("img");
    img.className = "card-img";
    img.src = r.imageUrl || "";
    img.alt = r.name || "Product image";
    card.appendChild(img);

    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("h2");
    title.className = "card-title";
    title.textContent = r.name || "Unnamed Item";
    body.appendChild(title);

    if (r.price1 != null) {
      const price = document.createElement("div");
      price.className = "price";
      price.textContent = `$${r.price1.toFixed(2)}`;
      body.appendChild(price);
    }

    card.appendChild(body);
    frag.appendChild(card);
  });
  grid.appendChild(frag);
}

/***** Data load *****/
async function loadData() {
  try {
    const res = await fetch(SHEET_CSV, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const csv = await res.text();
    const { headers, rows } = parseCSV(csv);
    HEADER_INDEX = buildHeaderIndex(headers);

    // map rows into minimal objects
    const data = rows.map(row => {
      const name = row[COLUMN_MAP.name] || "";
      const priceRaw = row[COLUMN_MAP.price1] || "";
      const imageUrl = row[COLUMN_MAP.imageUrl] || "";
      const price1 = toMoney(priceRaw);
      return { name, price1, imageUrl };
    });

    render(data);
  } catch (e) {
    console.error(e);
    grid.innerHTML = `<div class="empty">There was a problem loading the catalog.</div>`;
  }
}

loadData();

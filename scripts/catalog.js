// Published-to-web CSVs for Products & Variants
const PRODUCTS_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQyKnlMtRQJKbmCkI7loITX-K8M-iF8jUfSwSQOw8wIio1eZLFKq_WsAfArkfG4eaGKQkuV3imHocOv/pub?gid=653601520&single=true&output=csv";
const VARIANTS_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQyKnlMtRQJKbmCkI7loITX-K8M-iF8jUfSwSQOw8wIio1eZLFKq_WsAfArkfG4eaGKQkuV3imHocOv/pub?gid=140795318&single=true&output=csv";

async function fetchCSV(url){
  const res = await fetch(url,{cache:'no-store'});
  const text = await res.text();
  const { data } = Papa.parse(text,{header:true});
  return data.filter(row=>Object.values(row).some(v=>v!==undefined&&String(v).trim()!==""));
}
const norm=s=>(s||'').toString().toLowerCase();
const normId=id=>norm(id).replace(/^rk-/,'');
const normCat=s=>(s||'').toString().trim().toLowerCase();
const toNum=x=>{ if(x==null) return null; const n=Number(String(x).replace(/[^0-9.\-]/g,'')); return isFinite(n)?n:null; };
const fmtUSD=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});
// Display formatted USD price when positive; otherwise show a quote request message
function displayPrice(p){
  const n=Number(p);
  return Number.isFinite(n) && n > 0 ? fmtUSD.format(n) : 'Quote Upon Request';
}
function slug(s){ return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
const FAST_TURN_CATEGORY = 'Fast Turn Category';
function sortCategories(arr){
  const fast = normCat(FAST_TURN_CATEGORY);
  return arr.sort((a,b)=>{
    const na=normCat(a);
    const nb=normCat(b);
    if(na===fast) return -1;
    if(nb===fast) return 1;
    return na.localeCompare(nb);
  });
}
function buildNavFromCategories(products){
  const map={};
  products.forEach(p=>{
    const name=(p.category||'').trim();
    if(!name) return;
    const key=normCat(name);
    if(!(key in map)) map[key]=name;
  });
  const categories=sortCategories(Object.values(map));
  const navEl=document.querySelector('#nav');
  if(!navEl) return;
  navEl.innerHTML='';
  categories.forEach(cat=>{
    const a=document.createElement('a');
    a.href=`#/c/${slug(cat)}`;
    a.className='nav-link';
    a.textContent=cat;
    navEl.appendChild(a);
  });
}

// Resolve values using possible header aliases
function pick(row, aliases){
  for(const key of aliases){
    const v=row[key];
    if(v!=null && String(v).trim()!=='') return v;
  }
  return '';
}

// Acceptable column names for each logical field
const PRODUCT_COLS={
  status:    ['Status','Approval Status','status'],
  slug:      ['Slug','Product ID','product_id','slug','ID','id'],
  name:      ['Product Name','Name','Item Name','title'],
  category:  ['Category','Categories','category'],
  preview:   ['Preview','preview','Preview Link','Preview URL','3D Preview URL','model_3d_url','Model 3D URL'],
  thumb:     ['Thumbnail URL','Image','Image URL','Primary Image','primary_image_url','image_url','primary image'],
  description:['Description','Product Description','description'],
  gallery:   ['Gallery URLs','Gallery','gallery_urls','gallery'],
  imprint:   ['Imprint Methods','Imprint Method','imprint_methods','imprint'],
  tags:      ['Tags','Tag','tags'],
  approved:  ['Approved','approved']
};
const VARIANT_COLS={
  productId: ['Product ID','product_id','Slug','slug','ID','id'],
  size:      ['Size','Option','Variant','Spec','option1_value','size'],
  price:     ['Price','Unit Price','Cost','price','unit_price']
};

function logUnmatched(rows, cols, label){
  const sample=rows.slice(0,3).map((row,i)=>{
    const missing=[];
    for(const [field,aliases] of Object.entries(cols)){
      if(!aliases.some(a=>a in row)) missing.push(field);
    }
    return missing.length?{row:i+1,missing}:null;
  }).filter(Boolean);
  if(sample.length) console.warn(`Unmatched ${label} columns`, sample);
}

async function main(){
  const [products, variants] = await Promise.all([fetchCSV(PRODUCTS_CSV), fetchCSV(VARIANTS_CSV)]);

  logUnmatched(products, PRODUCT_COLS, 'product');
  logUnmatched(variants, VARIANT_COLS, 'variant');

  const byProduct = variants.reduce((m,v)=>{
    const k = normId(pick(v, VARIANT_COLS.productId));
    if(!k) return m;
    const size = pick(v, VARIANT_COLS.size);
    const price = toNum(pick(v, VARIANT_COLS.price));
    (m[k] = m[k] || []).push({ size, price });
    return m;
  }, {});

  const statuses = products.map(p=>pick(p, PRODUCT_COLS.status));
  const approvals = products.map(p=>pick(p, PRODUCT_COLS.approved));
  const catalog = products
    .filter((p,i) => norm(statuses[i])==='approved' || norm(approvals[i])==='true')
    .map(p=>{
      const id=normId(pick(p, PRODUCT_COLS.slug));
      const name=pick(p, PRODUCT_COLS.name);
      const vs = (byProduct[id] || []).slice();
      const nums = vs.map(v => v.price).filter(n => n != null);
      const minPrice = nums.length ? Math.min(...nums) : null;
      const maxPrice = nums.length ? Math.max(...nums) : null;
      vs.sort((a,b)=>{
        const na=a.price, nb=b.price;
        if(na!=null&&nb!=null) return na-nb;
        if(na!=null) return -1;
        if(nb!=null) return 1;
        return (a.size||'').localeCompare(b.size||'');
      });
      return {
        id,
        name,
        category:pick(p, PRODUCT_COLS.category),
        preview:pick(p, PRODUCT_COLS.preview),
        thumb:pick(p, PRODUCT_COLS.thumb),
        description:pick(p, PRODUCT_COLS.description),
        gallery:pick(p, PRODUCT_COLS.gallery),
        imprint:pick(p, PRODUCT_COLS.imprint),
        tags:pick(p, PRODUCT_COLS.tags),
        variants:vs,
        minPrice,maxPrice
      };
    });
  buildNavFromCategories(catalog);

  if(!catalog.length){
    const msg = (products.length && (statuses.some(s=>String(s).trim()) || approvals.some(a=>String(a).trim())))
      ? 'No approved products found.'
      : 'Check published CSV headers—no matching aliases found.';
    document.getElementById('cards').innerHTML =
      `<div style="padding:16px;color:#b91c1c;background:#fee2e2;border:1px solid #fecaca;border-radius:10px;">${msg}</div>`;
    return;
  }

  const cardsEl=document.getElementById('cards'), countEl=document.getElementById('count');
  function renderCatalog(catSlug){
    const list=catalog.filter(p=>{
      const cat=normCat(p.category);
      return !catSlug || slug(cat)===catSlug;
    });
    countEl.textContent = `${list.length} product${list.length===1?'':'s'} shown`;
    cardsEl.innerHTML='';
    const groups={};
    list.forEach(p=>{
      const name=(p.category||'').trim()||'Other';
      const key=normCat(name);
      (groups[key]=groups[key]||{name,items:[]}).items.push(p);
    });
    sortCategories(Object.values(groups).map(g=>g.name)).forEach(cat=>{
      const key=normCat(cat);
      const group=groups[key];
      const h=document.createElement('h3');
      h.textContent = group.name;
      h.className = 'category-title';
      cardsEl.appendChild(h);
      const grid=document.createElement('div');
      grid.className='card-grid';
      group.items.forEach(p=>grid.appendChild(productCard(p)));
      cardsEl.appendChild(grid);
    });
  }

  function productCard(p){
    const wrap=document.createElement('a');
    wrap.className='card';
    wrap.href=`#/p/${p.id}`;

    const imgWrap=document.createElement('div');
    imgWrap.className='card-thumb';
    const img=document.createElement('img');
    img.alt=p.name;
    img.src=p.thumb||'https://via.placeholder.com/800x600?text=No+Image';
    imgWrap.appendChild(img);

    const meta=document.createElement('div');
    meta.className='card-meta';
    const title=document.createElement('div');
    title.className='card-title';
    title.textContent=p.name;

    const price=document.createElement('div');
    price.className='card-price';
    if(p.minPrice!=null && p.maxPrice!=null){
      const min=displayPrice(p.minPrice);
      const max=displayPrice(p.maxPrice);
      price.textContent = (p.minPrice===p.maxPrice)? min : `${min} – ${max}`;
    } else {
      price.textContent = displayPrice('');
    }

    meta.appendChild(title);
    if(price.textContent) meta.appendChild(price);

    wrap.appendChild(imgWrap);
    wrap.appendChild(meta);
    return wrap;
  }

  window.renderCatalog=renderCatalog;

  function showDetail(id){
    const product=catalog.find(p=>p.id===id);
    const detailEl=document.getElementById('detail');
    if(!product){ detailEl.classList.remove('open'); location.hash=''; return; }

    detailEl.classList.add('open');

    document.getElementById('detail-title').textContent=product.name;
    document.getElementById('detail-desc').textContent=product.description||'';
    document.getElementById('detail-imp').textContent=product.imprint||'';

    const tagsEl=document.getElementById('detail-tags');
    tagsEl.innerHTML='';
    (product.tags||'').split(',').map(s=>s.trim()).filter(Boolean).forEach(t=>{
      const span=document.createElement('span');
      span.textContent=t;
      tagsEl.appendChild(span);
    });

    const previewEl=document.getElementById('detail-preview');
    if(product.preview){
      previewEl.href=product.preview;
      previewEl.textContent='Preview';
      previewEl.style.display='inline-block';
    } else {
      previewEl.style.display='none';
    }

    const priceEl=document.getElementById('detail-price');
    if(product.minPrice!=null && product.maxPrice!=null){
      const min=displayPrice(product.minPrice);
      const max=displayPrice(product.maxPrice);
      priceEl.textContent=(product.minPrice===product.maxPrice)?min:`${min} – ${max}`;
    } else {
      priceEl.textContent=displayPrice('');
    }

    const hero=document.getElementById('detail-hero');
    hero.innerHTML='';
    const gallery=(product.gallery||'').split(/[|,]/).map(s=>s.trim()).filter(Boolean);
    const heroImg=document.createElement('img');
    heroImg.src=gallery[0]||product.thumb||'https://via.placeholder.com/800x600?text=No+Image';
    hero.appendChild(heroImg);
    const thumbsWrap = detailEl.querySelector('.thumbs');
    thumbsWrap.innerHTML = '';
    gallery.forEach(url => {
      const slot = document.createElement('div');
      slot.className = 'thumb';
      const im = document.createElement('img');
      im.src = url;
      slot.appendChild(im);
      slot.onclick = () => { heroImg.src = url; };
      thumbsWrap.appendChild(slot);
    });

    const varEl=document.getElementById('detail-variants');
    varEl.innerHTML='';
    if(product.variants && product.variants.length){
      const table=document.createElement('table');
      table.className='variant-table';
      const thead=document.createElement('thead');
      thead.innerHTML='<tr><th>Size</th><th>Price</th></tr>';
      table.appendChild(thead);
      const tbody=document.createElement('tbody');
      product.variants.forEach(v=>{
        const tr=document.createElement('tr');
        const sizeTd=document.createElement('td');
        sizeTd.textContent=v.size||'';
        const priceTd=document.createElement('td');
        priceTd.textContent=displayPrice(v.price);
        tr.appendChild(sizeTd);
        tr.appendChild(priceTd);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      varEl.appendChild(table);
    }
  }

  function handleRoute(){
    const hash=location.hash;
    const detailEl=document.getElementById('detail');
    if(hash.startsWith('#/p/')){
      showDetail(normId(hash.slice(4)));
    } else {
      detailEl.classList.remove('open');
      const m=hash.match(/^#\/c\/(.+)$/);
      renderCatalog(m?m[1]:'');
    }
  }

  window.addEventListener('hashchange', handleRoute);
  document.getElementById('detail-overlay').addEventListener('click', ()=>{location.hash='';});
  document.getElementById('detail-close').addEventListener('click', ()=>{location.hash='';});
  handleRoute();
}

main().catch(err=>{
  document.getElementById('cards').innerHTML =
    `<div style="padding:16px;color:#b91c1c;background:#fee2e2;border:1px solid #fecaca;border-radius:10px;">
       Error loading data. Check the published CSV URLs.<br><br>
       <small>${err}</small>
     </div>`;
});

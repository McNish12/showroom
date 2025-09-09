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
const toNum=x=>{ if(x==null) return null; const n=Number(String(x).replace(/[^0-9.\-]/g,'')); return isFinite(n)?n:null; };
const fmtUSD=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});
// Display formatted USD price when positive; otherwise show a quote request message
function displayPrice(p){
  const n=Number(p);
  return Number.isFinite(n) && n > 0 ? fmtUSD.format(n) : 'Quote Upon Request';
}
function slug(s){ return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
function buildNavFromCategories(products){
  const categories=[...new Set(products.map(p=>p.category).filter(Boolean))].sort();
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
  preview:   ['Preview Link','3D Preview URL','Preview URL','model_3d_url','Model 3D URL'],
  thumb:     ['Thumbnail URL','Image','Image URL','Primary Image','primary_image_url','image_url','primary image'],
  description:['Description','Product Description','description'],
  gallery:   ['Gallery URLs','Gallery','gallery_urls','gallery'],
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
    const list=catalog.filter(p=>!catSlug || slug(p.category)===catSlug);
    countEl.textContent = `${list.length} product${list.length===1?'':'s'} shown`;
    cardsEl.innerHTML='';
    const groups={};
    list.forEach(p=>{const c=p.category||'Other';(groups[c]=groups[c]||[]).push(p);});
    Object.keys(groups).sort().forEach(cat=>{
      const h=document.createElement('h3'); h.textContent=cat; cardsEl.appendChild(h);
      const grid=document.createElement('div'); grid.className='cards';
      groups[cat].forEach(p=>grid.appendChild(card(p)));
      cardsEl.appendChild(grid);
    });
  }

  function card(p){
    const wrap=document.createElement('a'); wrap.className='card'; wrap.href=`#/p/${p.id}`;
    const t=document.createElement('div'); t.className='thumb';
    const img=document.createElement('img'); img.alt=p.name; img.src=p.thumb||'https://via.placeholder.com/800x600?text=No+Image'; t.appendChild(img);

    const meta=document.createElement('div'); meta.className='meta';
    const name=document.createElement('div'); name.className='name'; name.textContent=p.name;

    const price=document.createElement('div'); price.className='price';
    if(p.minPrice!=null && p.maxPrice!=null){
      const min=displayPrice(p.minPrice);
      const max=displayPrice(p.maxPrice);
      price.textContent = (p.minPrice===p.maxPrice)? min : `${min} – ${max}`;
    } else {
      price.textContent = displayPrice('');
    }

    meta.appendChild(name); if(price.textContent) meta.appendChild(price);
    wrap.appendChild(t); wrap.appendChild(meta);
    return wrap;
  }

  window.renderCatalog=renderCatalog;

  function showDetail(id){
    const product=catalog.find(p=>p.id===id);
    const mainEl=document.querySelector('main');
    const detailEl=document.getElementById('detail');
    if(!product){ location.hash=''; return; }
    mainEl.style.display='none';
    detailEl.style.display='block';
    const c=document.getElementById('detail-content');
    c.innerHTML='';
    const back=document.createElement('a'); back.href='#'; back.className='btn'; back.textContent='← Back to Catalog'; c.appendChild(back);
    const title=document.createElement('h2'); title.textContent=product.name; c.appendChild(title);
    const layout=document.createElement('div'); layout.className='layout';
    const imgCol=document.createElement('div');
    const mainImg=document.createElement('img'); mainImg.src=product.thumb||'https://via.placeholder.com/800x600?text=No+Image'; imgCol.appendChild(mainImg);
    const gallery=(product.gallery||'').split(',').map(s=>s.trim()).filter(Boolean);
    if(gallery.length){
      const g=document.createElement('div'); g.className='gallery';
      gallery.forEach(u=>{const im=document.createElement('img'); im.src=u; g.appendChild(im);});
      imgCol.appendChild(g);
    }
    layout.appendChild(imgCol);
    const info=document.createElement('div');
    if(product.description){ const pDesc=document.createElement('p'); pDesc.textContent=product.description; info.appendChild(pDesc); }
    if(product.preview){
      let url = product.preview;
      try{
        const u = new URL(url);
        if(u.hostname === 'viewer.shapr3d.com' && !u.searchParams.has('mode')){
          u.searchParams.set('mode','embed');
          url = u.toString();
        }
      } catch(err){}
      const container=document.createElement('div');
      const link=document.createElement('a');
      link.textContent='View 3D Preview';
      link.href=url; link.target='_blank'; link.rel='noopener';
      link.className='btn';
      container.appendChild(link);
      info.appendChild(container);
      fetch(url,{method:'HEAD'}).then(res=>{
        const xfo=res.headers.get('x-frame-options');
        const csp=res.headers.get('content-security-policy');
        if(!xfo && !(csp && /frame-ancestors/i.test(csp))){
          const iframe=document.createElement('iframe');
          iframe.src=url; iframe.loading='lazy';
          iframe.style.width='100%'; iframe.style.height='480px'; iframe.style.border='0';
          container.innerHTML='';
          container.appendChild(iframe);
        }
      }).catch(()=>{});
    }
    if(product.variants && product.variants.length){ const sizes=document.createElement('div'); sizes.className='sizes'; const dl=document.createElement('dl'); const dt=document.createElement('dt'); dt.textContent='Sizes & Prices'; dl.appendChild(dt); product.variants.forEach(v=>{ const dd=document.createElement('dd'); dd.textContent=`${v.size||''} — ${displayPrice(v.price)}`; dl.appendChild(dd); }); sizes.appendChild(dl); info.appendChild(sizes); }
    layout.appendChild(info);
    c.appendChild(layout);
  }

  function handleRoute(){
    const hash=location.hash;
    const mainEl=document.querySelector('main');
    const detailEl=document.getElementById('detail');
    if(hash.startsWith('#/p/')){
      showDetail(hash.slice(4));
    } else {
      detailEl.style.display='none';
      mainEl.style.display='block';
      const m=hash.match(/^#\/c\/(.+)$/);
      renderCatalog(m?m[1]:'');
    }
  }

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

main().catch(err=>{
  document.getElementById('cards').innerHTML =
    `<div style="padding:16px;color:#b91c1c;background:#fee2e2;border:1px solid #fecaca;border-radius:10px;">
       Error loading data. Check the published CSV URLs.<br><br>
       <small>${err}</small>
     </div>`;
});

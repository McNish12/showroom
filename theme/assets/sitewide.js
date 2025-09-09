// path: theme/assets/sitewide.js
// Minimal placeholder; initialize carousel dots if present.
(function(){
  const slides = document.querySelector('.slides');
  const dots = document.getElementById('dots');
  if(!slides || !dots) return;
  const count = slides.children.length;
  let index = 0, timer = null;
  function renderDots(){
    dots.innerHTML='';
    for(let i=0;i<count;i++){
      const d = document.createElement('div');
      d.className='dot'+(i===index?' active':'');
      d.addEventListener('click',()=>{ index=i; update(); });
      dots.appendChild(d);
    }
  }
  function update(){
    slides.style.transform = `translateX(-${index*100}%)`;
    [...dots.children].forEach((el,i)=>el.classList.toggle('active', i===index));
  }
  function start(){ timer = setInterval(()=>{ index=(index+1)%count; update(); }, 3500); }
  renderDots(); update(); start();
})();

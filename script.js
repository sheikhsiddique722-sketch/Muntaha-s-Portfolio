
/* ===== Background Canvas Animation ===== */
(function(){
  const canvas=document.getElementById('bg-canvas');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  let W,H,mx=innerWidth/2,my=innerHeight/2;

  function resize(){W=canvas.width=innerWidth;H=canvas.height=innerHeight;}
  resize();
  addEventListener('resize',resize);
  addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;});

  function col(a){
    return document.documentElement.getAttribute('data-theme')==='light'
      ?`rgba(101,55,20,${a})`:`rgba(196,130,74,${a})`;
  }

  // Rotation helpers
  const Rx=(v,a)=>[v[0],v[1]*Math.cos(a)-v[2]*Math.sin(a),v[1]*Math.sin(a)+v[2]*Math.cos(a)];
  const Ry=(v,a)=>[v[0]*Math.cos(a)+v[2]*Math.sin(a),v[1],-v[0]*Math.sin(a)+v[2]*Math.cos(a)];
  const Rz=(v,a)=>[v[0]*Math.cos(a)-v[1]*Math.sin(a),v[0]*Math.sin(a)+v[1]*Math.cos(a),v[2]];

  // Shape definitions
  const DEFS={
    cube:{
      v:[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],
      e:[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]]
    },
    oct:{
      v:[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],
      e:[[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5],[2,4],[2,5],[3,4],[3,5]]
    },
    tetra:{
      v:[[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]],
      e:[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]]
    },
    diamond:{
      v:[[0,2,0],[1,0,1],[1,0,-1],[-1,0,-1],[-1,0,1],[0,-2,0]],
      e:[[0,1],[0,2],[0,3],[0,4],[5,1],[5,2],[5,3],[5,4],[1,2],[2,3],[3,4],[4,1]]
    }
  };

  const types=['cube','oct','tetra','diamond','cube','oct','tetra'];
  const shapes=types.map((type,i)=>({
    type,
    x:(Math.random()-.5)*innerWidth*.85,
    y:(Math.random()-.5)*innerHeight*.85,
    z:Math.random()*300-150,
    size:35+Math.random()*75,
    ax:Math.random()*Math.PI*2, ay:Math.random()*Math.PI*2, az:Math.random()*Math.PI*2,
    sx:(Math.random()-.5)*.005, sy:(Math.random()-.5)*.004, sz:(Math.random()-.5)*.005,
    dx:(Math.random()-.5)*.22, dy:(Math.random()-.5)*.14,
  }));

  // Particles
  const pts=Array.from({length:55},()=>({
    x:Math.random()*innerWidth,
    y:Math.random()*innerHeight,
    vx:(Math.random()-.5)*.38,
    vy:(Math.random()-.5)*.38,
    r:.7+Math.random()*1.6,
  }));

  const FOV=600;
  function proj(v,ox,oy){
    const d=FOV+v[2];const f=FOV/Math.max(d,1);
    return[v[0]*f+ox,v[1]*f+oy];
  }

  function frame(){
    ctx.clearRect(0,0,W,H);
    const ox=W/2+(mx-W/2)*.022;
    const oy=H/2+(my-H/2)*.022;

    // 3D shapes
    shapes.forEach(s=>{
      s.ax+=s.sx;s.ay+=s.sy;s.az+=s.sz;
      s.x+=s.dx;s.y+=s.dy;
      if(s.x>W*.65)s.dx=-Math.abs(s.dx);
      if(s.x<-W*.65)s.dx=Math.abs(s.dx);
      if(s.y>H*.65)s.dy=-Math.abs(s.dy);
      if(s.y<-H*.65)s.dy=Math.abs(s.dy);

      const def=DEFS[s.type];
      const tv=def.v.map(v=>{
        let p=[v[0]*s.size,v[1]*s.size,v[2]*s.size];
        p=Rx(p,s.ax);p=Ry(p,s.ay);p=Rz(p,s.az);
        return[p[0]+s.x,p[1]+s.y,p[2]+s.z];
      });
      const pv=tv.map(v=>proj(v,ox,oy));

      const alpha=Math.max(.03,Math.min(.16,.16-Math.abs(s.z)*.0005));
      ctx.strokeStyle=col(alpha);
      ctx.lineWidth=.75;
      def.e.forEach(([a,b])=>{
        ctx.beginPath();ctx.moveTo(pv[a][0],pv[a][1]);ctx.lineTo(pv[b][0],pv[b][1]);ctx.stroke();
      });
    });

    // Particles
    pts.forEach(p=>{
      p.x+=p.vx;p.y+=p.vy;
      if(p.x<0)p.x=W;if(p.x>W)p.x=0;
      if(p.y<0)p.y=H;if(p.y>H)p.y=0;
    });
    for(let i=0;i<pts.length;i++){
      for(let j=i+1;j<pts.length;j++){
        const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y;
        const d=Math.hypot(dx,dy);
        if(d<125){
          ctx.strokeStyle=col((1-d/125)*.065);
          ctx.lineWidth=.5;
          ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.stroke();
        }
      }
      // Glowing particle dot
      const grd=ctx.createRadialGradient(pts[i].x,pts[i].y,0,pts[i].x,pts[i].y,pts[i].r*4);
      grd.addColorStop(0,col(.55));grd.addColorStop(0.4,col(.18));grd.addColorStop(1,col(0));
      ctx.fillStyle=grd;
      ctx.beginPath();ctx.arc(pts[i].x,pts[i].y,pts[i].r*4,0,Math.PI*2);ctx.fill();
    }
    requestAnimationFrame(frame);
  }
  frame();
})();

/* ===== Loader ===== */
(function(){
  const loader=document.getElementById('loader');
  const fill=loader.querySelector('.ld-fill');
  const pct=loader.querySelector('.ld-pct');
  const nm=loader.querySelector('.ld-name');
  gsap.to(nm,{opacity:1,duration:.8,ease:'power2.out'});
  let p=0;
  const tick=setInterval(()=>{
    p+=Math.random()*16+6; if(p>=100){p=100;clearInterval(tick);finish();}
    fill.style.width=p+'%'; pct.textContent=String(Math.floor(p)).padStart(3,'0');
  },130);
  function finish(){
    gsap.to(loader,{opacity:0,duration:.7,delay:.35,ease:'power2.inOut',onComplete:()=>{loader.style.display='none';startReveals();}});
  }
})();

/* ===== Lenis smooth scroll ===== */
let lenis;
if(window.Lenis){
  lenis=new Lenis({duration:1.1,easing:t=>Math.min(1,1.001-Math.pow(2,-10*t)),smoothWheel:true});
  function raf(t){lenis.raf(t);requestAnimationFrame(raf);}
  requestAnimationFrame(raf);
  if(window.ScrollTrigger){lenis.on('scroll',ScrollTrigger.update);}
}
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    const id=a.getAttribute('href'); if(id.length<2)return;
    const t=document.querySelector(id); if(!t)return; e.preventDefault();
    if(lenis)lenis.scrollTo(t,{offset:-20,duration:1.3}); else t.scrollIntoView({behavior:'smooth'});
    document.getElementById('mobileMenu').classList.remove('open');
  });
});

/* ===== Custom cursor ===== */
(function(){
  const dot=document.querySelector('.cursor-dot'),ring=document.querySelector('.cursor-ring');
  if(!dot||!ring||!matchMedia('(hover:hover)').matches)return;
  let mx=0,my=0,rx=0,ry=0;
  addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;dot.style.transform=`translate(${mx}px,${my}px) translate(-50%,-50%)`;});
  function loop(){rx+=(mx-rx)*.18;ry+=(my-ry)*.18;ring.style.transform=`translate(${rx}px,${ry}px) translate(-50%,-50%)`;requestAnimationFrame(loop);}loop();
  document.querySelectorAll('a,button,.magnetic,.pill,.facet,.proj,.clink,.value').forEach(el=>{
    el.addEventListener('mouseenter',()=>ring.classList.add('hov'));
    el.addEventListener('mouseleave',()=>ring.classList.remove('hov'));
  });
})();

/* ===== Magnetic buttons ===== */
document.querySelectorAll('.magnetic').forEach(el=>{
  el.addEventListener('mousemove',e=>{
    const r=el.getBoundingClientRect();
    const x=e.clientX-r.left-r.width/2, y=e.clientY-r.top-r.height/2;
    el.style.transform=`translate(${x*.25}px,${y*.35}px)`;
  });
  el.addEventListener('mouseleave',()=>{el.style.transform='';});
});

/* ===== Role typewriter ===== */
(function(){
  const el=document.getElementById('roleType');
  const roles=['responsive interfaces.','elegant frontends.','clean UI/UX.','React components.','modern web apps.'];
  let r=0,c=0,del=false;
  function type(){
    const w=roles[r];
    el.textContent=del?w.substring(0,c--):w.substring(0,c++);
    if(!del&&c===w.length+1){del=true;setTimeout(type,1400);return;}
    if(del&&c<0){del=false;r=(r+1)%roles.length;c=0;setTimeout(type,200);return;}
    setTimeout(type,del?42:78);
  }
  type();
})();

/* ===== Navbar behaviour ===== */
(function(){
  const nav=document.getElementById('nav'); let last=0;
  function onScroll(){
    const y=window.scrollY;
    nav.classList.toggle('solid',y>40);
    last=y;
    document.querySelector('.totop').classList.toggle('show',y>700);
  }
  if(lenis)lenis.on('scroll',onScroll);
  addEventListener('scroll',onScroll);
})();

/* ===== Mobile menu ===== */
const burger=document.getElementById('burger'),mm=document.getElementById('mobileMenu');
if(burger&&mm)burger.addEventListener('click',()=>mm.classList.toggle('open'));

/* ===== GSAP reveals + counters + bars ===== */
function startReveals(){
  if(!window.gsap||!window.ScrollTrigger)return;
  gsap.registerPlugin(ScrollTrigger);
  // hero immediate
  gsap.to('.hero .reveal',{opacity:1,y:0,duration:1,stagger:.09,ease:'power3.out',delay:.1});
  // section reveals
  gsap.utils.toArray('.reveal').forEach(el=>{
    if(el.closest('.hero'))return;
    gsap.to(el,{opacity:1,y:0,duration:.9,ease:'power3.out',
      scrollTrigger:{trigger:el,start:'top 88%'}});
  });
  // hero h1 lines
  gsap.set('.hero h1 .line span',{yPercent:110});
  gsap.to('.hero h1 .line span',{yPercent:0,duration:1.1,stagger:.12,ease:'power4.out',delay:.3});
  // counters
  gsap.utils.toArray('[data-count]').forEach(el=>{
    const end=+el.dataset.count, suf=el.dataset.suffix||'';
    ScrollTrigger.create({trigger:el,start:'top 90%',once:true,onEnter:()=>{
      gsap.to({v:0},{v:end,duration:1.6,ease:'power2.out',onUpdate:function(){el.textContent=Math.floor(this.targets()[0].v)+suf;}});
    }});
  });
  // bars
  gsap.utils.toArray('.fill').forEach(el=>{
    ScrollTrigger.create({trigger:el,start:'top 92%',once:true,onEnter:()=>{
      gsap.to(el,{width:el.dataset.w+'%',duration:1.3,ease:'power3.out'});
    }});
  });
  // parallax orbs
  gsap.to('#orb1',{y:-120,scrollTrigger:{trigger:'body',start:'top top',end:'bottom bottom',scrub:1}});
  gsap.to('#orb2',{y:140,scrollTrigger:{trigger:'body',start:'top top',end:'bottom bottom',scrub:1}});
  // active nav
  const secs=['about','skills','work','journey','contact'];
  secs.forEach(id=>{
    const s=document.getElementById(id); if(!s)return;
    ScrollTrigger.create({trigger:s,start:'top 50%',end:'bottom 50%',
      onToggle:self=>{if(self.isActive){document.querySelectorAll('.links a[data-nav]').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+id));}}});
  });
  ScrollTrigger.refresh();
}

/* ===== 3D tilt on portrait ===== */
(function(){
  const card=document.getElementById('tilt'); if(!card)return;
  const wrap=card.closest('.portrait-wrap');
  wrap.addEventListener('mousemove',e=>{
    const r=card.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
    card.style.transform=`rotateY(${x*9}deg) rotateX(${-y*9}deg) translateZ(8px)`;
  });
  wrap.addEventListener('mouseleave',()=>{card.style.transform='';});
  // float chips drift
  if(window.gsap){
    gsap.to('.chip-a',{y:-12,duration:3,repeat:-1,yoyo:true,ease:'sine.inOut'});
    gsap.to('.chip-b',{y:14,duration:3.6,repeat:-1,yoyo:true,ease:'sine.inOut'});
    gsap.to('.chip-c',{y:-9,duration:2.8,repeat:-1,yoyo:true,ease:'sine.inOut'});
  }
})();

/* ===== About image tilt + badge drift ===== */
(function(){
  const frame=document.querySelector('.about-img-frame');
  const col=document.querySelector('.about-img-col');
  if(col&&frame){
    col.addEventListener('mousemove',e=>{
      const r=frame.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
      frame.style.transform=`rotateY(${x*7}deg) rotateX(${-y*7}deg) translateZ(6px)`;
      frame.style.transition='transform .08s ease';
    });
    col.addEventListener('mouseleave',()=>{
      frame.style.transform='';
      frame.style.transition='transform .6s cubic-bezier(.16,1,.3,1)';
    });
  }
  if(window.gsap){
    gsap.to('.badge-a',{y:-10,duration:3.2,repeat:-1,yoyo:true,ease:'sine.inOut'});
    gsap.to('.badge-b',{y:12,duration:3.8,repeat:-1,yoyo:true,ease:'sine.inOut'});
  }
})();

/* ===== Lazy-load project preview iframes ===== */
(function(){
  const io=new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(en.isIntersecting){
        const f=en.target;
        if(!f.src&&f.dataset.src){
          f.src=f.dataset.src;
          f.addEventListener('load',()=>{const ld=f.parentElement.querySelector('.ld');if(ld)ld.style.opacity='0';});
        }
        io.unobserve(f);
      }
    });
  },{rootMargin:'300px'});
  document.querySelectorAll('.proj-shot iframe').forEach(f=>io.observe(f));
})();

/* ===== Theme Toggle ===== */
(function(){
  const btn=document.getElementById('themeToggle');
  if(!btn)return;
  const sun=btn.querySelector('.icon-sun');
  const moon=btn.querySelector('.icon-moon');
  const html=document.documentElement;
  const orb1=document.getElementById('orb1');
  const orb2=document.getElementById('orb2');

  const darkOrb1='radial-gradient(circle,rgba(196,130,74,.48),transparent 65%)';
  const darkOrb2='radial-gradient(circle,rgba(176,96,64,.42),transparent 65%)';
  const lightOrb1='radial-gradient(circle,rgba(139,69,19,.22),transparent 65%)';
  const lightOrb2='radial-gradient(circle,rgba(160,82,45,.18),transparent 65%)';

  function applyTheme(t, animate){
    const isLight=t==='light';
    function commit(){
      html.setAttribute('data-theme',t);
      sun.style.display=isLight?'block':'none';
      moon.style.display=isLight?'none':'block';
      if(orb1)orb1.style.background=isLight?lightOrb1:darkOrb1;
      if(orb2)orb2.style.background=isLight?lightOrb2:darkOrb2;
      const mc=document.querySelector('meta[name="theme-color"]');
      if(mc)mc.setAttribute('content',isLight?'#FAF7F2':'#0C0704');
      try{localStorage.setItem('ms-theme',t);}catch(e){}
    }
    if(animate){
      // Add transition class first, then on next paint commit the theme change
      // so CSS transitions are already active before values change
      html.classList.add('theme-transitioning');
      void html.offsetWidth; // force reflow — registers transition class
      requestAnimationFrame(()=>{
        commit();
        setTimeout(()=>html.classList.remove('theme-transitioning'),750);
      });
    } else {
      commit();
    }
  }

  // Restore saved preference instantly on load (no animation)
  let saved='dark';try{saved=localStorage.getItem('ms-theme')||'dark';}catch(e){}
  applyTheme(saved, false);

  btn.addEventListener('click',()=>{
    applyTheme(html.getAttribute('data-theme')==='dark'?'light':'dark', true);
  });
})();

/* ===== Firebase + EmailJS Contact Form ===== */

// ─── STEP 1: Firebase config — apna config yahan paste karo ───
const firebaseConfig = {
  apiKey:            "AIzaSyBI2E6_4SEznEH6cto_qS58EcKdQNS-w-Q",
  authDomain:        "muntaha-portfolio.firebaseapp.com",
  projectId:         "muntaha-portfolio",
  storageBucket:     "muntaha-portfolio.firebasestorage.app",
  messagingSenderId: "434019472058",
  appId:             "1:434019472058:web:745d486b5bbfe415432883"
};

// ─── STEP 2: EmailJS config — apna config yahan paste karo ───
const EJS_SERVICE  = "service_0ohdtme";
const EJS_TEMPLATE = "template_4pbabrt";
const EJS_KEY      = "uII8iyo8P4ljN6_f4";

// ─── Init ───
let db = null;
if(typeof firebase !== 'undefined' && firebaseConfig.apiKey !== 'YOUR_API_KEY'){
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
}
if(typeof emailjs !== 'undefined' && EJS_KEY !== 'YOUR_PUBLIC_KEY'){
  emailjs.init(EJS_KEY);
}

// ─── Form submit ───
const sendBtn = document.getElementById('sendBtn');
if(sendBtn){
  sendBtn.addEventListener('click', async ()=>{
    const name    = document.getElementById('f-name').value.trim();
    const email   = document.getElementById('f-email').value.trim();
    const message = document.getElementById('f-msg').value.trim();
    const successEl = document.getElementById('form-success');
    const errorEl   = document.getElementById('form-error');
    const label     = document.getElementById('sendLabel');
    const icon      = document.getElementById('sendIcon');
    const spinner   = document.getElementById('sendSpinner');

    // Validation
    if(!name || !email || !message){
      errorEl.textContent='Please fill in all fields.';
      errorEl.style.display='flex'; successEl.style.display='none';
      return;
    }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      errorEl.textContent='Please enter a valid email.';
      errorEl.style.display='flex'; successEl.style.display='none';
      return;
    }

    // Loading state
    sendBtn.disabled=true;
    label.textContent='Sending…';
    icon.style.display='none';
    spinner.style.display='block';
    successEl.style.display='none';
    errorEl.style.display='none';

    const data = { name, email, message, sentAt: new Date().toISOString() };

    try {
      // Save to Firestore
      if(db) await db.collection('messages').add(data);

      // Send email via EmailJS
      if(typeof emailjs !== 'undefined' && EJS_SERVICE !== 'YOUR_SERVICE_ID'){
        await emailjs.send(EJS_SERVICE, EJS_TEMPLATE, {
          from_name:    name,
          from_email:   email,
          message:      message,
          to_email:     'muntahashafique6@gmail.com'
        });
      }

      // Success
      successEl.style.display='flex';
      document.getElementById('f-name').value='';
      document.getElementById('f-email').value='';
      document.getElementById('f-msg').value='';
    } catch(err){
      console.error(err);
      errorEl.textContent='Something went wrong. Please try again.';
      errorEl.style.display='flex';
    }

    // Reset button
    sendBtn.disabled=false;
    label.textContent='Send message';
    icon.style.display='block';
    spinner.style.display='none';
  });
}

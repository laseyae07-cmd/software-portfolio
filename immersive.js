/* LASEYA — IMMERSIVE PORTFOLIO
   Real-time interaction engine: particles, motion, navigation, interactive cards. */
(() => {
  "use strict";
  const root = document.documentElement;
  const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  const dataSaver = Boolean(navigator.connection && navigator.connection.saveData);
  const readyForMotion = () => !root.classList.contains("motion-off") && !reduceQuery.matches;
  const smallScreen = () => window.innerWidth < 720;
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));
  if (!reduceQuery.matches) root.classList.add("motion-ready");
  else root.classList.add("motion-off");

  // Scroll progress & gentle navigation activation.
  const progress = $(".scroll-progress");
  let scrollFrame = null;
  function drawScroll() {
    scrollFrame = null;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
  }
  window.addEventListener("scroll", () => {
    if (scrollFrame === null) scrollFrame = requestAnimationFrame(drawScroll);
  }, { passive:true });
  window.addEventListener("resize", drawScroll, {passive:true});
  drawScroll();
  $("#year").textContent = new Date().getFullYear();

  // Reveal content in view. Default CSS leaves content visible if JS is unavailable.
  const reveals = $$(".reveal");
  if (readyForMotion() && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: "0px 0px -24px 0px" });
    reveals.forEach(el => observer.observe(el));
  } else {
    reveals.forEach(el => el.classList.add("is-visible"));
  }
  const navLinks = $$(".desktop-nav a");
  const sections = $$("main section[id]");
  if ("IntersectionObserver" in window) {
    const activeObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => {
          link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin:"-40% 0px -50% 0px" });
    sections.forEach(section => activeObserver.observe(section));
  }

  // Accessible mobile navigation: trap background interaction with inert.
  const menuButton = $(".menu-button");
  const mobileMenu = $("#mobile-menu");
  const setMenu = open => {
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobileMenu.classList.toggle("open", open);
    mobileMenu.inert = !open;
    document.body.classList.toggle("nav-open", open);
    if (open) $(".mobile-nav a")?.focus();
    else menuButton.focus();
  };
  menuButton.addEventListener("click", () => setMenu(menuButton.getAttribute("aria-expanded") !== "true"));
  $$(".mobile-nav a").forEach(a => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") setMenu(false);
  });

  // Filterable projects, including one clearly labelled in-progress design study.
  const projects = $$(".project");
  const filters = $$(".filter");
  filters.forEach(button => button.addEventListener("click", () => {
    const type = button.dataset.filter;
    filters.forEach(btn => {
      const active = btn === button;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
    projects.forEach(project => {
      const show = type === "all" || project.dataset.category === type;
      project.classList.toggle("project-hidden", !show);
      project.setAttribute("aria-hidden", String(!show));
      if (!show) project.setAttribute("tabindex", "-1");
      else project.setAttribute("tabindex", "0");
      project.querySelectorAll("a").forEach(a => {
        if (show) a.removeAttribute("tabindex");
        else a.setAttribute("tabindex", "-1");
      });
      // Previously-hidden cards must become visible when filtering.
      if (show) project.classList.add("is-visible");
    });
  }));

  // Color palette controls.
  $$(".swatch").forEach(button => button.addEventListener("click", () => {
    root.dataset.theme = button.dataset.theme;
    $$(".swatch").forEach(swatch => swatch.setAttribute("aria-pressed", String(swatch === button)));
  }));

  // Motion toggle: visitors can pause the whole visual experience.
  const motionToggle = $("#motion-toggle");
  let motionEnabled = !reduceQuery.matches;
  function setMotion(on) {
    motionEnabled = Boolean(on) && !reduceQuery.matches;
    root.classList.toggle("motion-off", !motionEnabled);
    if (motionEnabled) root.classList.add("motion-ready");
    else reveals.forEach(el => el.classList.add("is-visible"));
    motionToggle.setAttribute("aria-checked", String(motionEnabled));
    const label = motionToggle.querySelector("span");
    label.textContent = motionEnabled ? "ON" : "OFF";
  }
  setMotion(motionEnabled);
  motionToggle.addEventListener("click", () => setMotion(!motionEnabled));
  reduceQuery.addEventListener?.("change", event => {
    if (event.matches) setMotion(false);
  });

  // Canvas constellation: designed to run ~30fps max, fewer particles on phones.
  const canvas = $("#starfield");
  const ctx = canvas.getContext?.("2d", {alpha:true});
  let w=0,h=0,dpr=1,stars=[],raf=0,lastDraw=0;
  const pointer={x:-1000,y:-1000,active:false};
  const maxStars = () => smallScreen() ? 36 : 75;
  const density = () => smallScreen() ? .7 : 1;
  function resizeCanvas() {
    if (!ctx) return;
    const box=canvas.getBoundingClientRect();
    w=Math.max(1,Math.round(box.width));h=Math.max(1,Math.round(box.height));
    dpr=Math.min(window.devicePixelRatio||1,1.5);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const count=maxStars();
    stars=Array.from({length:count},() => ({
      x:Math.random()*w,y:Math.random()*h,
      r:.6+Math.random()*1.25,
      vx:(Math.random()-.5)*.28*density(),
      vy:(Math.random()-.5)*.28*density(),
      phase:Math.random()*6.28
    }));
  }
  function starColor(alpha) {
    const theme=root.dataset.theme||"lime";
    const rgb=theme==="violet"?"187,155,255":theme==="coral"?"255,149,123":"217,255,112";
    return "rgba("+rgb+","+alpha+")";
  }
  function renderStars(time) {
    if (!ctx) return;
    raf=requestAnimationFrame(renderStars);
    if (time-lastDraw<32) return;
    lastDraw=time;
    if (!readyForMotion() || document.hidden) {
      ctx.clearRect(0,0,w,h);
      return;
    }
    ctx.clearRect(0,0,w,h);
    for (const s of stars) {
      const dx=s.x-pointer.x,dy=s.y-pointer.y;
      const dist2=dx*dx+dy*dy;
      if (pointer.active && dist2<17000 && dist2>1) {
        const magnitude=(1-dist2/17000)*.55;
        const len=Math.sqrt(dist2);
        s.x+=dx/len*magnitude;s.y+=dy/len*magnitude;
      }
      s.x+=s.vx;s.y+=s.vy;
      if (s.x<-20)s.x=w+20;if(s.x>w+20)s.x=-20;
      if (s.y<-20)s.y=h+20;if(s.y>h+20)s.y=-20;
      s.phase+=.017;
      const alpha=.18+((Math.sin(s.phase)+1)/2)*.48;
      ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fillStyle="rgba(238,233,255,"+alpha+")";ctx.fill();
    }
    // Connecting the closest stars, bounded by a short threshold.
    for(let i=0;i<stars.length;i++){
      for(let j=i+1;j<stars.length;j++){
        const a=stars[i],b=stars[j],dx=a.x-b.x,dy=a.y-b.y;
        const dist2=dx*dx+dy*dy;
        if(dist2<7800) {
          ctx.strokeStyle=starColor((1-dist2/7800)*.12);
          ctx.lineWidth=.65;
          ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
        }
      }
    }
  }
  if (ctx && !dataSaver) {
    resizeCanvas();
    window.addEventListener("resize",resizeCanvas,{passive:true});
    raf=requestAnimationFrame(renderStars);
    const hero=$("#home");
    hero.addEventListener("pointermove",event=>{
      if(event.pointerType && event.pointerType!=="mouse")return;
      const rect=hero.getBoundingClientRect();
      pointer.x=event.clientX-rect.left;pointer.y=event.clientY-rect.top;
      pointer.active=true;
    },{passive:true});
    hero.addEventListener("pointerleave",()=>pointer.active=false);
  }

  // Mouse-driven hero sculpture tilt.
  const stage=$(".scene-stage");
  if(finePointerQuery.matches && stage) {
    let tx=0,ty=0,sx=0,sy=0,stageRAF=0;
    const tilt=()=>{
      stageRAF=0;
      sx+=(tx-sx)*.12;sy+=(ty-sy)*.12;
      if(!readyForMotion()){stage.style.transform="";return;}
      stage.style.transform="rotateY("+sx.toFixed(2)+"deg) rotateX("+sy.toFixed(2)+"deg)";
      if(Math.abs(tx-sx)+Math.abs(ty-sy)>.08)stageRAF=requestAnimationFrame(tilt);
    };
    const queueTilt=()=>{if(!stageRAF)stageRAF=requestAnimationFrame(tilt)};
    stage.addEventListener("pointermove",e=>{
      const r=stage.getBoundingClientRect();
      tx=((e.clientX-r.left)/r.width-.5)*17;
      ty=-( (e.clientY-r.top)/r.height-.5)*12;
      queueTilt();
    },{passive:true});
    stage.addEventListener("pointerleave",()=>{tx=0;ty=0;queueTilt()});
  }

  // Lightweight 3D project preview tilt, applied only to each visual
  // so existing reveal transforms remain intact.
  if (finePointerQuery.matches) projects.forEach(card=>{
    const visual=$(".project-visual",card);
    let frame=0;
    card.addEventListener("pointermove",e=>{
      if(!readyForMotion())return;
      const box=card.getBoundingClientRect();
      const x=(e.clientX-box.left)/box.width;
      const y=(e.clientY-box.top)/box.height;
      card.style.setProperty("--mx",(x*100).toFixed(1)+"%");
      card.style.setProperty("--my",(y*100).toFixed(1)+"%");
      if(frame)return;
      frame=requestAnimationFrame(()=>{
        visual.style.transform="perspective(950px) rotateY("+((x-.5)*4).toFixed(2)+"deg) rotateX("+((.5-y)*4).toFixed(2)+"deg)";
        frame=0;
      });
    },{passive:true});
    card.addEventListener("pointerleave",()=>visual.style.transform="");
  });

  // Fine-pointer cursor glow, never replaces mouse pointer; disabled on touch.
  if(finePointerQuery.matches && !dataSaver) {
    const aura=$(".cursor-aura"),dot=$(".cursor-dot");
    let x=-500,y=-500,ax=-500,ay=-500,cursorRAF=0;
    function cursorLoop(){
      cursorRAF=requestAnimationFrame(cursorLoop);
      if(!readyForMotion() || document.hidden){aura.style.opacity="0";dot.style.opacity="0";return;}
      ax+=(x-ax)*.16;ay+=(y-ay)*.16;
      aura.style.transform="translate3d("+(ax-150)+"px,"+(ay-150)+"px,0)";
      dot.style.transform="translate3d("+(x-4)+"px,"+(y-4)+"px,0)";
    }
    cursorRAF=requestAnimationFrame(cursorLoop);
    document.addEventListener("pointermove",e=>{
      if(e.pointerType && e.pointerType!=="mouse")return;
      x=e.clientX;y=e.clientY;
      aura.style.opacity="1";dot.style.opacity=".85";
    },{passive:true});
    document.addEventListener("pointerleave",()=>{aura.style.opacity="0";dot.style.opacity="0"});
    document.addEventListener("visibilitychange",()=>{if(document.hidden){aura.style.opacity="0";dot.style.opacity="0"}});
  }

  // Magnetic links: subtle, pointer-only, with keyboard focus staying stable.
  if(finePointerQuery.matches) $$(".magnetic").forEach(link=>{
    link.addEventListener("pointermove",e=>{
      if(!readyForMotion())return;
      const r=link.getBoundingClientRect();
      link.style.setProperty("--mag-x",((e.clientX-r.left-r.width/2)*.13).toFixed(1)+"px");
      link.style.setProperty("--mag-y",((e.clientY-r.top-r.height/2)*.13).toFixed(1)+"px");
    },{passive:true});
    function reset(){link.style.setProperty("--mag-x","0px");link.style.setProperty("--mag-y","0px")}
    link.addEventListener("pointerleave",reset);
    link.addEventListener("blur",reset);
  });

  // Keep scroll progression correct when font swap changes layout.
  if(document.fonts?.ready)document.fonts.ready.then(drawScroll);
})();

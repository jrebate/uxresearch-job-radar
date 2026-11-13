/* Gráfica de evolución del Radar UX Research: dibujo interactivo (SVG) y descarga en PNG con la marca de CentaurUX.
   La usan index.html (panel "Evolución") y grafica.html (versión para incrustar). */
(function () {
  const MES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const ISO = "M424.25 101.35L712.05 101.35A143.90 143.90 0 0 1 663.49 209.13A206.80 206.80 0 0 1 680.35 558.08L680.35 740.85L489.11 595.97A239.90 239.90 0 1 1 411.81 242.86A208.70 208.70 0 0 1 466.23 202.93A143.90 143.90 0 0 1 424.25 101.35ZM411.81 242.86A239.90 239.90 0 0 1 496.39 320.73L416.71 539.88A208.70 208.70 0 0 1 411.81 242.86Z";
  const SERIES = [
    {key:"pf", cnt:"f", c:"var(--ia-flujo)", name:"Piden investigar con IA", short:"con IA", dash:""},
    {key:"po", cnt:"o", c:"var(--ia-objeto)", name:"Investigan sobre IA", short:"sobre IA", dash:"5 4"},
    {key:"pz", cnt:"z", c:"var(--ia-ninguna)", name:"No aparece la IA", short:"sin IA", dash:"1 4"}
  ];
  const refDate = r => r.fecha || r.anadida || "";
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const cap = t => t.replace(/^./, c => c.toUpperCase());
  const lab = k => { const [yy, mm] = k.split("-"); return MES[+mm-1] + " " + yy; };

  // Porcentajes con ventana móvil de tres meses
  function points(rows) {
    const by = {};
    rows.forEach(r => { const d = refDate(r); if (!d) return; const k = d.slice(0,7); const g = by[k] ||= {n:0, f:0, o:0, z:0}; g.n++; if (r.ia === "ninguna") g.z++; if (r.ia === "flujo" || r.ia === "ambos") g.f++; if (r.ia === "objeto" || r.ia === "ambos") g.o++; });
    const ks = Object.keys(by).sort(); if (ks.length < 2) return null;
    const months = []; let [y, m] = ks[0].split("-").map(Number); const [y2, m2] = ks[ks.length-1].split("-").map(Number);
    while (y < y2 || (y === y2 && m <= m2)) { months.push(y + "-" + String(m).padStart(2,"0")); m++; if (m > 12) { m = 1; y++; } }
    const pts = months.map((k, i) => {
      const w = months.slice(Math.max(0, i-2), i+1).map(x => by[x] || {n:0,f:0,o:0,z:0});
      const n = w.reduce((a,b) => a + b.n, 0), f = w.reduce((a,b) => a + b.f, 0), o = w.reduce((a,b) => a + b.o, 0), z = w.reduce((a,b) => a + b.z, 0);
      return {k, n, f, o, z, pf: n ? f/n*100 : null, po: n ? o/n*100 : null, pz: n ? z/n*100 : null, from: months[Math.max(0, i-2)]};
    });
    const total = rows.filter(r => refDate(r)).length;
    return {pts, months, total, first: months[0], last: months[months.length-1]};
  }

  // Gráfica interactiva en SVG dentro de `box` (necesita los estilos .evochart)
  function render(box, rows) {
    if (!box) return; box.replaceChildren();
    const P = points(rows); if (!P) { box.append(el("p","note","Hacen falta al menos dos meses de datos.")); return; }
    const {pts, months} = P;
    const W = Math.max(300, Math.round(box.clientWidth) || 640), narrow = W < 520, H = narrow ? 210 : 240, L = 36, R = narrow ? 92 : 132, T = 12, B = 26, pw = W-L-R, ph = H-T-B;
    const x = i => L + (pts.length === 1 ? pw/2 : i * pw / (pts.length-1)), yv = v => T + ph - v/100*ph;
    const NS = "http://www.w3.org/2000/svg", s = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
    const svg = s("svg", {viewBox:`0 0 ${W} ${H}`, width:W, height:H, role:"img", "aria-label":"Porcentaje de ofertas que piden investigar con IA, que investigan sobre IA y en las que no aparece la IA, por mes"});
    [0,25,50,75,100].forEach(v => { svg.append(s("line",{class:"grid",x1:L,x2:L+pw,y1:yv(v),y2:yv(v)})); const t = s("text",{class:"axis",x:L-6,y:yv(v)+4,"text-anchor":"end"}); t.textContent = v + " %"; svg.append(t); });
    const ml = k => { const [yy, mm] = k.split("-"); return MES[+mm-1].slice(0,3) + (mm === "01" || k === months[0] ? " " + yy.slice(2) : ""); };
    const step = Math.ceil(pts.length / (narrow ? 4 : 8));
    pts.forEach((p, i) => { const last = pts.length-1; if (i !== last && (i % step || (last - i) * pw / last < 34)) return; const t = s("text",{class:"axis",x:x(i),y:H-6,"text-anchor":"middle"}); t.textContent = ml(p.k); svg.append(t); });
    SERIES.forEach(({key, c, dash}) => {
      const d = pts.map((p, i) => p[key] == null ? "" : (i && pts[i-1][key] != null ? "L" : "M") + x(i).toFixed(1) + " " + yv(p[key]).toFixed(1)).join(" ");
      svg.append(s("path",{d, fill:"none", stroke:c, "stroke-width":2, "stroke-linejoin":"round", "stroke-linecap":"round", "stroke-dasharray":dash}));
      const li = pts.length-1, lp = pts[li];
      if (lp[key] != null) svg.append(s("circle",{cx:x(li),cy:yv(lp[key]),r:4,fill:c,stroke:"var(--surface)","stroke-width":2}));
    });
    const lp = pts[pts.length-1];
    const labs = SERIES.filter(se => lp[se.key] != null).map(se => [yv(lp[se.key]), lp[se.key], se.short]).sort((a,b) => a[0]-b[0]);
    for (let i = 1; i < labs.length; i++) if (labs[i][0] - labs[i-1][0] < 16) labs[i][0] = labs[i-1][0] + 16;
    const over = labs.length ? labs[labs.length-1][0] - (T + ph) : 0; if (over > 0) labs.forEach(l => l[0] -= over);
    labs.forEach(([yy, v, nm]) => { const t = s("text",{class:"lbl",x:L+pw+10,y:yy+4}); t.textContent = Math.round(v) + " % " + nm; svg.append(t); });
    const cross = s("line",{class:"cross",x1:0,x2:0,y1:T,y2:T+ph,visibility:"hidden"}); svg.append(cross);
    const dots = SERIES.map(({c}) => { const ci = s("circle",{r:4,fill:c,stroke:"var(--surface)","stroke-width":2,visibility:"hidden"}); svg.append(ci); return ci; });
    const hit = s("rect",{x:L-10,y:0,width:pw+20,height:H,fill:"#000","fill-opacity":0,"pointer-events":"all"}); svg.append(hit);
    const tip = el("div","tip"); tip.hidden = true;
    const rw = (...k) => { const d = el("div","r"); d.append(...k); return d; };
    const show = i => {
      const p = pts[i]; cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.setAttribute("visibility","visible");
      SERIES.forEach(({key}, j) => { if (p[key] == null) { dots[j].setAttribute("visibility","hidden"); return; } dots[j].setAttribute("cx", x(i)); dots[j].setAttribute("cy", yv(p[key])); dots[j].setAttribute("visibility","visible"); });
      tip.replaceChildren();
      tip.append(el("b", null, cap(lab(p.k))));
      const sub = el("div", null, p.from === p.k ? "Solo este mes" : "De " + lab(p.from).replace(/ \d+$/, p.from.slice(0,4) === p.k.slice(0,4) ? "" : " " + p.from.slice(0,4)) + " a " + lab(p.k)); sub.style.color = "var(--muted)"; sub.style.marginBottom = "4px"; tip.append(sub);
      SERIES.forEach(({key, c, name, cnt}) => {
        const r = el("div","r"); const sw = el("i"); sw.style.background = c; r.append(sw, el("span", null, name), el("span", null, p[key] == null ? "—" : Math.round(p[key]) + " % (" + p[cnt] + ")")); tip.append(r);
      });
      tip.append(rw(el("span", null, "Ofertas en la ventana"), el("span", null, String(p.n))));
      tip.hidden = false;
      const bw = box.clientWidth, px = x(i), tw = tip.offsetWidth;
      tip.style.left = Math.min(Math.max(0, px + 12 + tw > bw ? px - tw - 12 : px + 12), Math.max(0, bw - tw)) + "px";
    };
    const hide = () => { tip.hidden = true; cross.setAttribute("visibility","hidden"); dots.forEach(d => d.setAttribute("visibility","hidden")); };
    const near = ev => { const r = svg.getBoundingClientRect(); const sx = (ev.clientX - r.left) / r.width * W; return Math.max(0, Math.min(pts.length-1, Math.round((sx - L) / (pw / (pts.length-1))))); };
    hit.addEventListener("pointermove", ev => show(near(ev)));
    hit.addEventListener("pointerdown", ev => show(near(ev)));
    hit.addEventListener("pointerleave", hide);
    svg.setAttribute("tabindex","0"); let ki = pts.length-1;
    svg.addEventListener("keydown", ev => { if (ev.key === "ArrowLeft") { ki = Math.max(0, ki-1); show(ki); ev.preventDefault(); } else if (ev.key === "ArrowRight") { ki = Math.min(pts.length-1, ki+1); show(ki); ev.preventDefault(); } else if (ev.key === "Escape") hide(); });
    svg.addEventListener("focus", () => show(ki)); svg.addEventListener("blur", hide);
    box.append(svg, tip);
  }

  // Texto de periodo: "sep 2025 – nov 2026"
  function periodo(P) { const f = k => MES[+k.slice(5,7)-1].slice(0,3) + " " + k.slice(0,4); return f(P.first) + " – " + f(P.last); }
  function subtitulo(P) { return P.total + " ofertas de UX Research, " + periodo(P); }

  // Imagen PNG (1200 × 675, a doble resolución) con la marca de CentaurUX
  async function png(rows, meta) {
    const P = points(rows); if (!P) throw new Error("sin datos");
    const {pts} = P;
    const F = {d:'"Bricolage Grotesque", "Segoe UI", system-ui, sans-serif', b:'"IBM Plex Sans", "Segoe UI", system-ui, sans-serif', m:'"IBM Plex Mono", ui-monospace, Menlo, monospace'};
    try { await Promise.all(["700 38px Bricolage Grotesque","400 16px IBM Plex Sans","600 16px IBM Plex Sans","500 14px IBM Plex Mono"].map(f => document.fonts.load(f))); } catch (e) {}
    const C = {bg:"#ffffff", ink:"#18202b", muted:"#5b6676", line:"#dde1e7", pf:"#1b8a7a", po:"#b7791f", pz:"#8a94a3", band:"#111111", lime:"#D9EC39", soft:"#a7b0bc"};
    const W = 1200, H = 675, S = 2;
    const cv = document.createElement("canvas"); cv.width = W*S; cv.height = H*S;
    const g = cv.getContext("2d"); g.scale(S, S);
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    const txt = (t, x, y, font, color, align) => { g.font = font; g.fillStyle = color; g.textAlign = align || "left"; g.textBaseline = "alphabetic"; g.fillText(t, x, y); return g.measureText(t).width; };
    const PAD = 56;
    // Cabecera
    txt("RADAR UX RESEARCH", PAD, 62, "500 14px " + F.m, C.muted);
    txt("Cómo aparece la IA en las ofertas de UX Research", PAD, 108, "700 38px " + F.d, C.ink);
    txt("Porcentaje de ofertas en cada ventana de tres meses · " + subtitulo(P), PAD, 140, "400 17px " + F.b, C.muted);
    // Leyenda
    const dashOf = k => k === "po" ? [7,5] : k === "pz" ? [0.1,6] : [];
    let lx = PAD;
    SERIES.forEach(({key, name}) => {
      g.strokeStyle = C[key]; g.lineWidth = 3; g.lineCap = "round"; g.setLineDash(dashOf(key));
      g.beginPath(); g.moveTo(lx, 176); g.lineTo(lx + 26, 176); g.stroke(); g.setLineDash([]);
      lx += 36 + txt(name, lx + 36, 181, "500 15px " + F.b, C.ink) + 28;
    });
    // Zona de la gráfica
    const L = PAD + 44, R = W - PAD - 150, T = 212, Bt = 528, pw = R - L, ph = Bt - T;
    const x = i => L + i * pw / (pts.length-1), yv = v => T + ph - v/100*ph;
    g.lineWidth = 1;
    [0,25,50,75,100].forEach(v => {
      g.strokeStyle = C.line; g.beginPath(); g.moveTo(L, yv(v) + .5); g.lineTo(R, yv(v) + .5); g.stroke();
      txt(v + " %", L - 10, yv(v) + 5, "400 13px " + F.m, C.muted, "right");
    });
    const step = Math.ceil(pts.length / 8), last = pts.length-1;
    pts.forEach((p, i) => {
      if (i !== last && (i % step || (last - i) * pw / last < 50)) return;
      const [yy, mm] = p.k.split("-");
      txt(MES[+mm-1].slice(0,3) + (mm === "01" || i === 0 || i === last ? " " + yy.slice(2) : ""), x(i), Bt + 26, "400 13px " + F.m, C.muted, "center");
    });
    SERIES.forEach(({key}) => {
      g.strokeStyle = C[key]; g.lineWidth = key === "pf" ? 3.5 : 3; g.lineJoin = "round"; g.lineCap = "round"; g.setLineDash(dashOf(key));
      g.beginPath(); let on = false;
      pts.forEach((p, i) => { if (p[key] == null) { on = false; return; } if (on) g.lineTo(x(i), yv(p[key])); else { g.moveTo(x(i), yv(p[key])); on = true; } });
      g.stroke(); g.setLineDash([]);
      const lp = pts[last]; if (lp[key] != null) { g.beginPath(); g.arc(x(last), yv(lp[key]), 6, 0, Math.PI*2); g.fillStyle = C[key]; g.fill(); g.lineWidth = 3; g.strokeStyle = C.bg; g.stroke(); }
    });
    const lp = pts[last];
    const labs = SERIES.filter(se => lp[se.key] != null).map(se => [yv(lp[se.key]), lp[se.key], se.short, se.key]).sort((a,b) => a[0]-b[0]);
    for (let i = 1; i < labs.length; i++) if (labs[i][0] - labs[i-1][0] < 24) labs[i][0] = labs[i-1][0] + 24;
    const over = labs.length ? labs[labs.length-1][0] - Bt : 0; if (over > 0) labs.forEach(l => l[0] -= over);
    labs.forEach(([yy, v, nm, key]) => {
      const w = txt(Math.round(v) + " %", R + 16, yy + 6, "700 18px " + F.b, C[key] === C.pz ? C.muted : C[key]);
      txt(nm, R + 22 + w, yy + 6, "400 15px " + F.b, C.ink);
    });
    // Nota
    const act = meta && meta.ultima_busqueda ? meta.ultima_busqueda.split("-").reverse().join("/") : "";
    txt("Media de tres meses para suavizar los meses con pocas ofertas. «Las dos cosas» cuenta en las dos primeras líneas." + (act ? " Datos a " + act + "." : ""), PAD, 590, "400 13.5px " + F.b, C.muted);
    // Franja de marca
    const BY = H - 64;
    g.fillStyle = C.band; g.fillRect(0, BY, W, 64);
    g.save(); g.translate(PAD, BY + 14); g.scale(36/840, 36/840); g.fillStyle = "#ffffff"; g.fill(new Path2D(ISO), "evenodd"); g.restore();
    txt("CentaurUX", PAD + 46, BY + 40, "700 22px " + F.d, "#ffffff");
    const wUrl = txt("centaurux.es", W - PAD, BY + 39, "500 18px " + F.m, C.lime, "right");
    txt("Radar UX Research · CC BY 4.0 · ", W - PAD - wUrl, BY + 39, "400 14px " + F.b, C.soft, "right");
    const blob = await new Promise(res => cv.toBlob(res, "image/png"));
    return blob;
  }

  async function descargar(rows, meta) {
    const blob = await png(rows, meta);
    const fecha = (meta && meta.ultima_busqueda) || new Date().toISOString().slice(0,10);
    const name = "radar-ux-research-ia-" + fecha + ".png";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return {blob, name};
  }

  window.RadarChart = {points, render, png, descargar, subtitulo, ISO, SERIES};
})();

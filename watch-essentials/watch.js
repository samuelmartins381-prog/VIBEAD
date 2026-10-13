/* Watch Essentials — the watch.
 * A technically coherent SVG wristwatch (≈40 mm case, 20 mm lug width,
 * fixed polished bezel, crown at 3 o'clock, small seconds at 6) with an
 * interaction layer: component hit areas, focus veil, highlights,
 * technical call-outs and component-specific demonstrations.
 *
 * Scale: 1 mm ≈ 6 SVG units. Watch centre at (220, 270). */
(function () {
  const { anim, tween, lerp, ease, reduced } = window.Motion;
  const NS = "http://www.w3.org/2000/svg";
  const CX = 220, CY = 270;
  const R = { case: 122, bezelOut: 114, bezelIn: 102, dial: 101, track: 97 };
  const SUB = { x: CX, y: 322, r: 23 };
  const CROWN_PULL = 8;

  // Camera framings: the region that must stay visible, in watch units.
  // The viewBox is expanded around it to match the stage's aspect ratio.
  const BOX = {
    overview: { x: 8, y: 104, w: 424, h: 332 },
    crystal: { x: 8, y: 118, w: 404, h: 304 },
    bezel: { x: 34, y: 112, w: 402, h: 304 },
    case: { x: 34, y: 116, w: 402, h: 316 },
    crown: { x: 84, y: 150, w: 352, h: 240 },
    lugs: { x: 6, y: 104, w: 424, h: 340 },
    quiz: { x: 78, y: 114, w: 302, h: 312 },
    done: { x: 52, y: 100, w: 336, h: 340 },
  };

  // Technical call-outs: anchor on the part, elbow, end of the leader.
  const CALLOUT = {
    crystal: { a: [178, 302], e: [94, 258], z: [16, 258], align: "start" },
    bezel: { a: [313.5, 216], e: [354, 184], z: [428, 184], align: "end" },
    case: { a: [327, 320], e: [360, 354], z: [430, 354], align: "end" },
    crown: { a: [362, 262], e: [392, 228], z: [430, 228], align: "end" },
    lugs: {
      a: [142, 388], e: [100, 428], z: [14, 428], align: "start",
      extra: [[142, 152], [298, 152], [298, 388]],
    },
  };

  const LUG = "M123,232 C123,196 126,160 133,135 Q135,128.5 141.5,128.5 L153,128.5 Q158,128.5 158,134 L158,232 Z";
  const LUG_T = ["", "translate(440,0) scale(-1,1)", "translate(0,540) scale(1,-1)", "translate(440,540) scale(-1,-1)"];
  const annulus = (ro, ri) =>
    `M${CX - ro},${CY} a${ro},${ro} 0 1,0 ${ro * 2},0 a${ro},${ro} 0 1,0 ${-ro * 2},0 Z ` +
    `M${CX - ri},${CY} a${ri},${ri} 0 1,0 ${ri * 2},0 a${ri},${ri} 0 1,0 ${-ri * 2},0 Z`;

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  const polar = (r, deg, cx = CX, cy = CY) => {
    const a = (deg * Math.PI) / 180;
    return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  };

  function defs(svg) {
    const d = el("defs", {}, svg);
    const grad = (id, type, attrs, stops) => {
      const g = el(type, { id, ...attrs }, d);
      stops.forEach(([o, c, op]) => el("stop", { offset: o, "stop-color": c, "stop-opacity": op ?? 1 }, g));
      return g;
    };
    // Brushed steel middle case — soft, low-contrast light.
    grad("g-case", "linearGradient", { x1: 0, y1: 0, x2: 1, y2: 1 }, [
      [0, "#f6f4f0"], [0.3, "#d9d5ce"], [0.55, "#a8a39b"], [0.78, "#cfcac2"], [1, "#7d7871"],
    ]);
    // Polished bezel — sharper reflections, opposite light direction.
    grad("g-bezel", "linearGradient", { x1: 0.15, y1: 0, x2: 0.85, y2: 1 }, [
      [0, "#fffdf9"], [0.22, "#b9b4ac"], [0.42, "#f2efe9"], [0.6, "#8d8880"], [0.8, "#e4e0d9"], [1, "#6c6760"],
    ]);
    grad("g-lug", "linearGradient", { x1: 0, y1: 0, x2: 1, y2: 0 }, [
      [0, "#8e8982"], [0.25, "#e9e6e0"], [0.6, "#c4bfb7"], [1, "#9b968e"],
    ]);
    grad("g-crown", "linearGradient", { x1: 0, y1: 0, x2: 0, y2: 1 }, [
      [0, "#77726b"], [0.3, "#e7e3dc"], [0.5, "#fbfaf6"], [0.72, "#bdb8b0"], [1, "#6b665f"],
    ]);
    grad("g-dial", "radialGradient", { cx: 0.5, cy: 0.5, r: 0.5 }, [
      [0, "#3a3733"], [0.62, "#22201e"], [1, "#121110"],
    ]);
    grad("g-sheen", "linearGradient", { x1: 0, y1: 0, x2: 1, y2: 1 }, [
      [0, "#fff", 0], [0.38, "#fff", 0.0], [0.5, "#fff", 0.09], [0.62, "#fff", 0], [1, "#fff", 0],
    ]);
    grad("g-gold", "linearGradient", { x1: 0, y1: 0, x2: 1, y2: 0 }, [
      [0, "#f3e6c6"], [0.5, "#f3e6c6"], [0.5, "#b89a62"], [1, "#a8894f"],
    ]);
    grad("g-gold-r", "radialGradient", { cx: 0.4, cy: 0.35, r: 0.7 }, [
      [0, "#f8edd2"], [1, "#a38548"],
    ]);
    grad("g-leather", "linearGradient", { x1: 0, y1: 0, x2: 1, y2: 0 }, [
      [0, "#1a1310"], [0.07, "#3b2a22"], [0.5, "#4a352a"], [0.93, "#3b2a22"], [1, "#1a1310"],
    ]);
    grad("g-crystal", "radialGradient", { cx: 0.5, cy: 0.5, r: 0.5 }, [
      [0, "#fff", 0], [0.86, "#fff", 0.0], [1, "#fff", 0.1],
    ]);
    grad("g-reflect", "linearGradient", { x1: 0, y1: 0, x2: 0.6, y2: 1 }, [
      [0, "#fff", 0.16], [0.6, "#fff", 0.02], [1, "#fff", 0],
    ]);
    grad("g-glint", "linearGradient", { x1: 0, y1: 0, x2: 1, y2: 0 }, [
      [0, "#fff", 0], [0.45, "#fff", 0.22], [0.5, "#fff", 0.42], [0.55, "#fff", 0.22], [1, "#fff", 0],
    ]);

    // Strap fade (top & bottom) so the strap dissolves into the plate.
    const fade = el("linearGradient", { id: "g-fade", x1: 0, y1: -260, x2: 0, y2: 800, gradientUnits: "userSpaceOnUse" }, d);
    [[0, 0], [0.24, 1], [0.76, 1], [1, 0]].forEach(([o, op]) => el("stop", { offset: o, "stop-color": "#fff", "stop-opacity": op }, fade));
    const fm = el("mask", { id: "m-fade", maskUnits: "userSpaceOnUse", x: -600, y: -600, width: 1640, height: 1800 }, d);
    el("rect", { x: -600, y: -600, width: 1640, height: 1800, fill: "url(#g-fade)" }, fm);

    // Filters
    const hs = el("filter", { id: "f-hand", x: "-50%", y: "-50%", width: "200%", height: "200%" }, d);
    el("feDropShadow", { dx: 1.6, dy: 2.6, stdDeviation: 1.6, "flood-color": "#000", "flood-opacity": 0.55 }, hs);
    const is = el("filter", { id: "f-index", x: "-50%", y: "-50%", width: "200%", height: "200%" }, d);
    el("feDropShadow", { dx: 0.8, dy: 1.2, stdDeviation: 0.6, "flood-color": "#000", "flood-opacity": 0.6 }, is);
    const glow = el("filter", { id: "f-glow", x: "-50%", y: "-50%", width: "200%", height: "200%" }, d);
    el("feGaussianBlur", { stdDeviation: 4 }, glow);

    // Clips & masks
    const cc = el("clipPath", { id: "c-crystal" }, d);
    el("circle", { cx: CX, cy: CY, r: R.dial }, cc);
    const cs = el("clipPath", { id: "c-sub" }, d);
    el("circle", { cx: SUB.x, cy: SUB.y, r: SUB.r }, cs);
    const cr = el("clipPath", { id: "c-crown" }, d);
    el("rect", { x: 347, y: 249, width: 20, height: 42, rx: 3.5 }, cr);
    // Outside-the-case mask: lugs are only "lugs" where they leave the case.
    const oc = el("mask", { id: "m-outcase", maskUnits: "userSpaceOnUse", x: -200, y: -200, width: 840, height: 940 }, d);
    el("rect", { x: -200, y: -200, width: 840, height: 940, fill: "#fff" }, oc);
    el("circle", { cx: CX, cy: CY, r: R.case - 0.5, fill: "#000" }, oc);
    const ob = el("mask", { id: "m-outbezel", maskUnits: "userSpaceOnUse", x: -200, y: -200, width: 840, height: 940 }, d);
    el("rect", { x: -200, y: -200, width: 840, height: 940, fill: "#fff" }, ob);
    el("circle", { cx: CX, cy: CY, r: R.bezelOut, fill: "#000" }, ob);
    return d;
  }

  function create(svg) {
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    const d = defs(svg);
    const root = el("g", { class: "w-root" }, svg);

    /* ---------- Materials (the rendered watch) ---------- */
    const mat = el("g", { class: "w-mat" }, root);

    // Contact shadow on the plate.
    const sg = el("radialGradient", { id: "g-shadow" }, d);
    [[0, 0.42], [0.72, 0.3], [1, 0]].forEach(([o, op]) => el("stop", { offset: o, "stop-color": "#2b2118", "stop-opacity": op }, sg));
    const ssg = el("linearGradient", { id: "g-strap-shadow", x1: 0, y1: 0, x2: 1, y2: 0 }, d);
    [[0, 0], [0.12, 0.16], [0.88, 0.16], [1, 0]].forEach(([o, op]) => el("stop", { offset: o, "stop-color": "#2b2118", "stop-opacity": op }, ssg));
    el("rect", { x: 152, y: -300, width: 144, height: 1140, fill: "url(#g-strap-shadow)", mask: "url(#m-fade)" }, mat);
    el("circle", { cx: CX + 5, cy: CY + 10, r: R.case + 20, fill: "url(#g-shadow)" }, mat);

    // Straps (top & bottom), tapering from 20 mm to 18 mm.
    const straps = el("g", { mask: "url(#m-fade)" }, mat);
    const strapPaths = [
      "M159,236 L281,236 L275,-280 L165,-280 Z",
      "M159,304 L281,304 L275,820 L165,820 Z",
    ];
    strapPaths.forEach((p) => {
      el("path", { d: p, fill: "url(#g-leather)" }, straps);
    });
    // Soft sheen along the strap's crown, and edge stitching.
    const sheen = el("linearGradient", { id: "g-strap-sheen", x1: 0, y1: 0, x2: 1, y2: 0 }, d);
    [[0, 0], [0.38, 0], [0.5, 0.07], [0.62, 0]].forEach(([o, op]) => el("stop", { offset: o, "stop-color": "#fff", "stop-opacity": op }, sheen));
    strapPaths.forEach((p) => el("path", { d: p, fill: "url(#g-strap-sheen)" }, straps));
    [[166, 236, 171, -280], [274, 236, 269, -280], [166, 304, 171, 820], [274, 304, 269, 820]].forEach(([x1, y1, x2, y2]) =>
      el("line", { x1, y1, x2, y2, stroke: "#9d8a74", "stroke-width": 1, "stroke-dasharray": "4.5 3.2", opacity: 0.55, "stroke-linecap": "round" }, straps)
    );
    // Ambient occlusion where strap meets the case.
    const ao = el("linearGradient", { id: "g-ao", x1: 0, y1: 0, x2: 0, y2: 1 }, d);
    [[0, "#000", 0], [1, "#000", 0.45]].forEach(([o, c, op]) => el("stop", { offset: o, "stop-color": c, "stop-opacity": op }, ao));
    el("rect", { x: 159, y: 96, width: 122, height: 40, fill: "url(#g-ao)" }, straps);
    el("rect", { x: 159, y: 404, width: 122, height: 40, fill: "url(#g-ao)", transform: "rotate(180 220 424)" }, straps);

    // Lugs
    const lugs = el("g", {}, mat);
    LUG_T.forEach((t) => {
      const g = el("g", { transform: t }, lugs);
      el("path", { d: LUG, fill: "url(#g-lug)", stroke: "#6f6a63", "stroke-width": 0.6 }, g);
      el("path", { d: "M128.5,196 C128.5,170 131,152 136.5,136", fill: "none", stroke: "#fff", "stroke-width": 1.6, opacity: 0.75, "stroke-linecap": "round" }, g);
      el("path", { d: "M155.5,196 L155.5,136", fill: "none", stroke: "#5f5a53", "stroke-width": 0.8, opacity: 0.35 }, g);
    });

    // Crown: stem, case tube, then the crown itself (moves when pulled).
    const crownStatic = el("g", {}, mat);
    el("rect", { x: 338, y: 265.5, width: 22, height: 9, fill: "#8d887f" }, crownStatic);
    el("rect", { x: 338, y: 261, width: 11, height: 18, rx: 1.5, fill: "url(#g-crown)", stroke: "#6c675f", "stroke-width": 0.5 }, crownStatic);
    const crown = el("g", { class: "w-crown" }, mat);
    el("rect", { x: 347, y: 249, width: 20, height: 42, rx: 3.5, fill: "url(#g-crown)", stroke: "#625d56", "stroke-width": 0.6 }, crown);
    const knurl = el("g", { "clip-path": "url(#c-crown)" }, crown);
    const knurlLines = [];
    for (let i = 0; i < 24; i++) knurlLines.push(el("line", { x1: 349, x2: 365, stroke: "#4f4a44", "stroke-width": 0.7 }, knurl));
    el("rect", { x: 365, y: 252, width: 4, height: 36, rx: 1.8, fill: "url(#g-crown)", stroke: "#625d56", "stroke-width": 0.5 }, crown);
    function setKnurl(phase) {
      knurlLines.forEach((ln, i) => {
        const th = (i / knurlLines.length) * Math.PI * 2 + phase;
        const c = Math.cos(th);
        const y = 270 + 20.5 * Math.sin(th);
        ln.setAttribute("y1", y);
        ln.setAttribute("y2", y);
        ln.setAttribute("opacity", c > 0 ? (0.25 + 0.55 * c).toFixed(3) : 0);
      });
    }
    setKnurl(0);

    // Middle case
    el("circle", { cx: CX, cy: CY, r: R.case, fill: "url(#g-case)", stroke: "#6a655e", "stroke-width": 0.7 }, mat);
    el("circle", { cx: CX, cy: CY, r: R.case - 1.2, fill: "none", stroke: "#fff", "stroke-width": 0.6, opacity: 0.5 }, mat);

    // Bezel (fixed, polished)
    el("circle", { cx: CX, cy: CY, r: R.bezelOut, fill: "url(#g-bezel)", stroke: "#5f5a53", "stroke-width": 0.6 }, mat);
    el("circle", { cx: CX, cy: CY, r: R.bezelOut - 3.5, fill: "none", stroke: "#fff", "stroke-width": 0.5, opacity: 0.45 }, mat);

    // Dial
    const dial = el("g", { "clip-path": "url(#c-crystal)" }, mat);
    el("circle", { cx: CX, cy: CY, r: R.dial, fill: "url(#g-dial)" }, dial);
    const rays = el("g", { opacity: 0.6 }, dial);
    for (let i = 0; i < 180; i++) {
      const [x2, y2] = polar(R.dial, i * 2);
      el("line", { x1: CX, y1: CY, x2, y2, stroke: i % 2 ? "#fff" : "#000", "stroke-width": 0.5, opacity: i % 2 ? 0.035 : 0.05 }, rays);
    }
    el("rect", { x: CX - 110, y: CY - 110, width: 220, height: 220, fill: "url(#g-sheen)" }, dial);
    el("rect", { x: CX - 110, y: CY - 110, width: 220, height: 220, fill: "url(#g-sheen)", transform: `rotate(90 ${CX} ${CY})`, opacity: 0.6 }, dial);
    // Rehaut shadow
    el("circle", { cx: CX, cy: CY, r: R.dial - 0.5, fill: "none", stroke: "#000", "stroke-width": 3, opacity: 0.45 }, dial);

    // Minute track
    const track = el("g", { stroke: "#d8c49b", "stroke-linecap": "butt" }, dial);
    for (let i = 0; i < 60; i++) {
      const five = i % 5 === 0;
      const [x1, y1] = polar(five ? 90.5 : 93, i * 6);
      const [x2, y2] = polar(96.5, i * 6);
      el("line", { x1, y1, x2, y2, "stroke-width": five ? 1.3 : 0.55, opacity: five ? 0.95 : 0.7 }, track);
    }
    el("circle", { cx: CX, cy: CY, r: 96.8, fill: "none", stroke: "#d8c49b", "stroke-width": 0.4, opacity: 0.5 }, dial);

    // Applied baton indices (no index at 6 — the small seconds sits there).
    const idx = el("g", { filter: "url(#f-index)" }, dial);
    for (let h = 0; h < 12; h++) {
      if (h === 6) continue;
      const g = el("g", { transform: `rotate(${h * 30} ${CX} ${CY})` }, idx);
      if (h === 0) {
        el("rect", { x: CX - 5.6, y: CY - 88, width: 3.6, height: 19, fill: "url(#g-gold)", rx: 0.4 }, g);
        el("rect", { x: CX + 2, y: CY - 88, width: 3.6, height: 19, fill: "url(#g-gold)", rx: 0.4 }, g);
      } else {
        el("rect", { x: CX - 2, y: CY - 88, width: 4, height: 17, fill: "url(#g-gold)", rx: 0.4 }, g);
      }
    }
    // Dial signature — generic, unbranded.
    const sig = el("text", { x: CX, y: CY - 46, "text-anchor": "middle", class: "w-dialtext" }, dial);
    sig.textContent = "ESSENTIALS";
    const sig2 = el("text", { x: CX, y: CY - 36, "text-anchor": "middle", class: "w-dialtext w-dialtext--small" }, dial);
    sig2.textContent = "AUTOMATIC";

    // Small seconds sub-dial with snailed finish.
    const sub = el("g", {}, dial);
    el("circle", { cx: SUB.x, cy: SUB.y, r: SUB.r, fill: "#161514", stroke: "#d8c49b", "stroke-width": 0.5, opacity: 1 }, sub);
    const snail = el("g", { "clip-path": "url(#c-sub)", opacity: 0.9 }, sub);
    for (let r = 2; r < SUB.r; r += 1.5) el("circle", { cx: SUB.x, cy: SUB.y, r, fill: "none", stroke: "#fff", "stroke-width": 0.35, opacity: 0.045 }, snail);
    for (let i = 0; i < 60; i++) {
      const big = i % 15 === 0;
      const [x1, y1] = polar(big ? 17.5 : 19.5, i * 6, SUB.x, SUB.y);
      const [x2, y2] = polar(21.5, i * 6, SUB.x, SUB.y);
      el("line", { x1, y1, x2, y2, stroke: "#d8c49b", "stroke-width": big ? 0.9 : 0.4, opacity: 0.8 }, sub);
    }
    const secHand = el("g", {}, sub);
    el("line", { x1: SUB.x, y1: SUB.y + 5, x2: SUB.x, y2: SUB.y - 19.5, stroke: "#e8d6ae", "stroke-width": 0.9, "stroke-linecap": "round" }, secHand);
    el("circle", { cx: SUB.x, cy: SUB.y, r: 1.8, fill: "#e8d6ae" }, sub);

    // Dauphine hands, faceted.
    const hands = el("g", { filter: "url(#f-hand)" }, mat);
    function dauphine(L, w, tail) {
      const g = el("g", {}, hands);
      el("path", { d: `M${CX},${CY + tail} L${CX - w / 2},${CY} L${CX},${CY - L} Z`, fill: "#f5e8c8" }, g);
      el("path", { d: `M${CX},${CY + tail} L${CX + w / 2},${CY} L${CX},${CY - L} Z`, fill: "#b2935a" }, g);
      return g;
    }
    const hourHand = dauphine(58, 8, 10);
    const minHand = dauphine(88, 6, 13);
    el("circle", { cx: CX, cy: CY, r: 4.6, fill: "url(#g-gold-r)" }, mat);
    el("circle", { cx: CX, cy: CY, r: 1.5, fill: "#2a2522" }, mat);

    // Crystal
    const crystal = el("g", {}, mat);
    el("circle", { cx: CX, cy: CY, r: R.dial, fill: "url(#g-crystal)" }, crystal);
    el("path", { d: `M${CX - 96},${CY - 4} A96,96 0 0 1 ${CX + 4},${CY - 96} L${CX + 4},${CY - 82} A82,82 0 0 0 ${CX - 82},${CY - 4} Z`, fill: "url(#g-reflect)", opacity: 0.5 }, crystal);
    el("circle", { cx: CX, cy: CY, r: R.dial - 0.3, fill: "none", stroke: "#fff", "stroke-width": 0.7, opacity: 0.4 }, crystal);
    const glintClip = el("g", { "clip-path": "url(#c-crystal)" }, crystal);
    const glintRot = el("g", { transform: `rotate(35 ${CX} ${CY})` }, glintClip);
    const glint = el("rect", { x: CX - 36, y: CY - 140, width: 72, height: 280, fill: "url(#g-glint)", class: "w-glint" }, glintRot);
    glint.style.transform = "translateX(-260px)";

    /* ---------- Blueprint (construction drawing for the build-in) ---------- */
    const bp = el("g", { class: "w-blueprint", fill: "none", stroke: "#2b2724", "stroke-width": 0.8 }, root);
    const bpParts = [];
    const bpAdd = (tag, a) => bpParts.push(el(tag, { ...a, pathLength: 1 }, bp));
    bpAdd("line", { x1: CX - 160, y1: CY, x2: CX + 160, y2: CY, opacity: 0.35 });
    bpAdd("line", { x1: CX, y1: CY - 170, x2: CX, y2: CY + 170, opacity: 0.35 });
    [R.case, R.bezelOut, R.bezelIn, 96.8].forEach((r) => bpAdd("circle", { cx: CX, cy: CY, r, transform: `rotate(-90 ${CX} ${CY})` }));
    bpAdd("circle", { cx: SUB.x, cy: SUB.y, r: SUB.r });
    LUG_T.forEach((t) => bpAdd("path", { d: "M123,196 C123,180 126,160 133,135 Q135,128.5 141.5,128.5 L153,128.5 Q158,128.5 158,134 L158,166", transform: t }));
    bpAdd("rect", { x: 347, y: 249, width: 20, height: 42, rx: 3.5 });
    bpAdd("path", { d: `M159,128 L165,-60 M281,128 L275,-60 M159,412 L165,600 M281,412 L275,600`, opacity: 0.6 });
    bpParts.forEach((p) => {
      p.style.strokeDasharray = "1 1";
      p.style.strokeDashoffset = "1";
    });

    /* ---------- Focus veil: dims everything but the selected part ---------- */
    // The veil only needs to cover the watch itself (paper on paper is invisible).
    const VEIL = { x: 92, y: -300, width: 290, height: 1140 };
    const veilMask = el("mask", { id: "m-veil", maskUnits: "userSpaceOnUse", ...VEIL }, d);
    el("rect", { ...VEIL, fill: "#fff" }, veilMask);
    const holes = {};
    holes.crystal = el("circle", { cx: CX, cy: CY, r: R.dial, fill: "#000", opacity: 0 }, veilMask);
    holes.bezel = el("path", { d: annulus(R.bezelOut + 0.5, R.bezelIn - 0.5), "fill-rule": "evenodd", fill: "#000", opacity: 0 }, veilMask);
    holes.case = el("g", { opacity: 0 }, veilMask);
    LUG_T.forEach((t) => el("path", { d: LUG, transform: t, fill: "#000", stroke: "#000", "stroke-width": 1 }, holes.case));
    el("circle", { cx: CX, cy: CY, r: R.case, fill: "#fff" }, holes.case);
    el("path", { d: annulus(R.case + 0.8, R.bezelOut), "fill-rule": "evenodd", fill: "#000" }, holes.case);
    holes.lugs = el("g", { opacity: 0 }, veilMask);
    LUG_T.forEach((t) => el("path", { d: LUG, transform: t, fill: "#000", stroke: "#000", "stroke-width": 1.5 }, holes.lugs));
    el("circle", { cx: CX, cy: CY, r: R.case, fill: "#fff" }, holes.lugs);
    holes.crown = el("g", { opacity: 0 }, veilMask);
    el("rect", { x: 341, y: 247.5, width: 30, height: 45, rx: 4, fill: "#000" }, holes.crown);
    const veil = el("rect", { ...VEIL, class: "w-veil", mask: "url(#m-veil)", opacity: 0 }, root);

    /* ---------- Highlights ---------- */
    const hlLayer = el("g", { class: "w-hl" }, root);
    const HL = {};
    function hlGroup(id, shapes, maskId) {
      const g = el("g", { opacity: 0, class: `w-hl-${id}` }, hlLayer);
      const inner = el("g", maskId ? { mask: `url(#${maskId})` } : {}, g);
      const glowG = el("g", { filter: "url(#f-glow)", opacity: 0.55 }, inner);
      const fillG = el("g", { class: "w-hl-fill" }, inner);
      const lineG = el("g", {}, inner);
      const outlines = [];
      shapes.forEach(([tag, a]) => {
        el(tag, { ...a, fill: "none", stroke: "#c39a55", "stroke-width": 6 }, glowG);
        el(tag, { ...a, class: id === "crystal" ? "w-hl-area w-hl-area--glass" : "w-hl-area", stroke: "none" }, fillG);
        outlines.push(el(tag, { ...a, fill: "none", class: "w-hl-line", pathLength: 1 }, lineG));
      });
      HL[id] = { g, fillG, glowG, outlines };
    }
    const lugShapes = LUG_T.map((t) => ["path", { d: LUG, transform: t }]);
    hlGroup("crystal", [["circle", { cx: CX, cy: CY, r: R.dial - 0.5, transform: `rotate(-90 ${CX} ${CY})` }]]);
    hlGroup("bezel", [
      ["path", { d: annulus(R.bezelOut, R.bezelIn), "fill-rule": "evenodd" }],
    ]);
    hlGroup("case", [["path", { d: annulus(R.case, R.bezelOut), "fill-rule": "evenodd" }]].concat(lugShapes), "m-outbezel");
    // Lugs: only the part outside the case.
    hlGroup("lugs", lugShapes, "m-outcase");
    hlGroup("crown", [["rect", { x: 347, y: 249, width: 22, height: 42, rx: 3.5 }], ["rect", { x: 341, y: 261, width: 8, height: 18, rx: 1 }]]);
    // Lug outlines inside the case-highlight need clipping to outside the case band.
    HL.case.g.querySelectorAll("path[transform]").forEach((p) => {
      p.setAttribute("mask", "url(#m-outcase)");
    });

    /* ---------- Demonstration overlays ---------- */
    const demo = el("g", { class: "w-demo" }, root);
    // Hidden-line convention (dashed) for the movement inside the case.
    const movement = el("g", { opacity: 0 }, demo);
    const movCircle = el("circle", { cx: CX, cy: CY, r: 86, fill: "none", stroke: "#8a6a3a", "stroke-width": 1, "stroke-dasharray": "5 4", transform: `rotate(-90 ${CX} ${CY})` }, movement);
    const movLabel = el("text", { x: CX, y: CY - 64, "text-anchor": "middle", class: "w-note" }, movement);
    movLabel.textContent = "MOVEMENT · INSIDE";
    // Spring bars between the lugs (hidden under the strap).
    const bars = el("g", { opacity: 0 }, demo);
    [139, 401].forEach((y) => el("line", { x1: 160, y1: y, x2: 280, y2: y, stroke: "#8a6a3a", "stroke-width": 1.4, "stroke-dasharray": "5 3.5" }, bars));
    const barLabel = el("text", { x: CX, y: 153, "text-anchor": "middle", class: "w-note" }, bars);
    barLabel.textContent = "SPRING BAR";
    // Bezel trace
    const trace = el("circle", { cx: CX, cy: CY, r: (R.bezelOut + R.bezelIn) / 2, fill: "none", stroke: "#f6e7c4", "stroke-width": 10, pathLength: 1, opacity: 0, transform: `rotate(-90 ${CX} ${CY})`, "stroke-linecap": "round" }, demo);
    trace.style.strokeDasharray = "0.14 0.86";

    /* ---------- Markers, call-outs, ripples ---------- */
    const markerLayer = el("g", { class: "w-markers", opacity: 0 }, root);
    const markers = {};
    Object.entries(CALLOUT).forEach(([id, c], i) => {
      const g = el("g", { class: "w-marker", "data-id": id }, markerLayer);
      const pulse = el("circle", { cx: c.a[0], cy: c.a[1], r: 6, class: "w-marker-pulse" }, g);
      el("circle", { cx: c.a[0], cy: c.a[1], r: 5.6, class: "w-marker-ring" }, g);
      el("circle", { cx: c.a[0], cy: c.a[1], r: 1.9, class: "w-marker-dot" }, g);
      pulse.style.animationDelay = `${i * 0.35}s`;
      markers[id] = g;
    });
    const calloutLayer = el("g", { class: "w-callouts" }, root);
    const fxLayer = el("g", { class: "w-fx" }, root);

    /* ---------- Hit areas (topmost) ---------- */
    const hit = el("g", { class: "w-hit" }, root);
    const hitAreas = {};
    const hitShape = (id, tag, a, label) => {
      const s = el(tag, { ...a, class: "w-hit-area", "data-id": id, tabindex: 0, role: "button", "aria-label": label }, hit);
      (hitAreas[id] = hitAreas[id] || []).push(s);
      return s;
    };
    hitShape("crystal", "circle", { cx: CX, cy: CY, r: R.bezelIn - 1 }, "Crystal");
    hitShape("bezel", "path", { d: annulus(R.bezelOut + 1, R.bezelIn - 1), "fill-rule": "evenodd" }, "Bezel");
    hitShape("case", "path", { d: annulus(R.case + 12, R.bezelOut + 1), "fill-rule": "evenodd" }, "Case");
    // Generous lug targets, outside the case.
    [[118, 108, 48, 58], [274, 108, 48, 58], [118, 374, 48, 58], [274, 374, 48, 58]].forEach(([x, y, w, h], i) =>
      hitShape("lugs", "rect", { x, y, width: w, height: h, rx: 8 }, i === 0 ? "Lugs" : "")
    );
    hitShape("crown", "rect", { x: 336, y: 236, width: 48, height: 68, rx: 10 }, "Crown");
    // Only one focusable target per component; the extra lug targets are pointer-only.
    Object.values(hitAreas).flat().forEach((s) => {
      if (s.getAttribute("aria-label")) return;
      s.setAttribute("aria-hidden", "true");
      s.removeAttribute("tabindex");
      s.removeAttribute("aria-label");
    });

    /* ---------- Time ---------- */
    const t0 = performance.now();
    const base = 10 * 3600 + 8 * 60 + 32; // the classic 10:08
    let offset = 0;
    let buildFactor = 1;
    let crownPull = 0;
    function now() {
      return base + (performance.now() - t0) / 1000 + offset;
    }
    function frame() {
      const t = now();
      const hA = ((t / 3600) % 12) * 30;
      const mA = ((t / 60) % 60) * 6;
      // 28,800 vph: eight beats per second.
      const sA = (Math.floor((t % 60) * 8) / 8) * 6;
      hourHand.setAttribute("transform", `rotate(${(hA * buildFactor).toFixed(3)} ${CX} ${CY})`);
      minHand.setAttribute("transform", `rotate(${(mA * buildFactor).toFixed(3)} ${CX} ${CY})`);
      secHand.setAttribute("transform", `rotate(${(sA * buildFactor).toFixed(3)} ${SUB.x} ${SUB.y})`);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    function setPull(px) {
      crownPull = px;
      const tr = `translate(${px} 0)`;
      crown.setAttribute("transform", tr);
      holes.crown.setAttribute("transform", tr);
      HL.crown.g.setAttribute("transform", tr);
    }

    /* ---------- Camera ---------- */
    let cam = { ...BOX.overview };
    let camTween = null;
    function applyCamera() {
      const r = svg.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const a = r.width / r.height;
      let { x, y, w, h } = cam;
      if (w / h > a) {
        const nh = w / a;
        y -= (nh - h) / 2;
        h = nh;
      } else {
        const nw = h * a;
        x -= (nw - w) / 2;
        w = nw;
      }
      svg.setAttribute("viewBox", `${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`);
    }
    function camera(name, duration = 900) {
      const to = BOX[name] || BOX.overview;
      const from = { ...cam };
      if (camTween) camTween.cancel();
      camTween = tween(duration, "balance", (e) => {
        cam = { x: lerp(from.x, to.x, e), y: lerp(from.y, to.y, e), w: lerp(from.w, to.w, e), h: lerp(from.h, to.h, e) };
        applyCamera();
      });
      return camTween.promise;
    }
    new ResizeObserver(applyCamera).observe(svg);
    applyCamera();

    /* ---------- Build-in: from construction drawing to object ---------- */
    function prepareBuild() {
      mat.style.opacity = 0;
      bp.style.opacity = 1;
      bpParts.forEach((p) => {
        p.getAnimations().forEach((a) => a.cancel());
        p.style.strokeDashoffset = "1";
      });
      buildFactor = 0;
    }
    async function build() {
      prepareBuild();
      bpParts.forEach((p, i) =>
        anim(p, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 760, delay: 60 + i * 34, easing: ease.balance, replace: true })
      );
      mat.style.transformOrigin = `${CX}px ${CY}px`;
      anim(mat, [{ opacity: 0, transform: "scale(.985)" }, { opacity: 1, transform: "scale(1)" }], { duration: 760, delay: 480, easing: ease.soft, replace: true });
      anim(bp, [{ opacity: 1 }, { opacity: 0 }], { duration: 520, delay: 980, easing: ease.soft, replace: true });
      await new Promise((r) => setTimeout(r, reduced ? 0 : 640));
      await tween(1050, "detent", (e) => (buildFactor = e)).promise;
      buildFactor = 1;
    }
    function skipBuild() {
      bp.style.opacity = 0;
      mat.style.opacity = 1;
      buildFactor = 1;
    }

    /* ---------- Selection: veil + highlight + call-out ---------- */
    let current = null;
    let pulseAnims = [];
    function setHole(id, on, dur = 420) {
      const h = holes[id];
      const from = parseFloat(h.getAttribute("opacity")) || 0;
      const to = on ? 1 : 0;
      if (from === to) return;
      tween(dur, "balance", (e) => h.setAttribute("opacity", lerp(from, to, e).toFixed(3)));
    }
    function veilTo(v, dur = 520) {
      anim(veil, [{ opacity: getComputedStyle(veil).opacity }, { opacity: v }], { duration: dur, easing: ease.balance, replace: true });
    }

    function stopPulse() {
      pulseAnims.forEach((a) => a.cancel());
      pulseAnims = [];
    }

    function highlight(id, { mode = "explore" } = {}) {
      stopPulse();
      Object.keys(HL).forEach((k) => {
        if (k !== id) {
          anim(HL[k].g, [{ opacity: getComputedStyle(HL[k].g).opacity }, { opacity: 0 }], { duration: 240, easing: ease.soft, replace: true });
          setHole(k, false);
        }
      });
      current = id;
      if (!id) {
        veilTo(0);
        return;
      }
      setHole(id, true);
      veilTo(mode === "quiz" ? 0.72 : 0.62);
      const h = HL[id];
      anim(h.g, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: ease.soft, replace: true });
      h.outlines.forEach((o, i) =>
        anim(o, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 760, delay: 80 + i * 40, easing: ease.balance, replace: true })
      );
      anim(h.fillG, [{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 200, easing: ease.soft, replace: true });
      if (mode === "quiz" && !reduced) {
        // A slow, regular "breathing" — like a balance at rest.
        pulseAnims.push(h.fillG.animate([{ opacity: 1 }, { opacity: 0.35 }], { duration: 1100, delay: 900, iterations: Infinity, direction: "alternate", easing: ease.balance }));
        pulseAnims.push(h.glowG.animate([{ opacity: 0.55 }, { opacity: 0.15 }], { duration: 1100, delay: 900, iterations: Infinity, direction: "alternate", easing: ease.balance }));
      }
    }

    let calloutToken = 0;
    function clearCallout(fast) {
      calloutToken++;
      Array.from(calloutLayer.children).forEach((g) => {
        anim(g, [{ opacity: 1 }, { opacity: 0 }], { duration: fast ? 120 : 200, easing: ease.soft }).then(() => g.remove());
      });
    }
    function callout(id, info) {
      clearCallout(true);
      const token = calloutToken;
      const c = CALLOUT[id];
      if (!c) return;
      const g = el("g", { class: "w-callout" }, calloutLayer);
      const pts = [c.a, c.e, c.z].map((p) => p.join(",")).join(" ");
      el("polyline", { points: pts, class: "w-co-halo" }, g);
      const line = el("polyline", { points: pts, class: "w-co-line", pathLength: 1 }, g);
      const anchors = [c.a].concat(c.extra || []);
      const rings = anchors.map(([x, y]) => {
        const rg = el("g", { class: "w-co-anchor" }, g);
        el("circle", { cx: x, cy: y, r: 4.6, class: "w-co-ring" }, rg);
        el("circle", { cx: x, cy: y, r: 1.6, class: "w-co-dot" }, rg);
        rg.style.transformOrigin = `${x}px ${y}px`;
        return rg;
      });
      const start = c.align === "start";
      const tx = c.z[0];
      const label = el("text", { x: tx, y: c.z[1] - 7, "text-anchor": start ? "start" : "end", class: "w-co-label" }, g);
      const num = el("tspan", { class: "w-co-num" }, label);
      num.textContent = info.n + "  ";
      const nm = el("tspan", {}, label);
      nm.textContent = info.name.toUpperCase();
      const fr = el("text", { x: tx, y: c.z[1] + 14, "text-anchor": start ? "start" : "end", class: "w-co-fr" }, g);
      fr.textContent = info.fr;

      line.style.strokeDasharray = "1 1";
      rings.forEach((r, i) => anim(r, [{ transform: "scale(0)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], { duration: 420, delay: 160 + i * 60, easing: ease.detent }));
      anim(line, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 520, delay: 260, easing: ease.balance });
      anim(g.querySelector(".w-co-halo"), [{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 300 });
      const dx = start ? -8 : 8;
      anim(label, [{ opacity: 0, transform: `translateX(${dx}px)`, letterSpacing: "0.5em" }, { opacity: 1, transform: "translateX(0)", letterSpacing: "0.22em" }], { duration: 620, delay: 560, easing: ease.escape });
      anim(fr, [{ opacity: 0, transform: "translateY(-4px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 500, delay: 720, easing: ease.escape });
      return token;
    }

    /* ---------- Component demonstrations ---------- */
    let crownBusy = false;
    async function demonstrate(id) {
      if (id === "crystal") {
        glint.style.transform = "translateX(-260px)";
        anim(glint, [{ transform: "translateX(-200px)" }, { transform: "translateX(200px)" }], { duration: 1300, delay: 260, easing: ease.balance, replace: true, fill: "none" });
      } else if (id === "bezel") {
        trace.setAttribute("opacity", 0.9);
        anim(trace, [{ strokeDashoffset: 0.14, opacity: 0 }, { opacity: 0.85, offset: 0.15 }, { opacity: 0.85, offset: 0.8 }, { strokeDashoffset: -1, opacity: 0 }], { duration: 1500, delay: 220, easing: ease.balance, replace: true });
      } else if (id === "case") {
        anim(movement, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 300, replace: true });
        movCircle.style.strokeDasharray = "5 4";
        anim(movCircle, [{ strokeDashoffset: 560 }, { strokeDashoffset: 0 }], { duration: 1200, delay: 300, easing: ease.balance, replace: true });
      } else if (id === "lugs") {
        anim(bars, [{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 420, replace: true });
      } else if (id === "crown") {
        if (crownBusy) return;
        crownBusy = true;
        // Pull to the time-setting position, turn, set the hands, push home.
        await tween(320, "escape", (e) => setPull(lerp(0, CROWN_PULL, e))).promise;
        const o0 = offset;
        const k0 = 0;
        await tween(1150, "balance", (e) => {
          offset = o0 + 1800 * e; // +30 minutes
          setKnurl(k0 + e * Math.PI * 3);
        }).promise;
        await tween(280, "escape", (e) => setPull(lerp(CROWN_PULL, 0, e))).promise;
        crownBusy = false;
      }
    }
    function endDemonstrations() {
      anim(movement, [{ opacity: getComputedStyle(movement).opacity }, { opacity: 0 }], { duration: 220, replace: true });
      anim(bars, [{ opacity: getComputedStyle(bars).opacity }, { opacity: 0 }], { duration: 220, replace: true });
    }

    /* ---------- Markers ---------- */
    function showMarkers(on, visited = new Set(), selected = null) {
      anim(markerLayer, [{ opacity: getComputedStyle(markerLayer).opacity }, { opacity: on ? 1 : 0 }], { duration: on ? 500 : 200, easing: ease.soft, replace: true });
      Object.entries(markers).forEach(([id, m]) => {
        m.classList.toggle("is-visited", visited.has(id));
        m.classList.toggle("is-dim", !!selected);
        m.classList.toggle("is-selected", selected === id);
      });
    }
    function popMarkers() {
      Object.values(markers).forEach((m, i) => {
        m.style.transformOrigin = "center";
        m.style.transformBox = "fill-box";
        anim(m, [{ transform: "scale(0)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], { duration: 520, delay: i * 70, easing: ease.detent, replace: true });
      });
    }

    /* ---------- FX ---------- */
    function toSvgPoint(clientX, clientY) {
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const m = svg.getScreenCTM();
      return m ? pt.matrixTransform(m.inverse()) : { x: CX, y: CY };
    }
    function ripple(clientX, clientY) {
      const p = toSvgPoint(clientX, clientY);
      const c = el("circle", { cx: p.x, cy: p.y, r: 22, class: "w-ripple" }, fxLayer);
      c.style.transformOrigin = `${p.x}px ${p.y}px`;
      anim(c, [{ transform: "scale(.15)", opacity: 0.9 }, { transform: "scale(1)", opacity: 0 }], { duration: 620, easing: ease.escape }).then(() => c.remove());
    }
    function celebrate() {
      [0, 200].forEach((delay) => {
        const c = el("circle", { cx: CX, cy: CY, r: R.case + 2, class: "w-chime" }, fxLayer);
        c.style.transformOrigin = `${CX}px ${CY}px`;
        anim(c, [{ transform: "scale(1)", opacity: 0.85 }, { transform: "scale(1.45)", opacity: 0 }], { duration: 1500, delay, easing: ease.escape, fill: "both" }).then(() => c.remove());
      });
    }

    // Correct answer: the part settles to full brilliance, demonstrates
    // itself, and a single chime ring leaves the case.
    function confirm(id) {
      stopPulse();
      const h = HL[id];
      if (!h) return;
      anim(h.fillG, [{ opacity: getComputedStyle(h.fillG).opacity }, { opacity: 1 }], { duration: 300, replace: true });
      anim(h.glowG, [{ opacity: 0.4 }, { opacity: 1, offset: 0.3 }, { opacity: 0.5 }], { duration: 1100, easing: ease.soft, replace: true });
      veilTo(0.5, 700);
      demonstrate(id);
      const c = el("circle", { cx: CX, cy: CY, r: R.case + 2, class: "w-chime" }, fxLayer);
      c.style.transformOrigin = `${CX}px ${CY}px`;
      anim(c, [{ transform: "scale(1)", opacity: 0.9 }, { transform: "scale(1.38)", opacity: 0 }], { duration: 1300, delay: 120, easing: ease.escape }).then(() => c.remove());
    }
    // Wrong answer: a quiet re-emphasis of the highlighted part.
    function nudge(id) {
      const h = HL[id];
      if (!h) return;
      h.outlines.forEach((o) => anim(o, [{ strokeDashoffset: 0 }, { strokeDashoffset: 1, offset: 0.001 }, { strokeDashoffset: 0 }], { duration: 700, easing: ease.balance, fill: "forwards" }));
    }
    function screenPoint(id) {
      const [x, y] = (CALLOUT[id] || { a: [CX, CY] }).a;
      const m = svg.getScreenCTM();
      const pt = svg.createSVGPoint();
      pt.x = x;
      pt.y = y;
      return m ? pt.matrixTransform(m) : { x: 0, y: 0 };
    }

    /* ---------- Events ---------- */
    let pickHandler = () => {};
    hit.addEventListener("pointerdown", (e) => {
      const t = e.target.closest(".w-hit-area");
      if (t) ripple(e.clientX, e.clientY);
    });
    hit.addEventListener("click", (e) => {
      const t = e.target.closest(".w-hit-area");
      if (t) pickHandler(t.dataset.id, e);
    });
    hit.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target.dataset.id) {
        e.preventDefault();
        pickHandler(e.target.dataset.id, e);
      }
    });
    function setInteractive(on) {
      hit.style.pointerEvents = on ? "all" : "none";
      hit.querySelectorAll("[aria-label]").forEach((h) => h.setAttribute("tabindex", on ? 0 : -1));
    }

    return {
      camera,
      applyCamera,
      build,
      prepareBuild,
      skipBuild,
      highlight,
      callout,
      clearCallout,
      demonstrate,
      endDemonstrations,
      showMarkers,
      popMarkers,
      celebrate,
      confirm,
      nudge,
      screenPoint,
      ripple,
      setInteractive,
      hitTarget: (id) => (hitAreas[id] || [])[0],
      onPick: (fn) => (pickHandler = fn),
      get current() { return current; },
    };
  }

  window.Watch = { create };
})();

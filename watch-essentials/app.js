/* Watch Essentials — scenes, state and choreography. */
(function () {
  const { anim, stagger, tween, wait, ease, reduced, haptic } = window.Motion;
  const C = window.WE_CONTENT;
  const $ = (s, r = document) => r.querySelector(s);
  const byId = Object.fromEntries(C.components.map((c) => [c.id, c]));
  const TOTAL = C.components.length;

  const ui = {
    device: $("#device"),
    intro: $("#intro"),
    learn: $("#learn"),
    geo: $("#introGeo"),
    geoHand: $("#geoHand"),
    geoTicks: $("#geoTicks"),
    begin: $("#begin"),
    back: $("#back"),
    stage: $("#stage"),
    stageHint: $("#stageHint"),
    topProgress: $("#topProgress"),
    topbarName: $("#topbarName"),
    explore: $("#explorePanel"),
    quiz: $("#quizPanel"),
    done: $("#donePanel"),
    exIndex: $("#exIndex"),
    exFr: $("#exFr"),
    exName: $("#exName"),
    exDef: $("#exDef"),
    rail: $("#rail"),
    toQuiz: $("#toQuiz"),
    qSegs: $("#qSegs"),
    qTitle: $("#qTitle"),
    qOptions: $("#qOptions"),
    qResult: $("#qResult"),
    qResultText: $("#qResultText"),
    qEarned: $("#qEarned"),
    qHint: $("#qHint"),
    qNext: $("#qNext"),
    qNextLabel: $("#qNextLabel"),
    doneScore: $("#doneScore"),
    doneEarned: $("#doneEarned"),
    finger: $("#finger"),
  };

  const watch = window.Watch.create($("#watch"));
  const state = {
    scene: "intro",
    selected: null,
    visited: new Set(),
    q: 0,
    tries: 0,
    firstTry: 0,
    answered: false,
    earned: [],
    busy: false,
  };

  /* =========================================================
   * Static decoration
   * ========================================================= */
  (function introTicks() {
    const NS = "http://www.w3.org/2000/svg";
    for (let i = 0; i < 60; i++) {
      const h = i % 5 === 0;
      const a = (i * 6 * Math.PI) / 180;
      const r1 = h ? 126 : 129, r2 = 134;
      const l = document.createElementNS(NS, "line");
      l.setAttribute("x1", 150 + r1 * Math.sin(a));
      l.setAttribute("y1", 150 - r1 * Math.cos(a));
      l.setAttribute("x2", 150 + r2 * Math.sin(a));
      l.setAttribute("y2", 150 - r2 * Math.cos(a));
      if (h) l.setAttribute("class", "h");
      ui.geoTicks.appendChild(l);
    }
  })();

  (function plateRuler() {
    const NS = "http://www.w3.org/2000/svg";
    const g = $("#plateRuler");
    const letters = "ABCDEFGHIJKL";
    for (let y = 0; y <= 600; y += 10) {
      const long = y % 50 === 0;
      [[6, 6 + (long ? 9 : 4)], [394, 394 - (long ? 9 : 4)]].forEach(([x1, x2]) => {
        const l = document.createElementNS(NS, "line");
        l.setAttribute("x1", x1); l.setAttribute("x2", x2);
        l.setAttribute("y1", y); l.setAttribute("y2", y);
        g.appendChild(l);
      });
      if (long && y > 0 && y < 600) {
        const t = document.createElementNS(NS, "text");
        t.setAttribute("x", 19); t.setAttribute("y", y + 2);
        t.textContent = letters[y / 50 - 1];
        g.appendChild(t);
      }
    }
  })();

  (function sizeBeginFrame() {
    const rect = ui.begin.querySelector(".btn-begin-frame rect");
    const fit = () => {
      rect.setAttribute("width", Math.max(0, ui.begin.offsetWidth - 1));
      rect.setAttribute("height", Math.max(0, ui.begin.offsetHeight - 1));
    };
    fit();
    new ResizeObserver(fit).observe(ui.begin);
  })();

  // Component rail
  C.components.forEach((c) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "rail-tab";
    b.dataset.id = c.id;
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", "false");
    b.innerHTML = `<span class="rt-n">${c.n}</span><span>${c.name}</span>`;
    b.addEventListener("click", () => select(c.id));
    ui.rail.appendChild(b);
  });
  const railInd = document.createElement("span");
  railInd.className = "rail-ind";
  ui.rail.appendChild(railInd);

  /* =========================================================
   * Scene 1 · Introduction
   * ========================================================= */
  let introTick = null;
  let handAngle = 0;

  function resetIntro() {
    clearInterval(introTick);
    ui.intro.querySelectorAll("*").forEach((n) => n.getAnimations().forEach((a) => a.cancel()));
    ui.begin.classList.remove("is-pressed");
  }

  async function playIntro() {
    resetIntro();
    ui.intro.classList.add("is-active");
    const draws = ui.intro.querySelectorAll(".geo-draw");
    draws.forEach((d, i) =>
      anim(d, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 1150, delay: i * 70, easing: ease.balance })
    );
    stagger(ui.geoTicks.children, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, step: 9, delay: 150, easing: ease.soft });

    // The sweep: one full turn that locks at twelve, then a calm 1 Hz beat.
    handAngle = 0;
    ui.geoHand.style.opacity = 0;
    anim(ui.geoHand, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, delay: 120, fill: "backwards" }).then(() => (ui.geoHand.style.opacity = 1));
    anim(ui.geoHand, [{ transform: "rotate(0deg)" }, { transform: "rotate(366deg)", offset: 0.88 }, { transform: "rotate(360deg)" }], {
      duration: 1350, delay: 120, easing: ease.escape, fill: "forwards",
    }).then(() => {
      if (reduced) return;
      let last = null;
      introTick = setInterval(() => {
        const from = handAngle;
        handAngle += 6;
        const prev = last;
        last = ui.geoHand.animate([{ transform: `rotate(${360 + from}deg)` }, { transform: `rotate(${360 + handAngle}deg)` }], { duration: 160, easing: ease.detent, fill: "forwards" });
        last.finished.then(() => prev && prev.cancel()).catch(() => {});
      }, 1000);
    });

    const brand = $(".intro-brand");
    anim(brand, [{ opacity: 0, letterSpacing: "0.6em" }, { opacity: 1, letterSpacing: "0.32em" }], { duration: 1100, delay: 80, easing: ease.escape });
    anim($(".intro-chapter"), [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 800, delay: 260 });
    stagger(ui.intro.querySelectorAll(".intro-title .line > span"), [{ transform: "translateY(110%)" }, { transform: "translateY(0)" }], {
      duration: 1100, delay: 300, step: 90, easing: ease.escape,
    });
    anim($(".intro-sub"), [{ opacity: 0, filter: "blur(6px)", transform: "translateY(6px)" }, { opacity: 1, filter: "blur(0)", transform: "none" }], { duration: 1000, delay: 680 });
    anim(ui.begin.querySelector(".btn-begin-frame rect"), [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 1000, delay: 560, easing: ease.balance });
    stagger([ui.begin.querySelector(".btn-begin-label"), ui.begin.querySelector(".btn-arrow")], [{ opacity: 0, transform: "translateX(-6px)" }, { opacity: 1, transform: "none" }], { duration: 700, delay: 860, step: 80 });
    anim($(".intro-meta"), [{ opacity: 0 }, { opacity: 1 }], { duration: 700, delay: 1000 });
  }

  async function begin() {
    if (state.busy || state.scene !== "intro") return;
    state.busy = true;
    haptic(10);
    ui.begin.classList.add("is-pressed");
    anim(ui.begin.querySelector(".btn-begin-fill"), [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 420, easing: ease.escape });

    // Copy releases upward, like a lever letting go.
    stagger(ui.intro.querySelectorAll(".intro-title .line > span"), [{ transform: "translateY(0)", opacity: 1 }, { transform: "translateY(-60%)", opacity: 0 }], {
      duration: 460, delay: 120, step: 45, easing: ease.release, replace: true,
    });
    [".intro-sub", ".intro-chapter", ".intro-foot", ".intro-brand"].forEach((s, i) =>
      anim($(s), [{ opacity: 1 }, { opacity: 0 }], { duration: 320, delay: 160 + i * 30, easing: ease.soft })
    );

    // Aperture: the construction circle opens onto the technical plate.
    const g = ui.geo.getBoundingClientRect();
    const d = ui.device.getBoundingClientRect();
    const r0 = (g.width * 120) / 300;
    const cx = g.left + g.width / 2 - d.left;
    const cy = g.top + g.height / 2 - d.top;
    const r1 = Math.hypot(Math.max(cx, d.width - cx), Math.max(cy, d.height - cy)) + 4;

    enterLearn({ fromIntro: true });
    ui.learn.classList.add("is-active");
    const iris = anim(
      ui.learn,
      [{ clipPath: `circle(${r0}px at ${cx}px ${cy}px)` }, { clipPath: `circle(${r1}px at ${cx}px ${cy}px)` }],
      { duration: 1000, delay: 220, easing: ease.balance }
    );
    anim(ui.geo, [{ transform: "translate(-50%,-50%) scale(1)", opacity: 1 }, { transform: "translate(-50%,-50%) scale(1.25)", opacity: 0 }], { duration: 1000, delay: 220, easing: ease.balance });
    await iris;
    ui.learn.getAnimations().forEach((a) => a.cancel());
    ui.intro.classList.remove("is-active");
    clearInterval(introTick);
    state.busy = false;
  }

  /* =========================================================
   * Scene 2 · Interactive exploration
   * ========================================================= */
  function enterLearn({ fromIntro = false } = {}) {
    state.scene = "explore";
    state.selected = null;
    state.visited = new Set();
    showPanel(ui.explore, { animateStage: false });
    resetExploreCopy();
    updateRail();
    updateProgress();
    updateCta();
    watch.highlight(null);
    watch.clearCallout(true);
    watch.setInteractive(true);
    watch.camera("overview", 1);

    const d0 = fromIntro ? 280 : 0;
    anim($(".topbar"), [{ opacity: 0, transform: "translateY(-6px)" }, { opacity: 1, transform: "none" }], { duration: 700, delay: d0 + 200, replace: true, fill: "backwards" });
    stagger(ui.explore.children, [{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }], {
      duration: 800, delay: d0 + 380, step: 60, replace: true, fill: "backwards",
    });
    anim($(".plate"), [{ opacity: 0, transform: "scale(1.04)" }, { opacity: 1, transform: "none" }], { duration: 1400, delay: d0, easing: ease.escape, replace: true, fill: "backwards" });

    setTimeout(() => watch.build(), d0);
    setTimeout(() => {
      if (state.scene !== "explore") return;
      watch.showMarkers(!state.selected, state.visited, state.selected);
      if (!state.selected) {
        watch.popMarkers();
        anim(ui.stageHint, [{ opacity: 0, transform: "translate(-50%, 6px)" }, { opacity: 1, transform: "translate(-50%, 0)" }], { duration: 600, replace: true, fill: "forwards" });
      }
    }, d0 + (reduced ? 0 : 1500));
  }

  function resetExploreCopy() {
    ui.exIndex.textContent = "Explore";
    ui.exFr.textContent = "";
    ui.exName.textContent = "Learn my components";
    ui.exDef.textContent = "Before you can speak about watches with precision, learn the names of their parts. Tap any component on the watch.";
  }

  let swapToken = 0;
  async function swapCopy(c) {
    const token = ++swapToken;
    const targets = [ui.exIndex, ui.exFr, ui.exName, ui.exDef];
    await Promise.all(
      targets.map((t, i) => anim(t, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-8px)" }], { duration: 170, delay: i * 18, easing: ease.release, replace: true }))
    );
    if (token !== swapToken) return;
    ui.exIndex.textContent = `${c.n} — ${String(TOTAL).padStart(2, "0")}`;
    ui.exFr.textContent = `fr. ${c.fr}`;
    ui.exName.textContent = c.name;
    ui.exDef.textContent = c.def;
    stagger(targets, [{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }], { duration: 700, step: 55, easing: ease.escape, replace: true, fill: "backwards" });
  }

  function select(id) {
    if (state.scene !== "explore") return;
    if (state.selected === id) {
      // Second tap replays the demonstration.
      watch.demonstrate(id);
      haptic(6);
      return;
    }
    haptic(10);
    state.selected = id;
    state.visited.add(id);
    watch.endDemonstrations();
    watch.highlight(id);
    watch.camera(id, 900);
    watch.callout(id, byId[id]);
    watch.demonstrate(id);
    watch.showMarkers(true, state.visited, id);
    anim(ui.stageHint, [{ opacity: getComputedStyle(ui.stageHint).opacity }, { opacity: 0 }], { duration: 250, replace: true });
    swapCopy(byId[id]);
    updateRail();
    updateProgress();
    updateCta();
  }
  watch.onPick((id) => select(id));

  function updateRail() {
    const tabs = Array.from(ui.rail.querySelectorAll(".rail-tab"));
    tabs.forEach((t, i) => {
      const on = t.dataset.id === state.selected;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.classList.toggle("is-visited", state.visited.has(t.dataset.id));
      if (on) railInd.style.transform = `translateX(${i * 100}%) scaleX(1)`;
    });
    if (!state.selected) railInd.style.transform = "translateX(200%) scaleX(0)";
  }

  function updateProgress() {
    const p = ui.topProgress;
    if (state.scene === "explore") {
      p.setAttribute("aria-label", `${state.visited.size} of ${TOTAL} components explored`);
      p.innerHTML = C.components.map((c) => `<i class="${state.visited.has(c.id) ? "on" : ""}"></i>`).join("");
    } else if (state.scene === "quiz") {
      p.setAttribute("aria-label", `Question ${state.q + 1} of ${C.quiz.length}`);
      p.innerHTML = `<span class="tp-text">${state.q + 1}<span style="opacity:.45"> / ${C.quiz.length}</span></span>`;
    } else {
      p.setAttribute("aria-label", "Chapter complete");
      p.innerHTML = `<svg class="tp-done" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="8"/><path d="M5 9.4l2.6 2.6L13 6.6"/></svg>`;
    }
  }

  function updateCta() {
    ui.toQuiz.classList.toggle("is-ready", state.visited.size >= 2);
  }

  /* Panel switching with a FLIP on the stage height, so the watch
   * glides to its new framing instead of jumping. */
  function showPanel(panel, { animateStage = true } = {}) {
    const before = ui.stage.offsetHeight;
    [ui.explore, ui.quiz, ui.done].forEach((p) => (p.hidden = p !== panel));
    const after = ui.stage.offsetHeight;
    if (!animateStage || before === after || reduced) return Promise.resolve();
    ui.stage.style.flex = "none";
    return anim(ui.stage, [{ height: `${before}px` }, { height: `${after}px` }], { duration: 760, easing: ease.balance, fill: "none", replace: true }).then(() => {
      ui.stage.style.flex = "";
      watch.applyCamera();
    });
  }

  /* =========================================================
   * Scene 3 · Knowledge check
   * ========================================================= */
  async function toQuiz() {
    if (state.busy || state.scene !== "explore") return;
    state.busy = true;
    haptic(10);
    state.scene = "quiz";
    state.q = 0;
    state.firstTry = 0;
    state.earned = [];
    watch.clearCallout();
    watch.endDemonstrations();
    watch.showMarkers(false);
    watch.setInteractive(false);
    anim(ui.stageHint, [{ opacity: getComputedStyle(ui.stageHint).opacity }, { opacity: 0 }], { duration: 200, replace: true });
    const exits = await stagger(ui.explore.children, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(10px)" }], { duration: 200, step: 25, easing: ease.release, replace: true });
    renderQuestion(0, { entering: true });
    showPanel(ui.quiz);
    exits.forEach((a) => a.cancel()); // the panel is hidden now; leave no residue
    watch.camera("quiz", 900);
    updateProgress();
    state.busy = false;
  }

  function renderQuestion(i, { entering = false } = {}) {
    const q = C.quiz[i];
    state.q = i;
    state.tries = 0;
    state.answered = false;
    Array.from(ui.qSegs.children).forEach((s, k) => {
      s.className = k < i ? "done" : k === i ? "current" : "";
    });
    ui.qOptions.innerHTML = "";
    q.options.forEach((id, k) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "opt";
      b.dataset.id = id;
      b.innerHTML = `<span class="opt-key">${"abc"[k]}</span><span class="opt-label">${byId[id].name}</span><svg class="opt-mark" viewBox="0 0 18 18" aria-hidden="true"><path pathLength="1" d=""/></svg>`;
      b.addEventListener("click", () => answer(id, b));
      ui.qOptions.appendChild(b);
    });
    ui.qResult.classList.remove("is-shown");
    ui.qHint.textContent = "";
    ui.qHint.getAnimations().forEach((a) => a.cancel());
    ui.qNext.hidden = true;
    ui.qNextLabel.textContent = i === C.quiz.length - 1 ? "Complete chapter" : "Next question";

    watch.endDemonstrations();
    watch.highlight(q.target, { mode: "quiz" });
    updateProgress();

    const items = entering ? ui.quiz.querySelectorAll(".q-meta, .q-title, .opt") : ui.quiz.querySelectorAll(".opt");
    stagger(items, [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], {
      duration: 760, delay: entering ? 260 : 120, step: 60, replace: true, fill: "backwards",
    });
  }

  function answer(id, btn) {
    if (state.answered || btn.classList.contains("is-wrong")) return;
    const q = C.quiz[state.q];
    if (id === q.target) {
      state.answered = true;
      if (state.tries === 0) state.firstTry++;
      state.earned.push(id);
      haptic([12, 50, 18]);

      btn.querySelector(".opt-mark path").setAttribute("d", "M3.5 9.5l3.6 3.6L14.5 5.5");
      btn.classList.add("is-correct");
      btn.setAttribute("aria-label", `${byId[id].name} — correct`);
      const others = Array.from(ui.qOptions.children).filter((b) => b !== btn);
      others.forEach((b) => b.classList.add("is-faded"));
      // Bring the answer to the first row; the explanation takes the space below.
      const dy = btn.offsetTop - ui.qOptions.firstElementChild.offsetTop;
      if (dy) anim(btn, [{ transform: "translateY(0)" }, { transform: `translateY(${-dy}px)` }], { duration: 700, delay: 160, easing: ease.escape, fill: "forwards" });
      anim(btn.querySelector(".opt-mark path"), [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 520, delay: 260, easing: ease.balance });

      ui.qResultText.textContent = q.explain;
      ui.qEarned.textContent = `${byId[id].name} added to your watch`;
      ui.qResult.classList.add("is-shown");

      anim(ui.qHint, [{ opacity: getComputedStyle(ui.qHint).opacity }, { opacity: 0 }], { duration: 160, replace: true });
      ui.qNext.hidden = false;
      anim(ui.qNext, [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 600, delay: 700, replace: true, fill: "backwards" });

      ui.qSegs.children[state.q].className = "done";
      watch.confirm(id);
    } else {
      state.tries++;
      haptic(24);
      btn.classList.add("is-wrong");
      btn.setAttribute("aria-disabled", "true");
      btn.querySelector(".opt-mark path").setAttribute("d", "M5 5l8 8M13 5l-8 8");
      anim(btn.querySelector(".opt-mark path"), [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 360, easing: ease.balance });
      anim(btn, [{ transform: "translateX(0)" }, { transform: "translateX(-4px)" }, { transform: "translateX(3px)" }, { transform: "translateX(-1px)" }, { transform: "translateX(0)" }], { duration: 420, easing: ease.soft, fill: "none" });
      ui.qHint.textContent = q.wrong[id];
      anim(ui.qHint, [{ opacity: 0, transform: "translateX(-6px)" }, { opacity: 1, transform: "none" }], { duration: 520, replace: true });
      watch.nudge(q.target);
    }
  }

  async function nextQuestion() {
    if (state.busy) return;
    if (state.q >= C.quiz.length - 1) return toDone();
    state.busy = true;
    haptic(8);
    await Promise.all([
      stagger(ui.qOptions.children, [{ opacity: 1 }, { opacity: 0, transform: "translateY(-8px)" }], { duration: 200, step: 20, easing: ease.release }),
      (ui.qResult.classList.remove("is-shown"), wait(200)),
      anim(ui.qNext, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, replace: true }),
    ]);
    renderQuestion(state.q + 1);
    state.busy = false;
  }

  /* =========================================================
   * Chapter complete
   * ========================================================= */
  async function toDone() {
    if (state.busy) return;
    state.busy = true;
    state.scene = "done";
    haptic([10, 40, 10, 40, 20]);
    const exits = await stagger(ui.quiz.children, [{ opacity: 1 }, { opacity: 0, transform: "translateY(10px)" }], { duration: 220, step: 30, easing: ease.release, replace: true });
    const n = C.quiz.length;
    ui.doneScore.textContent = `${n} of ${n} components identified · ${state.firstTry} on the first attempt.`;
    ui.doneEarned.innerHTML = state.earned.map((id) => `<li>${byId[id].name}</li>`).join("");
    showPanel(ui.done);
    exits.forEach((a) => a.cancel());
    watch.endDemonstrations();
    watch.highlight(null);
    watch.camera("done", 1000);
    updateProgress();
    setTimeout(() => watch.celebrate(), reduced ? 0 : 450);
    stagger(ui.done.querySelectorAll(".done-kicker, .done-title, .done-score"), [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 800, delay: 300, step: 80, replace: true, fill: "backwards" });
    stagger(ui.doneEarned.children, [{ opacity: 0, transform: "scale(.9)" }, { opacity: 1, transform: "none" }], { duration: 600, delay: 650, step: 90, easing: ease.detent, fill: "backwards" });
    anim(ui.done.querySelector(".done-actions"), [{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 900, replace: true, fill: "backwards" });
    state.busy = false;
  }

  /* =========================================================
   * Navigation
   * ========================================================= */
  function backToExplore() {
    state.scene = "explore";
    const prev = state.selected;
    showPanel(ui.explore);
    stagger(ui.explore.children, [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 700, delay: 200, step: 50, replace: true, fill: "backwards" });
    watch.setInteractive(true);
    watch.endDemonstrations();
    watch.highlight(prev || null);
    if (prev) {
      watch.callout(prev, byId[prev]);
      watch.camera(prev, 900);
    } else {
      watch.camera("overview", 900);
    }
    watch.showMarkers(true, state.visited, prev);
    updateRail();
    updateProgress();
    updateCta();
  }

  ui.back.addEventListener("click", () => {
    if (state.busy) return;
    haptic(6);
    if (state.scene === "explore") {
      // Return to the introduction.
      state.scene = "intro";
      watch.clearCallout(true);
      watch.highlight(null);
      anim(ui.learn, [{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: ease.soft }).then(() => {
        ui.learn.classList.remove("is-active");
        ui.learn.getAnimations().forEach((a) => a.cancel());
      });
      playIntro();
    } else {
      backToExplore();
    }
  });
  ui.begin.addEventListener("click", begin);
  ui.toQuiz.addEventListener("click", toQuiz);
  ui.qNext.addEventListener("click", nextQuestion);
  $("#exploreAgain").addEventListener("click", () => {
    haptic(6);
    state.selected = null;
    backToExplore();
  });
  $("#retake").addEventListener("click", async () => {
    if (state.busy) return;
    haptic(6);
    state.scene = "quiz";
    state.firstTry = 0;
    state.earned = [];
    renderQuestion(0, { entering: true });
    showPanel(ui.quiz);
    watch.camera("quiz", 900);
  });

  /* =========================================================
   * Demonstration mode
   *   ?autoplay        — 10-second scripted run for screen recording
   *   ?autoplay=full   — the complete chapter, incl. a wrong answer
   *   ?scene=explore   — start on the watch
   *   ?scene=quiz      — start on the knowledge check
   *   keys: A autoplay · R reset
   * Autoplay drives the real UI: it dispatches genuine pointer/click
   * events on the same targets a finger would hit.
   * ========================================================= */
  const fingerPos = { x: null, y: null };
  function pointOf(target) {
    if (typeof target === "string") {
      const p = watch.screenPoint(target);
      return { x: p.x, y: p.y, el: document.elementFromPoint(p.x, p.y) };
    }
    const r = target.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, el: target };
  }
  async function tap(target, travel = 520) {
    const p = pointOf(target);
    const d = ui.device.getBoundingClientRect();
    const x = p.x - d.left, y = p.y - d.top;
    const f = ui.finger;
    if (fingerPos.x === null) {
      fingerPos.x = x; fingerPos.y = y + 60;
      f.style.transform = `translate(${fingerPos.x}px, ${fingerPos.y}px)`;
      f.style.opacity = 1;
    }
    await anim(f, [{ transform: `translate(${fingerPos.x}px, ${fingerPos.y}px) scale(1)` }, { transform: `translate(${x}px, ${y}px) scale(1)` }], { duration: travel, easing: ease.balance, fill: "forwards", replace: true });
    fingerPos.x = x; fingerPos.y = y;
    await anim(f, [{ transform: `translate(${x}px, ${y}px) scale(1)` }, { transform: `translate(${x}px, ${y}px) scale(.78)` }], { duration: 110, easing: ease.soft, fill: "forwards" });
    const opts = { bubbles: true, cancelable: true, clientX: p.x, clientY: p.y, pointerType: "touch", isPrimary: true };
    if (p.el) {
      p.el.dispatchEvent(new PointerEvent("pointerdown", opts));
      p.el.dispatchEvent(new PointerEvent("pointerup", opts));
      p.el.dispatchEvent(new MouseEvent("click", opts));
    }
    anim(f, [{ transform: `translate(${x}px, ${y}px) scale(.78)` }, { transform: `translate(${x}px, ${y}px) scale(1)` }], { duration: 260, easing: ease.detent, fill: "forwards" });
  }
  const optionFor = (id) => ui.qOptions.querySelector(`.opt[data-id="${id}"]`);

  let autoplaying = false;
  async function autoplay(mode = "short") {
    if (autoplaying) return;
    autoplaying = true;
    document.documentElement.classList.add("is-autoplay");
    await wait(1100);
    await tap(ui.begin, 400);
    await wait(1300);
    await tap("bezel", 460);
    await wait(900);
    await tap("crown", 400);
    await wait(1250);
    await tap(ui.toQuiz, 440);
    await wait(850);
    if (mode === "full") {
      await tap(optionFor("crystal"), 420);
      await wait(1300);
    }
    await tap(optionFor("bezel"), 400);
    if (mode === "full") {
      await wait(2600);
      await tap(ui.qNext, 420);
      await wait(1100);
      await tap(optionFor("crown"), 420);
      await wait(2600);
      await tap(ui.qNext, 420);
      await wait(1100);
      await tap(optionFor("case"), 420);
      await wait(1400);
      await tap(optionFor("lugs"), 420);
      await wait(2600);
      await tap(ui.qNext, 420);
    }
    await wait(1600);
    ui.finger.style.opacity = 0;
    autoplaying = false;
    document.documentElement.classList.add("is-autoplay-done");
  }

  document.addEventListener("keydown", (e) => {
    if (e.target.closest && e.target.closest("input, textarea")) return;
    if (e.key === "r" || e.key === "R") location.href = location.pathname;
    if ((e.key === "a" || e.key === "A") && !autoplaying) location.href = `${location.pathname}?autoplay`;
  });

  /* =========================================================
   * Boot
   * ========================================================= */
  const params = new URLSearchParams(location.search);
  const fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 1500))]);
  fontsReady.then(async () => {
    document.documentElement.classList.add("is-ready");
    const scene = params.get("scene");
    if (scene === "explore" || scene === "quiz") {
      ui.intro.classList.remove("is-active");
      ui.learn.classList.add("is-active");
      enterLearn();
      if (scene === "quiz") {
        await wait(1600);
        toQuiz();
      }
    } else {
      playIntro();
    }
    if (params.has("autoplay") && !scene) autoplay(params.get("autoplay") === "full" ? "full" : "short");
  });

  // Exposed for automated QA.
  window.WE = { state, select, toQuiz, answer: (id) => answer(id, optionFor(id)), nextQuestion, watch };
})();

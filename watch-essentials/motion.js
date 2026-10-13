/* Watch Essentials — motion primitives.
 * A deliberately small layer over the Web Animations API plus a rAF tween
 * for values WAAPI can't drive (SVG viewBox, hand angles).
 * Durations collapse when the user prefers reduced motion. */
(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const k = reduced ? 0.001 : 1;

  // Named curves. "escape" is the house curve: a fast release that settles
  // precisely, like an escape wheel locking on the pallet.
  const ease = {
    escape: "cubic-bezier(.16,1,.3,1)",
    balance: "cubic-bezier(.65,0,.35,1)",
    release: "cubic-bezier(.5,0,.75,0)",
    soft: "cubic-bezier(.33,0,.2,1)",
    detent: "cubic-bezier(.34,1.56,.64,1)",
  };

  // JS counterparts for rAF tweens.
  const fn = {
    escape: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    balance: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    detent: (t) => {
      const c1 = 1.2, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    linear: (t) => t,
  };

  function anim(el, keyframes, o = {}) {
    if (!el) return Promise.resolve();
    if (o.replace) el.getAnimations().forEach((a) => a.cancel());
    const a = el.animate(keyframes, {
      duration: Math.max(1, (o.duration ?? 400) * k),
      delay: (o.delay ?? 0) * k,
      easing: o.easing ?? ease.escape,
      fill: o.fill ?? "both",
      iterations: reduced ? 1 : o.iterations ?? 1,
      direction: o.direction ?? "normal",
    });
    return a.finished.then(() => a).catch(() => a);
  }

  function stagger(els, keyframes, o = {}) {
    return Promise.all(
      Array.from(els).map((el, i) =>
        anim(el, keyframes, { ...o, delay: (o.delay ?? 0) + i * (o.step ?? 60) })
      )
    );
  }

  // Cancellable numeric tween. Returns { promise, cancel }.
  function tween(duration, easing, onUpdate) {
    let raf, cancelled = false, resolve;
    const promise = new Promise((r) => (resolve = r));
    const d = Math.max(1, duration * k);
    const t0 = performance.now();
    const f = typeof easing === "function" ? easing : fn[easing] || fn.escape;
    const step = (now) => {
      if (cancelled) return resolve(false);
      // rAF timestamps can precede t0 by a frame; clamp so we never extrapolate.
      const t = Math.max(0, Math.min(1, (now - t0) / d));
      onUpdate(f(t), t);
      if (t < 1) raf = requestAnimationFrame(step);
      else resolve(true);
    };
    raf = requestAnimationFrame(step);
    return {
      promise,
      cancel() {
        cancelled = true;
        cancelAnimationFrame(raf);
        resolve(false);
      },
    };
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms * (reduced ? 0 : 1)));
  const lerp = (a, b, t) => a + (b - a) * t;

  function haptic(ms = 8) {
    try {
      if (navigator.vibrate) navigator.vibrate(ms);
    } catch (_) {}
  }

  window.Motion = { reduced, ease, fn, anim, stagger, tween, wait, lerp, haptic };
})();

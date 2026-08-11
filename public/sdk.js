(function () {
  "use strict";

  var script = document.currentScript;
  var siteId = script && script.getAttribute("data-site-id");
  if (!siteId) return;

  var endpoint = new URL("/api/events", script.src).toString();

  function send(event, metadata) {
    var payload = JSON.stringify({ siteId: siteId, event: event, metadata: metadata || {} });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([payload], { type: "application/json" }));
      return;
    }
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(function () {});
  }

  // No cookies, no localStorage, no persistent visitor identifier — every
  // event only carries what's needed to count it against this site.
  send("pageview", { path: location.pathname, referrer: document.referrer || null });

  document.addEventListener("click", function (e) {
    var el = e.target && e.target.closest ? e.target.closest("[data-monetizeos-track]") : null;
    if (!el) return;
    send("click", { label: el.getAttribute("data-monetizeos-track"), path: location.pathname });
  });

  window.monetizeos = function (event, metadata) {
    send(String(event), metadata || {});
  };
})();

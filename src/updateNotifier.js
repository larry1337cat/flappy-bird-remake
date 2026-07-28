import { t } from "./i18n.js";
import { loadSave } from "./save.js";

function showBanner(onReload) {
  const strings = t(loadSave().lang);
  const banner = document.createElement("div");
  banner.id = "update-banner";
  banner.innerHTML = `<span>${strings.updateAvailable}</span><button>${strings.reloadNow}</button>`;
  banner.querySelector("button").addEventListener("click", onReload);
  document.body.appendChild(banner);
}

export function watchForUpdates() {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.register("./sw.js").catch((e) => console.warn("SW dang ky that bai:", e));

  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  navigator.serviceWorker.ready.then((registration) => {
    if (registration.waiting) {
      showBanner(() => registration.waiting.postMessage("SKIP_WAITING"));
    }

    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;
      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          showBanner(() => newWorker.postMessage("SKIP_WAITING"));
        }
      });
    });
  });
}

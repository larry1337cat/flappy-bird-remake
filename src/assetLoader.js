import { IMAGE_MANIFEST } from "./config.js";

export const images = {};

function loadImage(key, src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => {
      console.warn("Khong tai duoc anh:", src);
      resolve();
    };
    img.src = src;
    images[key] = img;
  });
}

export async function preloadAll(onProgress) {
  const entries = Object.entries(IMAGE_MANIFEST);
  let done = 0;
  await Promise.all(
    entries.map(([key, path]) =>
      loadImage(key, "assets/" + path).then(() => {
        done++;
        if (onProgress) onProgress(done / entries.length);
      })
    )
  );
}

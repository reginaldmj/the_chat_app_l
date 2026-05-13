export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
}

function estimateDataUrlSize(dataUrl) {
  const encoded = String(dataUrl).split(",")[1] || "";
  return Math.round((encoded.length * 3) / 4);
}

export async function resizeImageFile(file, {
  maxEdge = 900,
  maxBytes = 360 * 1024,
  quality = 0.72,
} = {}) {
  const sourceUrl = await readFileAsDataUrl(file);
  const image = await loadImage(sourceUrl);
  const sourceEdge = Math.max(image.naturalWidth, image.naturalHeight);

  if (sourceEdge <= maxEdge && file.size <= maxBytes) {
    return {
      dataUrl: sourceUrl,
      size: file.size,
      type: file.type || "image/jpeg",
    };
  }

  let edge = maxEdge;
  let imageQuality = quality;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const scale = Math.min(1, edge / sourceEdge);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

    const context = canvas.getContext("2d");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", imageQuality);
    const size = estimateDataUrlSize(dataUrl);

    if (size <= maxBytes || attempt === 4) {
      return {
        dataUrl,
        size,
        type: "image/jpeg",
      };
    }

    if (imageQuality > 0.5) {
      imageQuality -= 0.1;
    } else {
      edge *= 0.82;
    }
  }

  return {
    dataUrl: sourceUrl,
    size: file.size,
    type: file.type || "image/jpeg",
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'processCaptures') {
    console.log('Received processCaptures message in content script');
    createFullPageImage(message.captures);
  } else if (message.type === 'startCapture') {
    console.log('Starting capture process');
    capturePage();
  }
});

async function capturePage() {
  const body = document.body;
  const nav = document.querySelector('nav'); // Selecciona el nav

  if (nav) {
    nav.style.display = 'none'; // Oculta el nav temporalmente
  }

  const { height } = body.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const captures = [];
  let y = 0;

  console.log('Starting page capture');
  while (y < height) {
    window.scrollTo(0, y);
    console.log(`Scrolled to y: ${y}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Espera 1 segundo para evitar superar la cuota

    // Captura la pestaña visible actual
    await new Promise(resolve => {
      chrome.runtime.sendMessage({ type: 'capture' }, (dataUrl) => {
        captures.push(dataUrl);
        console.log('Captured image');
        resolve();
      });
    });

    y += viewportHeight;
  }

  // Vuelve al principio de la página
  window.scrollTo(0, 0);

  if (nav) {
    nav.style.display = ''; // Restaura la visibilidad del nav
  }

  console.log('Finished page capture, sending processCaptures message');
  chrome.runtime.sendMessage({ type: 'processCaptures', captures });
}

function createFullPageImage(images) {
  console.log('Creating full page image from captures');
  const imgElements = images.map(src => {
    const img = document.createElement('img');
    img.src = src;
    return img;
  });

  // Espera a que todas las imágenes se carguen
  Promise.all(imgElements.map(img => {
    return new Promise(resolve => {
      img.onload = () => resolve();
    });
  })).then(() => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    const width = imgElements[0].width;
    const height = imgElements.reduce((total, img) => total + img.height, 0);

    canvas.width = width;
    canvas.height = height;

    let yOffset = 0;
    imgElements.forEach(img => {
      context.drawImage(img, 0, yOffset);
      yOffset += img.height;
    });

    const fullImageUrl = canvas.toDataURL('image/png');

    // Enviar la imagen al popup para que el usuario elija el formato de guardado
    chrome.runtime.sendMessage({ type: 'saveImage', url: fullImageUrl });
  });
}

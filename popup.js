document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('capture').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      const messageElement = document.getElementById('message');

      if (currentTab.url.startsWith('chrome://')) {
        messageElement.textContent = 'No se puede capturar la pantalla de una página interna del navegador.';
        return;
      }

      messageElement.textContent = ''; // Limpiar mensajes anteriores

      chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        files: ['contentScript.js']
      }).then(() => {
        console.log("Script injected and executed.");
        chrome.runtime.sendMessage({ type: 'startCapture', tabId: currentTab.id });
      }).catch((error) => {
        console.error("Script injection failed: ", error);
      });
    });
  });

  // Maneja la opción de guardado una vez que se completa la captura
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'saveImage') {
      const imgUrl = message.url;

      document.getElementById('save-pdf').style.display = 'block';
      document.getElementById('save-png').style.display = 'block';
      document.getElementById('save-jpeg').style.display = 'block';

      document.getElementById('save-pdf').addEventListener('click', () => {
        saveAsPDF(imgUrl);
      });

      document.getElementById('save-png').addEventListener('click', () => {
        saveAsImage(imgUrl, 'png');
      });

      document.getElementById('save-jpeg').addEventListener('click', () => {
        saveAsImage(imgUrl, 'jpeg');
      });
    }
  });

  function saveAsPDF(imageDataUrl) {
    const pdf = new jsPDF('p', 'pt', 'a4'); // Usa jsPDF directamente
    const imgProps = pdf.getImageProperties(imageDataUrl);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imageDataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('capture.pdf');
  }

  function saveAsImage(imageDataUrl, format) {
    const link = document.createElement('a');
    link.href = imageDataUrl;
    link.download = `capture.${format}`;
    link.click();
  }
});

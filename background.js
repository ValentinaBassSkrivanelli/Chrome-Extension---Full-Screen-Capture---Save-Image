let captures = [];
let isCapturing = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'capture') {
    chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error('Error during capture:', chrome.runtime.lastError.message);
        sendResponse();
        return;
      }
      captures.push(dataUrl);
      console.log('Captured image in background script');
      sendResponse();
    });

    return true; // Indica que la respuesta es asíncrona
  }

  if (message.type === 'processCaptures') {
    console.log('Received processCaptures message in background script');
    chrome.tabs.sendMessage(sender.tab.id, { type: 'processCaptures', captures });
    captures = []; // Reinicia las capturas para la siguiente operación
    isCapturing = false; // Reset capturing flag
  }

  if (message.type === 'openImage') {
    console.log('Opening image in new tab');
    chrome.tabs.create({ url: message.url });
  }

  if (message.type === 'startCapture') {
    if (!isCapturing) {
      isCapturing = true;
      if (message.tabId) {
        chrome.tabs.sendMessage(message.tabId, { type: 'startCapture' });
      } else {
        console.error('No tabId found in startCapture message');
        isCapturing = false;
      }
    }
  }
});

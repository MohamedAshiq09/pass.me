// Content Script for Pass.me Extension
// Injected into all web pages to detect forms and auto-fill passwords

interface ExtensionMessage {
  type: string;
  payload?: any;
  requestId?: string;
}

// State
let isFormDetectionEnabled = true;
let detectedForms: HTMLFormElement[] = [];
let currentDomain = '';

// Initialize content script
function initialize() {
  currentDomain = extractDomain(window.location.href);

  // Detect existing forms
  detectLoginForms();

  // Watch for new forms (SPA navigation)
  observeDOM();

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener(handleMessage);

  console.log('Pass.me content script initialized for:', currentDomain);
}

// Extract domain from URL
function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    // Remove www. prefix and normalize
    return hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

// Detect login forms on the page
function detectLoginForms() {
  const forms = document.querySelectorAll('form');
  detectedForms = [];

  forms.forEach(form => {
    if (isLoginForm(form)) {
      detectedForms.push(form);
      addPassMeButton(form);
    }
  });

  if (detectedForms.length > 0) {
    notifyFormsDetected();
  }
}

// Check if form is a login form
function isLoginForm(form: HTMLFormElement): boolean {
  const inputs = form.querySelectorAll('input');
  let hasEmailOrUsername = false;
  let hasPassword = false;

  inputs.forEach(input => {
    const type = input.type.toLowerCase();
    const name = input.name.toLowerCase();
    const id = input.id.toLowerCase();
    const placeholder = input.placeholder.toLowerCase();

    // Check for email/username field
    if (
      type === 'email' ||
      name.includes('email') ||
      name.includes('username') ||
      name.includes('user') ||
      id.includes('email') ||
      id.includes('username') ||
      placeholder.includes('email') ||
      placeholder.includes('username')
    ) {
      hasEmailOrUsername = true;
    }

    // Check for password field
    if (type === 'password') {
      hasPassword = true;
    }
  });

  return hasEmailOrUsername && hasPassword;
}

// Add Pass.me button to login form
function addPassMeButton(form: HTMLFormElement) {
  // Check if button already exists
  if (form.querySelector('.pass-me-fill-btn')) {
    return;
  }

  const passwordField = form.querySelector('input[type="password"]') as HTMLInputElement;
  if (!passwordField) return;

  // Create Pass.me button
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'pass-me-fill-btn';
  button.innerHTML = '🔐 Pass.me';
  button.style.cssText = `
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    cursor: pointer;
    z-index: 10000;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  `;

  // Position relative to password field
  passwordField.style.position = 'relative';
  passwordField.style.paddingRight = '80px';

  // Add click handler
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    requestAutoFill(form);
  });

  // Insert button
  const container = passwordField.parentElement;
  if (container) {
    container.style.position = 'relative';
    container.appendChild(button);
  }
}

// Request auto-fill from extension
async function requestAutoFill(form: HTMLFormElement) {
  try {
    const usernameField = findUsernameField(form);

    if (!usernameField) {
      showNotification('Username field not found', 'error');
      return;
    }

    console.log('🔍 Requesting passwords for domain:', currentDomain);

    // Send message to background script with current domain
    const response = await chrome.runtime.sendMessage({
      type: 'REQUEST_AUTO_FILL',
      payload: {
        domain: currentDomain,
        url: window.location.href,
      },
    });

    console.log('📨 Auto-fill response:', response);

    if (response.success && response.data && response.data.length > 0) {
      // If multiple entries found, use the first one or show selection
      const entry = response.data[0];
      fillForm(form, entry.username, entry.password);
      showNotification('Password filled successfully', 'success');
    } else {
      showNotification(`No password found for ${currentDomain}`, 'info');
      console.log('ℹ️ No passwords found for this domain');
    }
  } catch (error) {
    console.error('Auto-fill error:', error);
    showNotification('Failed to auto-fill password', 'error');
  }
}

// Find username/email field in form
function findUsernameField(form: HTMLFormElement): HTMLInputElement | null {
  const inputs = form.querySelectorAll('input');

  for (const input of inputs) {
    const type = input.type.toLowerCase();
    const name = input.name.toLowerCase();
    const id = input.id.toLowerCase();

    if (
      type === 'email' ||
      type === 'text' ||
      name.includes('email') ||
      name.includes('username') ||
      name.includes('user') ||
      id.includes('email') ||
      id.includes('username')
    ) {
      return input as HTMLInputElement;
    }
  }

  return null;
}

// Fill form with credentials
function fillForm(form: HTMLFormElement, username: string, password: string) {
  const usernameField = findUsernameField(form);
  const passwordField = form.querySelector('input[type="password"]') as HTMLInputElement;

  if (usernameField && passwordField) {
    // Fill fields
    usernameField.value = username;
    passwordField.value = password;

    // Trigger events to notify the page
    usernameField.dispatchEvent(new Event('input', { bubbles: true }));
    usernameField.dispatchEvent(new Event('change', { bubbles: true }));
    passwordField.dispatchEvent(new Event('input', { bubbles: true }));
    passwordField.dispatchEvent(new Event('change', { bubbles: true }));

    // Focus password field
    passwordField.focus();

    console.log('✅ Form filled with credentials');
  }
}

// Handle messages from background script
function handleMessage(
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: any) => void
) {
  console.log('📨 Content script received message:', message.type);

  switch (message.type) {
    case 'FILL_FORM':
      if (message.payload) {
        const form = detectedForms[0]; // Use first detected form
        if (form) {
          fillForm(form, message.payload.username, message.payload.password);
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'No form found' });
        }
      }
      break;

    case 'INSERT_PASSWORD':
      if (message.payload?.password) {
        insertPasswordAtCursor(message.payload.password);
        sendResponse({ success: true });
      }
      break;

    case 'DETECT_FORMS':
      detectLoginForms();
      sendResponse({
        success: true,
        data: { formsCount: detectedForms.length }
      });
      break;

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
}

// Insert password at cursor position
function insertPasswordAtCursor(password: string) {
  const activeElement = document.activeElement as HTMLInputElement;

  if (activeElement && (activeElement.type === 'password' || activeElement.type === 'text')) {
    activeElement.value = password;
    activeElement.dispatchEvent(new Event('input', { bubbles: true }));
    activeElement.dispatchEvent(new Event('change', { bubbles: true }));

    showNotification('Password inserted', 'success');
  }
}

// Observe DOM changes for SPA navigation
function observeDOM() {
  const observer = new MutationObserver((mutations) => {
    let shouldRedetect = false;

    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.tagName === 'FORM' || element.querySelector('form')) {
              shouldRedetect = true;
            }
          }
        });
      }
    });

    if (shouldRedetect) {
      setTimeout(detectLoginForms, 500); // Delay to allow form to fully render
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Notify background script about detected forms
function notifyFormsDetected() {
  chrome.runtime.sendMessage({
    type: 'FORMS_DETECTED',
    payload: {
      domain: currentDomain,
      url: window.location.href,
      formsCount: detectedForms.length,
    },
  }).catch(() => {
    // Background script might not be ready
  });
}

// Show notification to user
function showNotification(message: string, type: 'success' | 'error' | 'info') {
  // Remove existing notification
  const existing = document.querySelector('.pass-me-notification');
  if (existing) {
    existing.remove();
  }

  // Create notification
  const notification = document.createElement('div');
  notification.className = 'pass-me-notification';
  notification.textContent = message;

  const colors = {
    success: '#22c55e',
    error: '#ef4444',
    info: '#3b82f6',
  };

  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type]};
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 10001;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease-out;
  `;

  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(notification);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.remove();
    style.remove();
  }, 3000);
}

// Capture form submissions for password saving
function captureFormSubmissions() {
  document.addEventListener('submit', (event) => {
    const form = event.target as HTMLFormElement;

    if (isLoginForm(form)) {
      const usernameField = findUsernameField(form);
      const passwordField = form.querySelector('input[type="password"]') as HTMLInputElement;

      if (usernameField && passwordField && usernameField.value && passwordField.value) {
        // Ask user if they want to save this password
        setTimeout(() => {
          offerToSavePassword(usernameField.value, passwordField.value);
        }, 1000); // Delay to allow form submission to complete
      }
    }
  });
}

// Offer to save password
function offerToSavePassword(username: string, password: string) {
  // Create save prompt
  const prompt = document.createElement('div');
  prompt.className = 'pass-me-save-prompt';
  prompt.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      z-index: 10002;
      max-width: 300px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <span style="font-size: 20px; margin-right: 8px;">🔐</span>
        <strong>Save password?</strong>
      </div>
      <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">
        Save this password to Pass.me for ${currentDomain}?
      </p>
      <div style="display: flex; gap: 8px;">
        <button id="pass-me-save-yes" style="
          flex: 1;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 14px;
          cursor: pointer;
        ">Save</button>
        <button id="pass-me-save-no" style="
          flex: 1;
          background: #f3f4f6;
          color: #374151;
          border: none;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 14px;
          cursor: pointer;
        ">Not now</button>
      </div>
    </div>
  `;

  document.body.appendChild(prompt);

  // Handle save
  prompt.querySelector('#pass-me-save-yes')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      type: 'SAVE_PASSWORD',
      payload: {
        domain: currentDomain,
        username,
        password,
        url: window.location.href,
      },
    });
    prompt.remove();
    showNotification('Password saved to Pass.me', 'success');
  });

  // Handle dismiss
  prompt.querySelector('#pass-me-save-no')?.addEventListener('click', () => {
    prompt.remove();
  });

  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (document.body.contains(prompt)) {
      prompt.remove();
    }
  }, 10000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Also capture form submissions
captureFormSubmissions();

// Export for testing
export {
  detectLoginForms,
  isLoginForm,
  extractDomain,
};
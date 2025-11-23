/**
 * Content Script: Callback Handler
 * Runs on localhost:3000/callback to capture OAuth response
 * and forward zkLogin data to the extension
 */

// Check if we're on the callback page with JWT
function handleCallback() {
  const fragment = window.location.hash;

  if (!fragment || !fragment.includes('id_token=')) {
    console.log('🔍 No id_token in URL fragment');
    return;
  }

  console.log('🎯 Pass.me: OAuth callback detected!');

  // Extract JWT token
  const idTokenMatch = fragment.match(/id_token=([^&]+)/);
  if (!idTokenMatch) {
    console.error('❌ Could not extract id_token');
    showMessage('Failed to extract token', 'error');
    return;
  }

  const jwtToken = decodeURIComponent(idTokenMatch[1]);
  console.log('✅ JWT token extracted');

  // Show processing message
  showMessage('Processing zkLogin...', 'info');

  // Send to background script for processing
  chrome.runtime.sendMessage(
    {
      type: 'PROCESS_ZKLOGIN_CALLBACK',
      payload: { jwtToken },
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error('❌ Error sending to background:', chrome.runtime.lastError);
        showMessage('Extension communication error. Please try again.', 'error');
        return;
      }

      if (response && response.success) {
        console.log('✅ zkLogin completed!');
        console.log('📍 Address:', response.address);
        showMessage(`Login successful! Address: ${response.address.slice(0, 8)}...${response.address.slice(-6)}`, 'success');

        // Auto-close after 2 seconds
        setTimeout(() => {
          showMessage('You can close this tab and open the extension.', 'success');
        }, 2000);
      } else {
        console.error('❌ zkLogin failed:', response?.error);
        showMessage(response?.error || 'Login failed. Please try again.', 'error');
      }
    }
  );
}

// Show message to user
function showMessage(message: string, type: 'success' | 'error' | 'info') {
  // Remove existing message
  const existing = document.getElementById('passme-callback-message');
  if (existing) {
    existing.remove();
  }

  const colors = {
    success: { bg: '#22c55e', text: '#ffffff' },
    error: { bg: '#ef4444', text: '#ffffff' },
    info: { bg: '#3b82f6', text: '#ffffff' },
  };

  const color = colors[type];

  const container = document.createElement('div');
  container.id = 'passme-callback-message';
  container.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="
        background: white;
        border-radius: 16px;
        padding: 32px 48px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        max-width: 400px;
      ">
        <div style="font-size: 48px; margin-bottom: 16px;">
          ${type === 'success' ? '✅' : type === 'error' ? '❌' : '🔄'}
        </div>
        <h2 style="margin: 0 0 12px 0; color: #1f2937; font-size: 24px;">
          Pass.me
        </h2>
        <p style="
          margin: 0;
          padding: 12px 16px;
          background: ${color.bg};
          color: ${color.text};
          border-radius: 8px;
          font-size: 14px;
        ">
          ${message}
        </p>
        ${type === 'success' ? `
          <p style="margin-top: 16px; color: #6b7280; font-size: 12px;">
            You can now close this tab and use the extension
          </p>
        ` : ''}
      </div>
    </div>
  `;

  document.body.appendChild(container);
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', handleCallback);
} else {
  handleCallback();
}

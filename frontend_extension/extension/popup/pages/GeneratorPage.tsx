import React, { useState } from 'react';
// import {
//   generatePassword,
//   calculatePasswordStrength,
//   getPasswordStrengthLabel,
//   type PasswordOptions,
// } from '@/lib/crypto/passwordGenerator';

// Mock implementations for development
interface PasswordOptions {
  length?: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
}

const generatePassword = (options: PasswordOptions = {}): string => {
  const {
    length = 16,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
  } = options;

  let charset = '';
  if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (includeNumbers) charset += '0123456789';
  if (includeSymbols) charset += '!@#$%^&*()-_=+[]{}|;:,.<>?';

  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

const calculatePasswordStrength = (password: string): number => {
  let score = 0;
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 25;
  if (/[a-z]/.test(password)) score += 12.5;
  if (/[A-Z]/.test(password)) score += 12.5;
  if (/[0-9]/.test(password)) score += 12.5;
  if (/[^a-zA-Z0-9]/.test(password)) score += 12.5;
  return Math.min(score, 100);
};

const getPasswordStrengthLabel = (score: number) => {
  if (score < 40) return { label: 'Weak', color: '#ef4444' };
  if (score < 60) return { label: 'Fair', color: '#f97316' };
  if (score < 80) return { label: 'Good', color: '#eab308' };
  return { label: 'Strong', color: '#22c55e' };
};

interface Props {
  onBack: () => void;
}

export default function GeneratorPage({ onBack }: Props) {
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
  });
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState(0);

  const handleGenerate = () => {
    const generated = generatePassword(options);
    setPassword(generated);
    setStrength(calculatePasswordStrength(generated));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      // Show temporary notification
      const notification = document.createElement('div');
      notification.textContent = 'Password copied!';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #22c55e;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        z-index: 10000;
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy to clipboard');
    }
  };

  const strengthLabel = getPasswordStrengthLabel(strength);

  return (
    <div className="generator-page">
      <div className="page-header">
        <button onClick={onBack} className="back-btn">←</button>
        <h2>Password Generator</h2>
      </div>

      <div className="generator-content">
        <div className="generated-password">
          <input
            type="text"
            value={password}
            readOnly
            placeholder="Click generate to create password"
            style={{ fontFamily: 'monospace' }}
          />
          <button onClick={handleCopy} disabled={!password}>📋</button>
        </div>

        {password && (
          <div className="strength-meter">
            <div className="strength-bar-container">
              <div
                className="strength-bar"
                style={{
                  width: `${strength}%`,
                  backgroundColor: strengthLabel.color,
                  height: '8px',
                  borderRadius: '4px',
                  transition: 'all 0.3s ease',
                }}
              />
            </div>
            <span style={{ color: strengthLabel.color, fontSize: '12px', fontWeight: '600' }}>
              {strengthLabel.label} ({strength}/100)
            </span>
          </div>
        )}

        <div className="generator-options">
          <div className="option-row">
            <label>Length: {options.length}</label>
            <input
              type="range"
              min="8"
              max="128"
              value={options.length}
              onChange={(e) => setOptions({ ...options, length: parseInt(e.target.value) })}
            />
          </div>

          <div className="option-row">
            <label>
              <input
                type="checkbox"
                checked={options.includeUppercase}
                onChange={(e) => setOptions({ ...options, includeUppercase: e.target.checked })}
              />
              Uppercase (A-Z)
            </label>
          </div>

          <div className="option-row">
            <label>
              <input
                type="checkbox"
                checked={options.includeLowercase}
                onChange={(e) => setOptions({ ...options, includeLowercase: e.target.checked })}
              />
              Lowercase (a-z)
            </label>
          </div>

          <div className="option-row">
            <label>
              <input
                type="checkbox"
                checked={options.includeNumbers}
                onChange={(e) => setOptions({ ...options, includeNumbers: e.target.checked })}
              />
              Numbers (0-9)
            </label>
          </div>

          <div className="option-row">
            <label>
              <input
                type="checkbox"
                checked={options.includeSymbols}
                onChange={(e) => setOptions({ ...options, includeSymbols: e.target.checked })}
              />
              Symbols (!@#$)
            </label>
          </div>
        </div>

        <button className="generate-btn" onClick={handleGenerate}>
          🎲 Generate Password
        </button>

        {password && (
          <div className="password-tips">
            <h4>Security Tips:</h4>
            <ul>
              <li>Use unique passwords for each account</li>
              <li>Longer passwords are generally stronger</li>
              <li>Include a mix of character types</li>
              <li>Avoid common words or patterns</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
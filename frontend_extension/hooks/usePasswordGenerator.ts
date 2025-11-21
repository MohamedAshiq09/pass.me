import { useState, useCallback } from 'react';

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

export function usePasswordGenerator() {
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
  });

  const [generatedPassword, setGeneratedPassword] = useState('');
  const [strength, setStrength] = useState(0);

  const generate = useCallback(() => {
    const password = generatePassword(options);
    const passwordStrength = calculatePasswordStrength(password);
    
    setGeneratedPassword(password);
    setStrength(passwordStrength);
    
    return password;
  }, [options]);

  const updateOptions = useCallback((newOptions: Partial<PasswordOptions>) => {
    setOptions((prev: PasswordOptions) => ({ ...prev, ...newOptions }));
  }, []);

  const strengthLabel = getPasswordStrengthLabel(strength);

  return {
    options,
    updateOptions,
    generate,
    generatedPassword,
    strength,
    strengthLabel,
  };
}
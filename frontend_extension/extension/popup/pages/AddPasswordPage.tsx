import React, { useState } from 'react';
import { useVault } from '@/contexts/VaultContext';
import { generateRandomPassword } from '@/lib/crypto/passwordGenerator';
import { hash } from '@/lib/crypto/encryption';
import { PASSWORD_CATEGORIES } from '@/config/constants';

interface Props {
  onBack: () => void;
  onSave: () => void;
}

export default function AddPasswordPage({ onBack, onSave }: Props) {
  const { addEntry } = useVault();
  const [domain, setDomain] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState<string>(PASSWORD_CATEGORIES[0]);
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    const generated = generateRandomPassword({ length: 16 });
    setPassword(generated);
    setTimeout(() => setIsGenerating(false), 300);
  };

  const handleSave = async () => {
    if (!domain || !username || !password) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsSaving(true);
      const passwordHash = await hash(password);

      await addEntry({
        domain,
        username,
        password, // Store the actual password
        passwordHash, // Store the hash for breach detection
        category,
        notes,
        favorite: false,
      });

      onSave();
    } catch (error) {
      console.error('Error saving password:', error);
      alert('Failed to save password');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="add-password-page">
      <div className="page-header">
        <button onClick={onBack} className="back-btn">←</button>
        <h2>Add Password</h2>
      </div>

      <div className="form">
        <div className="form-group">
          <label>Website/Domain *</label>
          <input
            type="text"
            placeholder="e.g., facebook.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Username/Email *</label>
          <input
            type="text"
            placeholder="your@email.com"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Password *</label>
          <div className="password-input">
            <input
              type="password"
              placeholder="Enter or generate password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? '...' : '🎲'}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {PASSWORD_CATEGORIES.map((cat: string) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Notes (Optional)</label>
          <textarea
            placeholder="Any additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <button
          className="save-btn"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Password'}
        </button>
      </div>
    </div>
  );
}
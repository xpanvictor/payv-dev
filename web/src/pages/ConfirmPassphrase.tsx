import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { getMnemonicWords } from '../services/walletService';
import './ConfirmPassphrase.css';

const VERIFICATION_WORD_COUNT = 3;

/**
 * Passphrase confirmation screen - user must verify they wrote down the phrase.
 * Randomly selects 3 words to verify.
 */
export function ConfirmPassphrase() {
    const navigate = useNavigate();
    const { pendingWallet } = useWallet();
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [error, setError] = useState<string | null>(null);

    const words = useMemo(() => {
        if (!pendingWallet) return [];
        return getMnemonicWords(pendingWallet.mnemonic);
    }, [pendingWallet]);

    const verificationIndices = useMemo(() => {
        const indices: number[] = [];
        const TOTAL_WORDS = 12;
        while (indices.length < VERIFICATION_WORD_COUNT) {
            const idx = Math.floor(Math.random() * TOTAL_WORDS);
            if (!indices.includes(idx)) {
                indices.push(idx);
            }
        }
        return indices.sort((a, b) => a - b);
    }, []);

    if (!pendingWallet) {
        navigate('/');
        return null;
    }

    const handleInputChange = (index: number, value: string) => {
        setError(null);
        setAnswers(prev => ({
            ...prev,
            [index]: value.toLowerCase().trim()
        }));
    };

    const handleVerify = () => {
        for (const idx of verificationIndices) {
            if (answers[idx] !== words[idx]) {
                setError(`Word #${idx + 1} is incorrect. Please check your recovery phrase.`);
                return;
            }
        }
        navigate('/set-pin');
    };

    const handleBack = () => {
        navigate('/passphrase');
    };

    const allFilled = verificationIndices.every(idx => answers[idx]?.length > 0);

    return (
        <div className="page-container">
            <div className="page-content confirm-page animate-fade-in">
                {/* Header */}
                <header className="confirm-header">
                    <button className="btn btn-ghost" onClick={handleBack}>
                        ← Back
                    </button>
                    <div className="step-indicator">
                        <span className="step completed">✓</span>
                        <span className="step-line active"></span>
                        <span className="step active">2</span>
                        <span className="step-line"></span>
                        <span className="step">3</span>
                    </div>
                </header>

                {/* Main Content */}
                <main className="confirm-main">
                    <div className="confirm-intro">
                        <span className="intro-icon">✅</span>
                        <h1 className="text-display text-2xl font-bold">
                            Verify Your Phrase
                        </h1>
                        <p className="text-secondary text-center">
                            Enter the words in the positions shown to confirm you've saved your recovery phrase.
                        </p>
                    </div>

                    {/* Verification Inputs */}
                    <div className="verification-inputs">
                        {verificationIndices.map((idx) => (
                            <div key={idx} className="input-group">
                                <label className="input-label">
                                    Word #{idx + 1}
                                </label>
                                <input
                                    type="text"
                                    className={`input ${error && answers[idx] !== words[idx] ? 'input-error' : ''}`}
                                    placeholder={`Enter word #${idx + 1}`}
                                    value={answers[idx] || ''}
                                    onChange={(e) => handleInputChange(idx, e.target.value)}
                                    autoComplete="off"
                                    autoCapitalize="off"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="error-banner">
                            <span className="error-icon">⚠️</span>
                            <span className="text-error text-sm">{error}</span>
                        </div>
                    )}
                </main>

                {/* Actions */}
                <footer className="confirm-actions">
                    <button
                        className="btn btn-primary btn-full btn-lg"
                        onClick={handleVerify}
                        disabled={!allFilled}
                    >
                        Verify & Continue
                        <span className="btn-arrow">→</span>
                    </button>
                </footer>
            </div>
        </div>
    );
}

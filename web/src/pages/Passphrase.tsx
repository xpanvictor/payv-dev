import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { getMnemonicWords } from '../services/walletService';
import './Passphrase.css';

/**
 * Passphrase display screen - shows the 12-word recovery phrase.
 * User must copy/write down before proceeding.
 */
export function Passphrase() {
    const navigate = useNavigate();
    const { pendingWallet } = useWallet();
    const [isRevealed, setIsRevealed] = useState(false);
    const [hasCopied, setHasCopied] = useState(false);

    if (!pendingWallet) {
        navigate('/');
        return null;
    }

    const words = getMnemonicWords(pendingWallet.mnemonic);

    const handleReveal = () => {
        setIsRevealed(true);
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(pendingWallet.mnemonic);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    };

    const handleContinue = () => {
        navigate('/confirm-passphrase');
    };

    const handleBack = () => {
        navigate('/');
    };

    return (
        <div className="page-container">
            <div className="page-content passphrase-page animate-fade-in">
                {/* Header */}
                <header className="passphrase-header">
                    <button className="btn btn-ghost" onClick={handleBack}>
                        ← Back
                    </button>
                    <div className="step-indicator">
                        <span className="step active">1</span>
                        <span className="step-line"></span>
                        <span className="step">2</span>
                        <span className="step-line"></span>
                        <span className="step">3</span>
                    </div>
                </header>

                {/* Main Content */}
                <main className="passphrase-main">
                    <div className="passphrase-intro">
                        <span className="intro-icon">📝</span>
                        <h1 className="text-display text-2xl font-bold">
                            Your Recovery Phrase
                        </h1>
                        <p className="text-secondary text-center">
                            Write down these 12 words in order. This is the only way to recover your wallet.
                        </p>
                    </div>

                    {/* Warning Banner */}
                    <div className="warning-banner glass-card">
                        <span className="warning-icon">⚠️</span>
                        <div className="warning-text">
                            <strong>Never share your recovery phrase</strong>
                            <span className="text-secondary text-sm">
                                Anyone with this phrase can access your wallet
                            </span>
                        </div>
                    </div>

                    {/* Mnemonic Display */}
                    <div className={`mnemonic-container ${isRevealed ? 'revealed' : ''}`}>
                        {!isRevealed ? (
                            <div className="mnemonic-blur" onClick={handleReveal}>
                                <span className="blur-icon">👁️</span>
                                <span className="text-secondary">Tap to reveal phrase</span>
                            </div>
                        ) : (
                            <>
                                <div className="mnemonic-grid">
                                    {words.map((word, index) => (
                                        <div
                                            key={index}
                                            className="mnemonic-word"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <span className="mnemonic-index">{index + 1}</span>
                                            <span className="mnemonic-text">{word}</span>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    className="btn btn-secondary btn-full mt-md"
                                    onClick={handleCopy}
                                >
                                    {hasCopied ? '✓ Copied!' : '📋 Copy to Clipboard'}
                                </button>
                            </>
                        )}
                    </div>
                </main>

                {/* Actions */}
                <footer className="passphrase-actions">
                    <button
                        className="btn btn-primary btn-full btn-lg"
                        onClick={handleContinue}
                        disabled={!isRevealed}
                    >
                        I've Written It Down
                        <span className="btn-arrow">→</span>
                    </button>
                </footer>
            </div>
        </div>
    );
}

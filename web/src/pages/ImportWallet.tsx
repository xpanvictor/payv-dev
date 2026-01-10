import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { isValidMnemonic } from '../services/walletService';
import './ImportWallet.css';

const WORD_COUNT = 12;

/**
 * Import wallet screen - allows users to restore a wallet from a recovery phrase.
 */
export function ImportWallet() {
    const navigate = useNavigate();
    const { restoreWallet } = useWallet();
    const [words, setWords] = useState<string[]>(Array(WORD_COUNT).fill(''));
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleWordChange = (index: number, value: string) => {
        const newWords = [...words];
        newWords[index] = value.toLowerCase().trim();
        setWords(newWords);
        setError(null);
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const pastedText = e.clipboardData.getData('text');
        const pastedWords = pastedText.trim().split(/\s+/);

        if (pastedWords.length === WORD_COUNT) {
            e.preventDefault();
            setWords(pastedWords.map(w => w.toLowerCase()));
        }
    };

    const handleImport = async () => {
        const mnemonic = words.join(' ');

        if (!isValidMnemonic(mnemonic)) {
            setError('Invalid recovery phrase. Please check your words and try again.');
            return;
        }

        setIsLoading(true);
        try {
            restoreWallet(mnemonic);
            navigate('/set-pin');
        } catch (err) {
            setError('Failed to import wallet. Please check your phrase.');
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        navigate('/');
    };

    const allFilled = words.every(w => w.length > 0);

    return (
        <div className="page-container">
            <div className="page-content import-page animate-fade-in">
                {/* Header */}
                <header className="import-header">
                    <button className="btn btn-ghost" onClick={handleBack}>
                        ← Back
                    </button>
                </header>

                {/* Main Content */}
                <main className="import-main">
                    <div className="import-intro">
                        <span className="intro-icon">📥</span>
                        <h1 className="text-display text-2xl font-bold">
                            Import Wallet
                        </h1>
                        <p className="text-secondary text-center">
                            Enter your 12-word recovery phrase to restore your wallet.
                        </p>
                    </div>

                    {/* Word Grid */}
                    <div className="word-grid" onPaste={handlePaste}>
                        {words.map((word, index) => (
                            <div key={index} className="word-input-wrapper">
                                <span className="word-number">{index + 1}</span>
                                <input
                                    type="text"
                                    className={`word-input ${error ? 'input-error' : ''}`}
                                    value={word}
                                    onChange={(e) => handleWordChange(index, e.target.value)}
                                    placeholder="..."
                                    autoComplete="off"
                                    autoCapitalize="off"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Paste Hint */}
                    <p className="paste-hint text-secondary text-sm text-center">
                        💡 Tip: You can paste all 12 words at once
                    </p>

                    {/* Error Message */}
                    {error && (
                        <div className="error-banner">
                            <span className="error-icon">⚠️</span>
                            <span className="text-error text-sm">{error}</span>
                        </div>
                    )}
                </main>

                {/* Actions */}
                <footer className="import-actions">
                    <button
                        className="btn btn-primary btn-full btn-lg"
                        onClick={handleImport}
                        disabled={!allFilled || isLoading}
                    >
                        {isLoading ? 'Importing...' : 'Import Wallet'}
                        {!isLoading && <span className="btn-arrow">→</span>}
                    </button>
                </footer>
            </div>
        </div>
    );
}

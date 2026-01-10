import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet, WalletStatus } from '../context/WalletContext';
import './UnlockWallet.css';

const PIN_LENGTH = 6;

/**
 * Unlock wallet screen - shown when wallet exists but is locked.
 */
export function UnlockWallet() {
    const navigate = useNavigate();
    const { status, address, unlock } = useWallet();
    const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(''));
    const [error, setError] = useState<string | null>(null);
    const [attempts, setAttempts] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const MAX_ATTEMPTS = 5;

    useEffect(() => {
        if (status === WalletStatus.UNLOCKED) {
            navigate('/dashboard');
        } else if (status === WalletStatus.NO_WALLET) {
            navigate('/');
        }
    }, [status, navigate]);

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handlePinChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newPin = [...pin];
        newPin[index] = value.slice(-1);
        setPin(newPin);
        setError(null);

        if (value && index < PIN_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        if (value && index === PIN_LENGTH - 1) {
            const fullPin = newPin.join('');
            if (fullPin.length === PIN_LENGTH) {
                handleUnlock(fullPin);
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleUnlock = async (fullPin: string) => {
        if (attempts >= MAX_ATTEMPTS) {
            setError('Too many failed attempts. Please wait.');
            return;
        }

        setIsLoading(true);
        const success = await unlock(fullPin);
        setIsLoading(false);

        if (success) {
            navigate('/dashboard');
        } else {
            setAttempts(prev => prev + 1);
            setError(`Incorrect PIN. ${MAX_ATTEMPTS - attempts - 1} attempts remaining.`);
            setPin(Array(PIN_LENGTH).fill(''));
            inputRefs.current[0]?.focus();
        }
    };

    const truncatedAddress = address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : '';

    return (
        <div className="page-container">
            <div className="page-content unlock-page animate-fade-in">
                {/* Header */}
                <header className="unlock-header">
                    <div className="logo">
                        <span className="logo-icon">◆</span>
                        <span className="logo-text">
                            Pay<span className="logo-accent">V</span>
                        </span>
                    </div>
                </header>

                {/* Main Content */}
                <main className="unlock-main">
                    <div className="unlock-intro">
                        <div className="unlock-avatar">
                            <span className="avatar-icon">🔒</span>
                        </div>
                        <h1 className="text-display text-2xl font-bold">
                            Welcome Back
                        </h1>
                        <p className="wallet-address text-mono text-secondary">
                            {truncatedAddress}
                        </p>
                    </div>

                    {/* PIN Input */}
                    <div className="unlock-pin-container">
                        <p className="text-secondary text-sm mb-md">Enter your PIN</p>
                        <div className="pin-container">
                            {pin.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => { inputRefs.current[index] = el; }}
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={1}
                                    className={`pin-digit ${digit ? 'filled' : ''} ${error ? 'error' : ''}`}
                                    value={digit}
                                    onChange={(e) => handlePinChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    autoComplete="off"
                                    disabled={isLoading || attempts >= MAX_ATTEMPTS}
                                />
                            ))}
                        </div>

                        {error && (
                            <p className="text-error text-sm mt-md">{error}</p>
                        )}
                    </div>
                </main>

                {/* Footer */}
                <footer className="unlock-footer">
                    <button className="btn btn-ghost text-secondary text-sm">
                        Forgot PIN? Restore with Recovery Phrase
                    </button>
                </footer>

                {/* Loading */}
                {isLoading && (
                    <div className="loading-overlay">
                        <div className="loading-spinner"></div>
                        <span className="text-secondary">Unlocking...</span>
                    </div>
                )}
            </div>
        </div>
    );
}

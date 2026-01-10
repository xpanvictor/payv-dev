import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import './SetPin.css';

const PIN_LENGTH = 6;

/**
 * PIN setup screen - user creates a 6-digit PIN to secure their wallet.
 */
export function SetPin() {
    const navigate = useNavigate();
    const { pendingWallet, confirmWalletCreation } = useWallet();
    const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(''));
    const [confirmPin, setConfirmPin] = useState<string[]>(Array(PIN_LENGTH).fill(''));
    const [stage, setStage] = useState<'create' | 'confirm'>('create');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const confirmInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (!pendingWallet) {
            navigate('/');
        }
    }, [pendingWallet, navigate]);

    useEffect(() => {
        // Auto-focus first input
        if (stage === 'create' && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        } else if (stage === 'confirm' && confirmInputRefs.current[0]) {
            confirmInputRefs.current[0].focus();
        }
    }, [stage]);

    const handlePinChange = (index: number, value: string, isConfirm: boolean) => {
        if (!/^\d*$/.test(value)) return;

        const newPin = isConfirm ? [...confirmPin] : [...pin];
        newPin[index] = value.slice(-1);

        if (isConfirm) {
            setConfirmPin(newPin);
        } else {
            setPin(newPin);
        }
        setError(null);

        // Auto-advance to next input
        if (value && index < PIN_LENGTH - 1) {
            const refs = isConfirm ? confirmInputRefs : inputRefs;
            refs.current[index + 1]?.focus();
        }

        // Auto-proceed when all digits entered
        if (value && index === PIN_LENGTH - 1) {
            const fullPin = newPin.join('');
            if (fullPin.length === PIN_LENGTH) {
                if (isConfirm) {
                    handleConfirmComplete(fullPin);
                } else {
                    handleCreateComplete();
                }
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent, isConfirm: boolean) => {
        if (e.key === 'Backspace') {
            const currentPin = isConfirm ? confirmPin : pin;
            if (!currentPin[index] && index > 0) {
                const refs = isConfirm ? confirmInputRefs : inputRefs;
                refs.current[index - 1]?.focus();
            }
        }
    };

    const handleCreateComplete = () => {
        setStage('confirm');
    };

    const handleConfirmComplete = async (fullConfirmPin: string) => {
        const fullPin = pin.join('');
        if (fullConfirmPin !== fullPin) {
            setError('PINs do not match. Please try again.');
            setConfirmPin(Array(PIN_LENGTH).fill(''));
            confirmInputRefs.current[0]?.focus();
            return;
        }

        setIsLoading(true);
        try {
            await confirmWalletCreation(fullPin);
            navigate('/dashboard');
        } catch (err) {
            setError('Failed to create wallet. Please try again.');
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        if (stage === 'confirm') {
            setStage('create');
            setConfirmPin(Array(PIN_LENGTH).fill(''));
            setError(null);
        } else {
            navigate('/confirm-passphrase');
        }
    };

    const currentPin = stage === 'create' ? pin : confirmPin;
    const currentRefs = stage === 'create' ? inputRefs : confirmInputRefs;

    return (
        <div className="page-container">
            <div className="page-content pin-page animate-fade-in">
                {/* Header */}
                <header className="pin-header">
                    <button className="btn btn-ghost" onClick={handleBack}>
                        ← Back
                    </button>
                    <div className="step-indicator">
                        <span className="step completed">✓</span>
                        <span className="step-line active"></span>
                        <span className="step completed">✓</span>
                        <span className="step-line active"></span>
                        <span className="step active">3</span>
                    </div>
                </header>

                {/* Main Content */}
                <main className="pin-main">
                    <div className="pin-intro">
                        <span className="intro-icon">{stage === 'create' ? '🔐' : '🔄'}</span>
                        <h1 className="text-display text-2xl font-bold">
                            {stage === 'create' ? 'Create Your PIN' : 'Confirm Your PIN'}
                        </h1>
                        <p className="text-secondary text-center">
                            {stage === 'create'
                                ? 'Set a 6-digit PIN to secure your wallet'
                                : 'Enter your PIN again to confirm'
                            }
                        </p>
                    </div>

                    {/* PIN Input */}
                    <div className="pin-input-container">
                        <div className="pin-container">
                            {currentPin.map((digit, index) => (
                                <input
                                    key={`${stage}-${index}`}
                                    ref={(el) => { currentRefs.current[index] = el; }}
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={1}
                                    className={`pin-digit ${digit ? 'filled' : ''} ${error ? 'error' : ''}`}
                                    value={digit}
                                    onChange={(e) => handlePinChange(index, e.target.value, stage === 'confirm')}
                                    onKeyDown={(e) => handleKeyDown(index, e, stage === 'confirm')}
                                    autoComplete="off"
                                />
                            ))}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="error-message">
                                <span className="text-error text-sm">{error}</span>
                            </div>
                        )}
                    </div>

                    {/* Security Note */}
                    <div className="security-note glass-card">
                        <span className="note-icon">💡</span>
                        <p className="text-secondary text-sm">
                            Your PIN is used to encrypt your wallet locally.
                            It cannot be recovered if forgotten.
                        </p>
                    </div>
                </main>

                {/* Loading State */}
                {isLoading && (
                    <div className="loading-overlay">
                        <div className="loading-spinner"></div>
                        <span className="text-secondary">Creating wallet...</span>
                    </div>
                )}
            </div>
        </div>
    );
}

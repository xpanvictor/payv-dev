import React, { memo } from 'react';
import { ProofStatus } from '../services/circuitTypes';

// ============================================================================
// Types
// ============================================================================

export interface ShieldModalProps {
    shieldAmount: string;
    pinInput: string;
    proofStatus: ProofStatus;
    error: string | null;
    successMessage: string | null;
    isProofGenerating: boolean;
    onAmountChange: (value: string) => void;
    onPinChange: (value: string) => void;
    onSubmit: () => void;
    onClose: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Shield funds modal - converts public funds to private with ZK proof.
 * Memoized to prevent re-renders when parent state changes unrelated to this modal.
 */
export const ShieldModal = memo(function ShieldModal({
    shieldAmount,
    pinInput,
    proofStatus,
    error,
    successMessage,
    isProofGenerating,
    onAmountChange,
    onPinChange,
    onSubmit,
    onClose,
}: ShieldModalProps) {
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal glass-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="text-display font-semibold">Shield Funds</h2>
                    <button className="modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>
                <div className="modal-content">
                    <p className="text-secondary text-sm mb-md">
                        Convert public funds to private. This generates a ZK proof.
                    </p>

                    <div className="form-group">
                        <label className="form-label">Amount (MNT)</label>
                        <input
                            type="number"
                            className="form-input"
                            placeholder="0.0000"
                            value={shieldAmount}
                            onChange={(e) => onAmountChange(e.target.value)}
                            step="0.0001"
                            min="0"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">PIN</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Enter your PIN"
                            value={pinInput}
                            onChange={(e) => onPinChange(e.target.value)}
                            maxLength={6}
                        />
                    </div>

                    {error && <p className="error-text">{error}</p>}
                    {successMessage && <p className="success-text">{successMessage}</p>}

                    {isProofGenerating && (
                        <div className="proof-status">
                            <span className="spinner">⏳</span>
                            <span className="text-secondary">
                                {proofStatus === ProofStatus.LOADING_CIRCUIT
                                    ? 'Loading circuit...'
                                    : 'Generating proof...'}
                            </span>
                        </div>
                    )}

                    <button
                        className="btn btn-primary w-full"
                        onClick={onSubmit}
                        disabled={isProofGenerating}
                    >
                        {isProofGenerating ? 'Processing...' : 'Shield Funds'}
                    </button>
                </div>
            </div>
        </div>
    );
});

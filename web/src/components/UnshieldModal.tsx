import React, { memo } from 'react';
import { type StoredNote } from '../services/noteStorage';

// ============================================================================
// Types
// ============================================================================

export interface UnshieldModalProps {
    unspentNotes: StoredNote[];
    selectedNullifier: string | null;
    pinInput: string;
    error: string | null;
    successMessage: string | null;
    onNoteSelect: (nullifier: string) => void;
    onPinChange: (value: string) => void;
    onSubmit: () => void;
    onClose: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Unshield funds modal - converts private funds back to public.
 * Memoized to prevent re-renders when parent state changes unrelated to this modal.
 */
export const UnshieldModal = memo(function UnshieldModal({
    unspentNotes,
    selectedNullifier,
    pinInput,
    error,
    successMessage,
    onNoteSelect,
    onPinChange,
    onSubmit,
    onClose,
}: UnshieldModalProps) {
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal glass-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="text-display font-semibold">Unshield Funds</h2>
                    <button className="modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>
                <div className="modal-content">
                    <p className="text-secondary text-sm mb-md">
                        Convert private funds back to public.
                    </p>

                    {unspentNotes.length === 0 ? (
                        <div className="empty-state">
                            <p className="text-secondary">No private notes to unshield</p>
                        </div>
                    ) : (
                        <>
                            <div className="form-group">
                                <label className="form-label">Select Note</label>
                                <div className="notes-select">
                                    {unspentNotes.map((note) => (
                                        <button
                                            key={note.nullifier}
                                            className={`note-select-item ${selectedNullifier === note.nullifier
                                                    ? 'selected'
                                                    : ''
                                                }`}
                                            onClick={() => onNoteSelect(note.nullifier)}
                                        >
                                            <span className="note-value">
                                                {(Number(note.value) / 1e18).toFixed(4)} MNT
                                            </span>
                                            <span className="note-date text-secondary text-xs">
                                                {new Date(note.createdAt).toLocaleDateString()}
                                            </span>
                                        </button>
                                    ))}
                                </div>
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

                            <button
                                className="btn btn-primary w-full"
                                onClick={onSubmit}
                                disabled={!selectedNullifier}
                            >
                                Unshield Funds
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
});

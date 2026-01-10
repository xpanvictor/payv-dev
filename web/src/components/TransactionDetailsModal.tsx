import React from 'react';
import type { Transaction } from '../services/walletService';

interface TransactionDetailsModalProps {
    transaction: Transaction;
    onClose: () => void;
}

export function TransactionDetailsModal({ transaction, onClose }: TransactionDetailsModalProps) {
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal glass-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="text-display font-semibold">Transaction Details</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-content">
                    <div className="detail-row">
                        <span className="text-secondary text-sm">Type</span>
                        <span className="data-value font-medium">{transaction.type}</span>
                    </div>

                    <div className="detail-row">
                        <span className="text-secondary text-sm">Amount</span>
                        <span className="data-value font-mono">{transaction.amount} MNT</span>
                    </div>

                    <div className="detail-row">
                        <span className="text-secondary text-sm">Status</span>
                        <span className={`status-badge status-${transaction.status.toLowerCase()}`}>
                            {transaction.status}
                        </span>
                    </div>

                    <div className="detail-row">
                        <span className="text-secondary text-sm">Date</span>
                        <span className="data-value text-sm">{formatDate(transaction.date)}</span>
                    </div>

                    {transaction.hash && (
                        <div className="detail-group">
                            <span className="text-secondary text-sm block mb-xs">Transaction Hash</span>
                            <div className="hash-box text-xs text-mono break-all bg-dark p-sm rounded">
                                {transaction.hash}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

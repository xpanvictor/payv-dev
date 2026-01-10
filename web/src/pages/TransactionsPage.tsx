import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { TransactionDetailsModal } from '../components/TransactionDetailsModal';
import type { Transaction } from '../services/walletService';

export function TransactionsPage() {
    const navigate = useNavigate();
    const { transactions } = useWallet();
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString();
    };

    return (
        <div className="page-container">
            <div className="page-content animate-fade-in">
                <header className="page-header mb-lg flex items-center gap-md">
                    <button className="btn btn-ghost icon-btn" onClick={() => navigate(-1)}>
                        ←
                    </button>
                    <h1 className="text-display text-xl font-semibold">Transaction History</h1>
                </header>

                <main className="transactions-list">
                    {transactions.length === 0 ? (
                        <div className="empty-state glass-card p-xl text-center">
                            <span className="empty-icon text-4xl mb-md block">📭</span>
                            <p className="text-secondary">No transactions found</p>
                        </div>
                    ) : (
                        <div className="glass-card">
                            {transactions.map((tx) => (
                                <div
                                    key={tx.id}
                                    className="transaction-item p-md border-b border-light flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                                    onClick={() => setSelectedTx(tx)}
                                >
                                    <div className="tx-left flex items-center gap-md">
                                        <div className={`tx-icon circle-icon ${tx.type.toLowerCase()}`}>
                                            {tx.type === 'SEND' && '📤'}
                                            {tx.type === 'RECEIVE' && '📥'}
                                            {tx.type === 'SHIELD' && '🔒'}
                                            {tx.type === 'UNSHIELD' && '🔓'}
                                        </div>
                                        <div className="tx-info">
                                            <div className="tx-type font-medium">{tx.type}</div>
                                            <div className="tx-date text-xs text-secondary">{formatDate(tx.date)}</div>
                                        </div>
                                    </div>
                                    <div className="tx-right text-right">
                                        <div className="tx-amount font-mono font-medium">
                                            {tx.type === 'SEND' || tx.type === 'SHIELD' ? '-' : '+'}
                                            {tx.amount} MNT
                                        </div>
                                        <div className={`tx-status text-xs status-${tx.status.toLowerCase()}`}>
                                            {tx.status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {selectedTx && (
                <TransactionDetailsModal
                    transaction={selectedTx}
                    onClose={() => setSelectedTx(null)}
                />
            )}
        </div>
    );
}

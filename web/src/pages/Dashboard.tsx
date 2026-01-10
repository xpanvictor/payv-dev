import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet, WalletStatus } from '../context/WalletContext';
import { MantleTestnet } from '../services/walletService';
import { ProofStatus } from '../services/circuitTypes';
import { ShieldModal } from '../components/ShieldModal';
import { UnshieldModal } from '../components/UnshieldModal';
import './Dashboard.css';

/**
 * Modal types for Shield/Unshield operations
 */
enum ModalType {
    NONE = 'NONE',
    SHIELD = 'SHIELD',
    UNSHIELD = 'UNSHIELD',
}

/**
 * Main dashboard - shows wallet balance and actions after unlocking.
 */
export function Dashboard() {
    const navigate = useNavigate();
    const {
        status,
        address,
        publicBalance,
        privateBalance,
        notes,
        proofStatus,
        lock,
        refreshBalances,
        removeWallet,
        shield,
        unshield,
    } = useWallet();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [activeModal, setActiveModal] = useState<ModalType>(ModalType.NONE);
    const [shieldAmount, setShieldAmount] = useState('');
    const [selectedNullifier, setSelectedNullifier] = useState<string | null>(null);
    const [pinInput, setPinInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        if (status === WalletStatus.NO_WALLET) {
            navigate('/');
        } else if (status === WalletStatus.LOCKED) {
            navigate('/unlock');
        }
    }, [status, navigate]);

    // Memoized computed values
    const truncatedAddress = useMemo(() =>
        address ? `${address.slice(0, 8)}...${address.slice(-6)}` : '',
        [address]
    );

    const unspentNotes = useMemo(() =>
        notes.filter((n) => !n.spent),
        [notes]
    );

    const isProofGenerating = useMemo(() =>
        proofStatus === ProofStatus.LOADING_CIRCUIT ||
        proofStatus === ProofStatus.GENERATING_PROOF,
        [proofStatus]
    );

    // Memoized handlers with useCallback
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await refreshBalances();
        setIsRefreshing(false);
    }, [refreshBalances]);

    const handleLock = useCallback(() => {
        lock();
        navigate('/unlock');
    }, [lock, navigate]);

    const handleCopyAddress = useCallback(async () => {
        if (address) {
            await navigator.clipboard.writeText(address);
        }
    }, [address]);

    const closeModal = useCallback(() => {
        setActiveModal(ModalType.NONE);
        setShieldAmount('');
        setSelectedNullifier(null);
        setPinInput('');
        setError(null);
        setSuccessMessage(null);
    }, []);

    const handleShield = useCallback(async () => {
        if (!shieldAmount || !pinInput) {
            setError('Please enter amount and PIN');
            return;
        }

        setError(null);
        const result = await shield(shieldAmount, pinInput);

        if (result.success) {
            setSuccessMessage(`Shielded ${shieldAmount} MNT successfully!`);
            setShieldAmount('');
            setPinInput('');
            setTimeout(() => {
                setActiveModal(ModalType.NONE);
                setSuccessMessage(null);
            }, 2000);
        } else {
            setError(result.error ?? 'Shield failed');
        }
    }, [shieldAmount, pinInput, shield]);

    const handleUnshield = useCallback(async () => {
        if (!selectedNullifier || !pinInput) {
            setError('Please select a note and enter PIN');
            return;
        }

        setError(null);
        const result = await unshield(selectedNullifier, pinInput);

        if (result.success) {
            setSuccessMessage('Unshielded successfully!');
            setSelectedNullifier(null);
            setPinInput('');
            setTimeout(() => {
                setActiveModal(ModalType.NONE);
                setSuccessMessage(null);
            }, 2000);
        } else {
            setError(result.error ?? 'Unshield failed');
        }
    }, [selectedNullifier, pinInput, unshield]);

    // Modal handlers for child components
    const handleAmountChange = useCallback((value: string) => setShieldAmount(value), []);
    const handlePinChange = useCallback((value: string) => setPinInput(value), []);
    const handleNoteSelect = useCallback((nullifier: string) => setSelectedNullifier(nullifier), []);

    if (status !== WalletStatus.UNLOCKED) {
        return null;
    }

    return (
        <div className="page-container">
            <div className="page-content dashboard animate-fade-in">
                {/* Header */}
                <header className="dashboard-header">
                    <div className="logo">
                        <span className="logo-icon">◆</span>
                        <span className="logo-text">
                            Vault<span className="logo-accent">3</span>
                        </span>
                    </div>
                    <div className="header-actions">
                        <button
                            className="btn btn-ghost icon-btn"
                            onClick={() => setShowMenu(!showMenu)}
                        >
                            ⚙️
                        </button>
                    </div>

                    {/* Dropdown Menu */}
                    {showMenu && (
                        <div className="dropdown-menu glass-card">
                            <button className="dropdown-item" onClick={handleLock}>
                                🔒 Lock Wallet
                            </button>
                            <button
                                className="dropdown-item danger"
                                onClick={() => {
                                    if (confirm('Are you sure? This will delete your wallet.')) {
                                        removeWallet();
                                    }
                                }}
                            >
                                🗑️ Delete Wallet
                            </button>
                        </div>
                    )}
                </header>

                {/* Balance Card */}
                <main className="dashboard-main">
                    <div className="balance-card glass-card glow-effect">
                        <div className="balance-header">
                            <span className="text-secondary text-sm">Wallet Balances</span>
                            <button
                                className={`refresh-btn ${isRefreshing ? 'spinning' : ''}`}
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                            >
                                🔄
                            </button>
                        </div>

                        <div className="balance-split">
                            <div className="balance-section balance-public">
                                <div className="balance-label">
                                    <span className="balance-icon">🔓</span>
                                    <span className="text-secondary text-xs">Public</span>
                                </div>
                                <div className="balance-amount-small">
                                    <span className="balance-value text-display text-2xl font-bold">
                                        {publicBalance ?? '0.0000'}
                                    </span>
                                    <span className="balance-currency text-secondary text-sm">
                                        {MantleTestnet.CURRENCY_SYMBOL}
                                    </span>
                                </div>
                            </div>

                            <div className="balance-divider"></div>

                            <div className="balance-section balance-private">
                                <div className="balance-label">
                                    <span className="balance-icon">🔒</span>
                                    <span className="text-secondary text-xs">Private</span>
                                </div>
                                <div className="balance-amount-small">
                                    <span className="balance-value text-display text-2xl font-bold">
                                        {privateBalance ?? '0.0000'}
                                    </span>
                                    <span className="balance-currency text-secondary text-sm">
                                        {MantleTestnet.CURRENCY_SYMBOL}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="wallet-address-row" onClick={handleCopyAddress}>
                            <span className="text-mono text-secondary text-sm">
                                {truncatedAddress}
                            </span>
                            <span className="copy-icon">📋</span>
                        </div>

                        <div className="network-badge">
                            <span className="network-dot"></span>
                            <span className="text-secondary text-xs">{MantleTestnet.NETWORK_NAME}</span>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="quick-actions">
                        <button
                            className="action-btn glass-card"
                            onClick={() => setActiveModal(ModalType.SHIELD)}
                        >
                            <span className="action-icon">🔒</span>
                            <span className="action-label">Shield</span>
                        </button>
                        <button
                            className="action-btn glass-card"
                            onClick={() => setActiveModal(ModalType.UNSHIELD)}
                        >
                            <span className="action-icon">🔓</span>
                            <span className="action-label">Unshield</span>
                        </button>
                        <button className="action-btn glass-card">
                            <span className="action-icon">📤</span>
                            <span className="action-label">Send</span>
                        </button>
                        <button className="action-btn glass-card">
                            <span className="action-icon">📥</span>
                            <span className="action-label">Receive</span>
                        </button>
                    </div>

                    {/* Private Notes */}
                    {unspentNotes.length > 0 && (
                        <div className="notes-section">
                            <h2 className="text-display font-semibold mb-md">Private Notes</h2>
                            <div className="notes-list">
                                {unspentNotes.map((note) => (
                                    <div key={note.nullifier} className="note-item glass-card">
                                        <div className="note-value">
                                            {(Number(note.value) / 1e18).toFixed(4)} MNT
                                        </div>
                                        <div className="note-meta text-secondary text-xs">
                                            {new Date(note.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Transaction History Placeholder */}
                    <div className="transactions-section">
                        <h2 className="text-display font-semibold mb-md">Recent Activity</h2>
                        <div className="empty-state glass-card">
                            <span className="empty-icon">📭</span>
                            <p className="text-secondary text-sm">No transactions yet</p>
                        </div>
                    </div>
                </main>

                {/* Network Status */}
                <footer className="dashboard-footer">
                    <a
                        href={`${MantleTestnet.EXPLORER_URL}/address/${address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost text-secondary text-sm"
                    >
                        View on Explorer ↗
                    </a>
                </footer>
            </div>

            {/* Shield Modal */}
            {activeModal === ModalType.SHIELD && (
                <ShieldModal
                    shieldAmount={shieldAmount}
                    pinInput={pinInput}
                    proofStatus={proofStatus}
                    error={error}
                    successMessage={successMessage}
                    isProofGenerating={isProofGenerating}
                    onAmountChange={handleAmountChange}
                    onPinChange={handlePinChange}
                    onSubmit={handleShield}
                    onClose={closeModal}
                />
            )}

            {/* Unshield Modal */}
            {activeModal === ModalType.UNSHIELD && (
                <UnshieldModal
                    unspentNotes={unspentNotes}
                    selectedNullifier={selectedNullifier}
                    pinInput={pinInput}
                    error={error}
                    successMessage={successMessage}
                    onNoteSelect={handleNoteSelect}
                    onPinChange={handlePinChange}
                    onSubmit={handleUnshield}
                    onClose={closeModal}
                />
            )}
        </div>
    );
}

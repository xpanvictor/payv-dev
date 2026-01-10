import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import './Onboarding.css';

/**
 * Welcome/Onboarding screen - first screen users see.
 * Offers options to create or import a wallet.
 */
export function Onboarding() {
    const navigate = useNavigate();
    const { generateNewWallet } = useWallet();

    const handleCreateWallet = () => {
        generateNewWallet();
        navigate('/passphrase');
    };

    const handleImportWallet = () => {
        navigate('/import');
    };

    return (
        <div className="page-container">
            <div className="page-content onboarding">
                {/* Header */}
                <header className="onboarding-header">
                    <div className="logo">
                        <span className="logo-icon">◆</span>
                        <span className="logo-text">
                            Pay<span className="logo-accent">V</span>
                        </span>
                    </div>
                </header>

                {/* Hero Section */}
                <main className="onboarding-main">
                    <div className="hero-container glow-effect">
                        <div className="hero-visual">
                            <div className="hero-orb"></div>
                            <div className="hero-shield">🛡️</div>
                        </div>

                        <div className="security-badge glass-card">
                            <span className="badge-icon">🔐</span>
                            <div className="badge-text">
                                <span className="badge-title">End-to-End Encrypted</span>
                                <span className="badge-subtitle">Zero-knowledge proof</span>
                            </div>
                        </div>
                    </div>

                    <div className="onboarding-headlines">
                        <h1 className="text-display text-4xl font-bold text-center">
                            Anonymous<br />by Design
                        </h1>
                        <p className="text-secondary text-center">
                            Transact freely without exposing your identity. Your keys, your data.
                        </p>
                    </div>

                    {/* Page Indicators */}
                    <div className="page-indicators">
                        <span className="indicator active"></span>
                        <span className="indicator"></span>
                        <span className="indicator"></span>
                    </div>
                </main>

                {/* Actions */}
                <footer className="onboarding-actions">
                    <button
                        className="btn btn-primary btn-full btn-lg"
                        onClick={handleCreateWallet}
                    >
                        Create New Wallet
                        <span className="btn-arrow">→</span>
                    </button>

                    <button
                        className="btn btn-secondary btn-full"
                        onClick={handleImportWallet}
                    >
                        I already have a wallet
                    </button>

                    <div className="security-hint">
                        <span className="hint-icon">🔓</span>
                        <span className="text-secondary text-sm">Secured by Web Crypto API</span>
                    </div>
                </footer>
            </div>
        </div>
    );
}

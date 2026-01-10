import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';

interface ReceiveModalProps {
    onClose: () => void;
}

export function ReceiveModal({ onClose }: ReceiveModalProps) {
    const { address } = useWallet();
    const [copied, setCopied] = useState(false);

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleCopy = async () => {
        if (address) {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal glass-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="text-display font-semibold">Receive MNT</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-content text-center">
                    <p className="text-secondary text-sm mb-lg">
                        Scan this code or copy the address below to receive funds.
                    </p>

                    <div className="qr-placeholder glass-card mb-lg flex items-center justify-center" style={{ height: '200px', background: 'rgba(0,0,0,0.2)' }}>
                        {/* 
                           TODO: Integrate a QR code library here. 
                           For now, using a placeholder text.
                        */}
                        <span className="text-secondary text-xs">QR Code Placeholder</span>
                    </div>


                    <div className="address-box glass-card p-md mb-md break-all text-mono text-sm">
                        {address}
                    </div>

                    <button className="btn btn-ghost w-full mb-md" onClick={handleCopy}>
                        {copied ? '✅ Copied!' : '📋 Copy Address'}
                    </button>

                    <div className="border-t border-light pt-md mt-md">
                        <p className="text-secondary text-xs mb-sm">Need testnet funds?</p>
                        <a
                            href="https://faucet.sepolia.mantle.xyz/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary text-sm hover:underline flex items-center justify-center gap-xs"
                        >
                            💧 Go to Mantle Faucet ↗
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

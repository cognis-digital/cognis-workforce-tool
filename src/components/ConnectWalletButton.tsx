import React, { useState } from 'react';
import { Wallet } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import WalletConnectModal from './modals/WalletConnectModal';

export default function ConnectWalletButton() {
  const { isConnected } = useWallet();
  const [showModal, setShowModal] = useState(false);

  if (isConnected) {
    return null; // Don't show button if already connected
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </button>

      <WalletConnectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
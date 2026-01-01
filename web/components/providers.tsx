'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { circleArcTestnet } from '@/config';
import { UIProvider } from '@/lib/context/UIContext';

export default function Providers({ children }: { children: React.ReactNode }) {
    // Privy embedded wallets require HTTPS or localhost.
    // We check for a secure context to prevent a runtime crash in non-secure environments.
    const isSecureContext = typeof window !== 'undefined' &&
        (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    return (
        <PrivyProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cmj4he35y00tpky0cf3wm9fks'}
            config={{
                appearance: {
                    theme: 'light',
                    accentColor: '#3b82f6', // primary blue
                    logo: '/img/logo.png',
                    showWalletLoginFirst: false,
                },
                loginMethods: ['google', 'apple', 'email', 'wallet'],
                embeddedWallets: {
                    ethereum: {
                        createOnLogin: isSecureContext ? 'users-without-wallets' : 'off',
                    },
                },
                supportedChains: [circleArcTestnet],
                defaultChain: circleArcTestnet,
            }}
        >
            <UIProvider>
                {children}
            </UIProvider>
        </PrivyProvider>
    );
}

'use client';

import { usePrivy } from '@privy-io/react-auth';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useUI } from '@/lib/context/UIContext';
import { ProfileModal } from '@/components/profile/ProfileModal';

export default function LoginButton() {
    const { ready, authenticated, login, logout, user } = usePrivy();
    const { isProfileModalOpen, openProfileModal, closeProfileModal } = useUI();

    if (!ready) return <div className="h-10 w-24 bg-slate-100 animate-pulse rounded-full" />;

    return (
        <>
            <div className="flex items-center gap-3">
                {authenticated ? (
                    <>
                        <button
                            onClick={openProfileModal}
                            className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200/60 transition-all hover:bg-white hover:shadow-sm hover:border-primary/20 cursor-pointer group"
                        >
                            <UserIcon className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                            <span className="text-xs font-black text-slate-900 tracking-tight group-hover:text-primary transition-colors">
                                {user?.email?.address?.split('@')[0] || user?.wallet?.address?.slice(0, 6) + '...'}
                            </span>
                        </button>
                        <button
                            onClick={logout}
                            className="p-2 rounded-full font-bold text-xs transition-all duration-300 bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500 active:scale-95 group"
                            title="Logout"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </>
                ) : (
                    <button
                        onClick={login}
                        className="px-6 py-2.5 rounded-full font-black text-xs transition-all duration-300 bg-primary text-white hover:shadow-xl hover:shadow-primary/30 active:scale-95 uppercase tracking-widest"
                    >
                        Get Started
                    </button>
                )}
            </div>
            <ProfileModal isOpen={isProfileModalOpen} onClose={closeProfileModal} />
        </>
    );
}

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { usePrivy } from "@privy-io/react-auth"
import { motion, AnimatePresence } from "framer-motion"
import {
    X,
    ShieldCheck,
    CreditCard,
    Wallet,
    Copy,
    ExternalLink,
    Check,
    User,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ArrowUpRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { usePayment } from "@/hooks/usePayment"
import { useKYC } from "@/hooks/useKYC"
import { BankAccounts, BankAccount } from "./BankAccounts"
import { TransactionModal } from "./TransactionModal"

interface ProfileModalProps {
    isOpen: boolean
    onClose: () => void
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
    const { user } = usePrivy()
    const { kycStatus, setKycStatus, verifying, verifyBVN, verifyNIN, isVerified, needsVerification } = useKYC()
    const { exchangeRate, calculateOnRampAmount, calculateOffRampAmount } = usePayment()

    const [activeTab, setActiveTab] = useState<"profile" | "funds" | "wallet">("profile")
    const [copied, setCopied] = useState(false)
    const [mounted, setMounted] = useState(false)

    // Transaction State
    const [transactionOpen, setTransactionOpen] = useState(false)
    const [transactionType, setTransactionType] = useState<'deposit' | 'withdraw'>('deposit')
    const [accounts, setAccounts] = useState<BankAccount[]>([])

    useEffect(() => {
        setMounted(true)
        const script = document.createElement('script')
        script.src = 'https://widget.dojah.io/widget.js'
        script.async = true
        document.body.appendChild(script)
        return () => {
            document.body.removeChild(script)
        }
    }, [])

    const handleVerify = () => {
        if (typeof window !== 'undefined' && (window as any).Dojah) {
            const config = {
                app_id: process.env.NEXT_PUBLIC_DOJAH_APP_ID,
                p_key: process.env.NEXT_PUBLIC_DOJAH_PUBLIC_KEY,
                type: 'custom',
                config: {
                    widget_id: process.env.NEXT_PUBLIC_DOJAH_WIDGET_ID || "your-widget-id",
                    debug: false,
                    pages: [
                        { page: 'government-data', config: { bvn: true, nin: true } },
                        { page: 'selfie' },
                    ]
                },
                onSuccess: function (response: any) {
                    // In production, this response should be verified on backend
                    // For frontend demo, we optimistic update
                    setKycStatus({
                        bvnVerified: true,
                        ninVerified: true,
                        status: 'verified'
                    })
                },
                onError: function (err: any) {
                    // Handle error silently or report to monitoring
                },
                onClose: function () {
                }
            }
            const connect = new (window as any).Dojah(config)
            connect.open()
        } else {
            console.warn("Dojah widget not loaded yet")
        }
    }

    if (!mounted) return null

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm overflow-y-auto"
                    onClick={onClose}
                >
                    <div className="min-h-full flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-2xl bg-card border border-border rounded-[2.5rem] shadow-premium overflow-hidden flex flex-col my-8"
                        >
                            {/* Header */}
                            <div className="p-8 border-b border-border flex justify-between items-start bg-muted/20">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-secondary p-0.5">
                                        <div className="h-full w-full bg-card rounded-[14px] flex items-center justify-center overflow-hidden">
                                            {user?.email?.address ? (
                                                <span className="text-2xl font-black text-primary">
                                                    {user.email.address.charAt(0).toUpperCase()}
                                                </span>
                                            ) : (
                                                <User className="h-8 w-8 text-muted-foreground" />
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-heading font-black text-foreground tracking-tight">
                                            Identity Profile
                                        </h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className={cn("text-[10px] uppercase font-black tracking-widest px-2 py-0.5 border-border",
                                                isVerified ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-card text-muted-foreground")}>
                                                {isVerified ? "Verified Investor" : "Guest Access"}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground font-mono">
                                                {user?.wallet?.address ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}` : "No Wallet"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted text-muted-foreground">
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Tabs */}
                            <div className="flex p-2 gap-2 bg-muted/20 border-b border-border">
                                {[
                                    { id: "profile", label: "Identity", icon: ShieldCheck },
                                    { id: "funds", label: "Bank & Funds", icon: CreditCard },
                                    { id: "wallet", label: "Web3 Wallet", icon: Wallet }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                                            activeTab === tab.id
                                                ? "bg-primary text-primary-foreground shadow-lg"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        <tab.icon className="h-4 w-4" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Content */}
                            <div className="p-8 overflow-y-auto flex-grow bg-card">
                                <AnimatePresence mode="wait">
                                    {activeTab === "profile" && (
                                        <motion.div
                                            key="profile"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="space-y-6"
                                        >
                                            <div className="p-6 rounded-[2rem] border border-border bg-muted/10 space-y-4">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                                        <ShieldCheck className="h-5 w-5" />
                                                    </div>
                                                    <h3 className="font-bold text-foreground">KYC Verification</h3>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 rounded-2xl bg-card border border-border">
                                                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">BVN Status</div>
                                                        <div className="flex items-center gap-2 font-bold text-foreground">
                                                            {kycStatus.bvnVerified ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <div className="h-2 w-2 rounded-full bg-red-400" />}
                                                            {kycStatus.bvnVerified ? "Verified" : "Pending"}
                                                        </div>
                                                    </div>
                                                    <div className="p-4 rounded-2xl bg-card border border-border">
                                                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">NIN Status</div>
                                                        <div className="flex items-center gap-2 font-bold text-foreground">
                                                            {kycStatus.ninVerified ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <div className="h-2 w-2 rounded-full bg-red-400" />}
                                                            {kycStatus.ninVerified ? "Verified" : "Pending"}
                                                        </div>
                                                    </div>
                                                </div>

                                                {needsVerification && (
                                                    <div className="pt-2">
                                                        <Button onClick={handleVerify} disabled={verifying} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs">
                                                            {verifying ? "Verifying..." : "Complete Verification"}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === "wallet" && (
                                        <motion.div
                                            key="wallet"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="space-y-6"
                                        >
                                            <div className="p-6 rounded-[2rem] border border-border bg-muted/10 text-center space-y-4">
                                                <div className="mx-auto w-16 h-16 bg-card rounded-2xl flex items-center justify-center shadow-sm">
                                                    <Wallet className="h-8 w-8 text-primary" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">Connected Wallet</div>
                                                    <div className="text-lg font-bold text-foreground font-mono mt-1 break-all">
                                                        {user?.wallet?.address || "Not Connected"}
                                                    </div>
                                                </div>
                                                <div className="flex gap-3 justify-center">
                                                    <Button variant="outline" size="sm" onClick={() => {
                                                        if (user?.wallet?.address) {
                                                            navigator.clipboard.writeText(user.wallet.address)
                                                            setCopied(true)
                                                            setTimeout(() => setCopied(false), 2000)
                                                        }
                                                    }} className="rounded-xl border-border hover:bg-muted text-foreground">
                                                        {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                                                        {copied ? "Copied" : "Copy Address"}
                                                    </Button>
                                                    <Button variant="outline" size="sm" className="rounded-xl border-border hover:bg-muted text-foreground">
                                                        <ExternalLink className="h-4 w-4 mr-1" />
                                                        View on Explorer
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === "funds" && (
                                        <motion.div
                                            key="funds"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="space-y-6"
                                        >
                                            <div className="p-6 rounded-[2rem] border border-border bg-muted/10 space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                                                            <CreditCard className="h-5 w-5" />
                                                        </div>
                                                        <h3 className="font-bold text-foreground">Funds & Banking</h3>
                                                    </div>
                                                    <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest bg-card">
                                                        1 USDC = ₦{exchangeRate.toLocaleString()}
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <Button
                                                        className="h-24 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-muted/50 flex flex-col items-center justify-center gap-2 group transition-all"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setTransactionType('deposit')
                                                            setTransactionOpen(true)
                                                        }}
                                                    >
                                                        <div className="p-2 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                                                            <ArrowUpRight className="h-5 w-5 rotate-45" />
                                                        </div>
                                                        <span className="font-bold text-xs uppercase tracking-widest">Deposit (NGN)</span>
                                                    </Button>

                                                    <Button
                                                        className="h-24 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-muted/50 flex flex-col items-center justify-center gap-2 group transition-all"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setTransactionType('withdraw')
                                                            setTransactionOpen(true)
                                                        }}
                                                    >
                                                        <div className="p-2 rounded-full bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform">
                                                            <ArrowUpRight className="h-5 w-5 rotate-12" />
                                                        </div>
                                                        <span className="font-bold text-xs uppercase tracking-widest">Withdraw (NGN)</span>
                                                    </Button>
                                                </div>

                                                <div className="p-4 rounded-2xl bg-card border border-border">
                                                    <BankAccounts accounts={accounts} onUpdate={setAccounts} />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>

                    <TransactionModal
                        isOpen={transactionOpen}
                        onClose={() => setTransactionOpen(false)}
                        type={transactionType}
                        userAddress={user?.wallet?.address}
                        accounts={accounts}
                    />
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    )
}

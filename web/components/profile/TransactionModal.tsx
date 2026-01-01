import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowUpRight, ArrowDownLeft, Loader2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { breetService } from "@/lib/services/breet.service"
import { BankAccount } from "./BankAccounts"
import { usePayment } from "@/hooks/usePayment"

interface TransactionModalProps {
    isOpen: boolean
    onClose: () => void
    type: 'deposit' | 'withdraw'
    userAddress?: string // For on-ramp
    accounts: BankAccount[] // For off-ramp selection
}

export function TransactionModal({ isOpen, onClose, type, userAddress, accounts }: TransactionModalProps) {
    const { exchangeRate } = usePayment()
    const [amount, setAmount] = useState("")
    const [processing, setProcessing] = useState(false)
    const [step, setStep] = useState<'input' | 'processing' | 'success' | 'error'>('input')
    const [result, setResult] = useState<any>(null)
    const [selectedAccount, setSelectedAccount] = useState<string>("")
    const [mounted, setMounted] = useState(false)
    const [copied, setCopied] = useState(false)

    useEffect(() => setMounted(true), [])

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setStep('input')
            setAmount("")
            setResult(null)
            setSelectedAccount("")
        }
    }, [isOpen])

    const handleProcess = async () => {
        if (!amount || isNaN(Number(amount))) return
        setProcessing(true)

        try {
            if (type === 'deposit') {
                // On-Ramp (NGN -> USDC)
                // In prod calls backend proxy
                const res = await breetService.initiateOnRamp({
                    amount: Number(amount),
                    walletAddress: userAddress || "",
                    email: "user@example.com" // Should be from user profile
                })

                if (res.success) {
                    setResult(res)
                    setStep('success')
                } else {
                    throw new Error(res.error)
                }

            } else {
                // Off-Ramp (USDC -> NGN)
                if (!selectedAccount) throw new Error("Select an account")
                const account = accounts.find(a => a.id === selectedAccount)
                if (!account) throw new Error("Invalid account")

                const res = await breetService.initiateOffRamp({
                    amount: Number(amount),
                    bankCode: account.bankCode,
                    accountNumber: account.accountNumber,
                    accountName: account.accountName
                })

                if (res.success) {
                    setResult(res)
                    setStep('success')
                } else {
                    throw new Error(res.error)
                }
            }
        } catch (err: any) {
            setResult({ error: err.message })
            setStep('error')
        } finally {
            setProcessing(false)
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
                    className="fixed inset-0 z-[150] bg-background/90 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-xl ${type === 'deposit' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                    {type === 'deposit' ? <ArrowDownLeft className="h-6 w-6" /> : <ArrowUpRight className="h-6 w-6" />}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-foreground">{type === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}</h2>
                                    <p className="text-xs text-muted-foreground font-mono">1 USDC = ₦{exchangeRate.toLocaleString()}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} rounded-full>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="p-6 space-y-6">
                            {step === 'input' && (
                                <>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-muted-foreground">
                                                Amount ({type === 'deposit' ? 'NGN' : 'USDC'})
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    className="h-14 text-lg font-mono pl-4 pr-16 bg-muted/20"
                                                    placeholder="0.00"
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-muted-foreground text-xs">
                                                    {type === 'deposit' ? 'NGN' : 'USDC'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Estimate */}
                                        <div className="p-4 bg-muted/30 rounded-xl border border-border flex justify-between items-center">
                                            <span className="text-xs font-bold text-muted-foreground">
                                                Estimated {type === 'deposit' ? 'Receive' : 'Payout'}
                                            </span>
                                            <span className="text-lg font-black text-foreground">
                                                {type === 'deposit'
                                                    ? `${(Number(amount || 0) / exchangeRate).toFixed(2)} USDC`
                                                    : `₦${(Number(amount || 0) * exchangeRate).toLocaleString()}`
                                                }
                                            </span>
                                        </div>

                                        {/* Withdraw Account Selection */}
                                        {type === 'withdraw' && (
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-muted-foreground">Select Bank Account</label>
                                                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Account" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {accounts.map(acc => (
                                                            <SelectItem key={acc.id} value={acc.id}>
                                                                {acc.bankName} - {acc.accountNumber}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        onClick={handleProcess}
                                        disabled={!amount || Number(amount) <= 0 || (type === 'withdraw' && !selectedAccount) || processing}
                                        className="w-full h-12 text-base font-black uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90"
                                    >
                                        {processing ? <Loader2 className="animate-spin" /> : "Proceed"}
                                    </Button>
                                </>
                            )}

                            {step === 'input' && type === 'withdraw' && accounts.length === 0 && (
                                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center p-6 z-10">
                                    <div className="bg-card w-full p-6 rounded-2xl border border-border text-center shadow-lg space-y-4">
                                        <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mx-auto">
                                            <ArrowUpRight className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-foreground">No Bank Account</h3>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                You need to link a Nigerian bank account before you can withdraw funds.
                                            </p>
                                        </div>
                                        <Button onClick={onClose} variant="outline" className="w-full">
                                            Close
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {step === 'success' && (
                                <div className="text-center space-y-6 py-4">
                                    <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
                                        <Check className="h-10 w-10" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-foreground">Transaction Initiated</h3>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            {type === 'deposit'
                                                ? "Please complete the payment using the link below."
                                                : "Your funds are being processed and will be sent to your bank account."}
                                        </p>
                                    </div>

                                    {/* On-Ramp Payment Info */}
                                    {type === 'deposit' && result?.paymentUrl && (
                                        <div className="p-4 bg-muted/20 rounded-xl border border-border space-y-3">
                                            <div className="text-xs font-bold text-muted-foreground">Payment Link</div>
                                            <div className="flex items-center gap-2">
                                                <Input readOnly value={result.paymentUrl} className="font-mono text-xs h-9" />
                                                <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => {
                                                    navigator.clipboard.writeText(result.paymentUrl)
                                                    setCopied(true)
                                                    setTimeout(() => setCopied(false), 2000)
                                                }}>
                                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                            <Button className="w-full" asChild>
                                                <a href={result.paymentUrl} target="_blank" rel="noopener noreferrer">
                                                    Open Payment Page <ArrowUpRight className="ml-2 h-4 w-4" />
                                                </a>
                                            </Button>
                                        </div>
                                    )}

                                    <Button variant="outline" onClick={onClose} className="w-full">Close</Button>
                                </div>
                            )}

                            {step === 'error' && (
                                <div className="text-center space-y-6 py-4">
                                    <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
                                        <X className="h-10 w-10" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-foreground">Transaction Failed</h3>
                                        <p className="text-sm text-red-400 mt-2">{result?.error || "Unknown error occurred"}</p>
                                    </div>
                                    <Button onClick={() => setStep('input')} className="w-full">Try Again</Button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    )
}

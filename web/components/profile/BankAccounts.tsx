import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, CheckCircle2, AlertCircle, Building, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { breetService, BankInfo } from "@/lib/services/breet.service"
import { cn } from "@/lib/utils"

export interface BankAccount {
    id: string
    bankName: string
    bankCode: string
    accountNumber: string
    accountName: string
}

interface BankAccountsProps {
    accounts: BankAccount[]
    onUpdate: (accounts: BankAccount[]) => void
}

export function BankAccounts({ accounts, onUpdate }: BankAccountsProps) {
    const [isAdding, setIsAdding] = useState(false)
    const [loading, setLoading] = useState(false)
    const [verifying, setVerifying] = useState(false)

    // Form State
    const [selectedBank, setSelectedBank] = useState<string>("")
    const [accountNumber, setAccountNumber] = useState("")
    const [verifiedName, setVerifiedName] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to remove this account?")) {
            onUpdate(accounts.filter(a => a.id !== id))
        }
    }

    const handleVerify = async () => {
        if (!selectedBank || accountNumber.length < 10) {
            setError("Please select a bank and enter a valid account number")
            return
        }

        setVerifying(true)
        setError(null)
        setVerifiedName(null)

        try {
            // In real prod, this calls backend. Using service directly for now.
            const result = await breetService.verifyBankAccount(selectedBank, accountNumber)
            if (result.success && result.accountName) {
                setVerifiedName(result.accountName)
            } else {
                setError(result.error || "Could not verify account")
            }
        } catch (err) {
            setError("Verification failed")
        } finally {
            setVerifying(false)
        }
    }

    const handleSave = () => {
        if (!verifiedName || !selectedBank) return

        const bank = breetService.getBankByCode(selectedBank)
        const newAccount: BankAccount = {
            id: Math.random().toString(36).substr(2, 9),
            bankName: bank?.name || "Unknown Bank",
            bankCode: selectedBank,
            accountNumber,
            accountName: verifiedName
        }

        onUpdate([...accounts, newAccount])
        setIsAdding(false)
        resetForm()
    }

    const resetForm = () => {
        setSelectedBank("")
        setAccountNumber("")
        setVerifiedName(null)
        setError(null)
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="text-sm font-bold text-foreground">Linked Accounts</div>
                {!isAdding && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAdding(true)}
                        className="h-6 text-[10px] uppercase font-black text-primary hover:bg-primary/10"
                    >
                        <Plus className="h-3 w-3 mr-1" /> Add New
                    </Button>
                )}
            </div>

            <AnimatePresence mode="wait">
                {isAdding ? (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 rounded-2xl bg-card border border-border space-y-4"
                    >
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Add Bank Account</h4>
                            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="h-6 w-6 p-0 rounded-full">
                                <AlertCircle className="h-4 w-4 rotate-45" />
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground">Select Bank</label>
                                <Select onValueChange={setSelectedBank} value={selectedBank}>
                                    <SelectTrigger className="w-full bg-muted/20 border-border">
                                        <SelectValue placeholder="Select Bank" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                        {breetService.nigerianBanks.map(bank => (
                                            <SelectItem key={bank.code} value={bank.code}>
                                                {bank.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground">Account Number</label>
                                <Input
                                    placeholder="0123456789"
                                    value={accountNumber}
                                    onChange={(e) => {
                                        setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))
                                        setVerifiedName(null)
                                    }}
                                    className="bg-muted/20 border-border"
                                />
                            </div>

                            {error && (
                                <div className="text-xs text-red-500 font-medium flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" /> {error}
                                </div>
                            )}

                            {verifiedName && (
                                <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20 flex items-center gap-3">
                                    <div className="p-1 bg-green-500 rounded-full text-white">
                                        <CheckCircle2 className="h-3 w-3" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-green-600 uppercase">Verified Name</div>
                                        <div className="text-sm font-bold text-foreground">{verifiedName}</div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-2 flex gap-2">
                                {!verifiedName ? (
                                    <Button
                                        className="w-full bg-primary text-primary-foreground font-bold"
                                        onClick={handleVerify}
                                        disabled={verifying || !selectedBank || accountNumber.length < 10}
                                    >
                                        {verifying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                        Verify Account
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full bg-green-600 text-white font-bold hover:bg-green-700"
                                        onClick={handleSave}
                                    >
                                        Save Account
                                    </Button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-2"
                    >
                        {accounts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 px-4 text-center rounded-2xl bg-muted/10 border border-dashed border-border/50">
                                <div className="p-3 bg-muted rounded-full mb-3">
                                    <Building className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <h4 className="text-sm font-bold text-foreground">No accounts linked</h4>
                                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Link a Nigerian bank account to withdraw your funds seamlessly.</p>
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => setIsAdding(true)}
                                    className="mt-2 text-xs font-black uppercase tracking-widest text-primary"
                                >
                                    Link Account
                                </Button>
                            </div>
                        ) : (
                            accounts.map(account => (
                                <div key={account.id} className="p-3 rounded-xl bg-muted/30 border border-border flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-card rounded-lg border border-border text-muted-foreground">
                                            <Building className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-foreground">{account.bankName}</div>
                                            <div className="text-[10px] font-mono text-muted-foreground">{account.accountNumber} • {account.accountName}</div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleDelete(account.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

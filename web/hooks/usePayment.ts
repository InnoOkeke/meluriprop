import { useState, useEffect } from 'react'
import { paymentService, Transaction } from '@/lib/services/payment.service'
import { usePrivy } from '@privy-io/react-auth'

export function usePayment() {
    const { user } = usePrivy()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(false)
    const [exchangeRate, setExchangeRate] = useState(1500)

    useEffect(() => {
        loadExchangeRate()
        if (user?.id) {
            loadTransactionHistory()
        }
    }, [user?.id])

    const loadExchangeRate = async () => {
        try {
            const data = await paymentService.getExchangeRate()
            setExchangeRate(data.rate)
        } catch (error) {
            console.error('Failed to load exchange rate:', error)
        }
    }

    const loadTransactionHistory = async () => {
        if (!user?.id) return

        setLoading(true)
        try {
            const history = await paymentService.getTransactionHistory(user.id)
            setTransactions(history)
        } catch (error) {
            console.error('Failed to load transaction history:', error)
        } finally {
            setLoading(false)
        }
    }

    const initiateOnRamp = async (amountNGN: number, walletAddress: string) => {
        if (!user?.id) throw new Error('User not authenticated')

        setLoading(true)
        try {
            const result = await paymentService.initiateOnRamp({
                amount: amountNGN,
                walletAddress,
                userId: user.id,
            })

            // Refresh transaction history
            await loadTransactionHistory()

            return result
        } finally {
            setLoading(false)
        }
    }

    const initiateOffRamp = async (
        amountUSDC: number,
        bankAccountNumber: string,
        bankCode: string
    ) => {
        if (!user?.id) throw new Error('User not authenticated')

        setLoading(true)
        try {
            const result = await paymentService.initiateOffRamp({
                amount: amountUSDC,
                bankAccountNumber,
                bankCode,
                userId: user.id,
            })

            // Refresh transaction history
            await loadTransactionHistory()

            return result
        } finally {
            setLoading(false)
        }
    }

    const calculateOnRampAmount = (amountNGN: number) => {
        return amountNGN / exchangeRate
    }

    const calculateOffRampAmount = (amountUSDC: number) => {
        return amountUSDC * exchangeRate
    }

    return {
        transactions,
        loading,
        exchangeRate,
        initiateOnRamp,
        initiateOffRamp,
        calculateOnRampAmount,
        calculateOffRampAmount,
        refreshTransactions: loadTransactionHistory,
        refreshExchangeRate: loadExchangeRate,
    }
}

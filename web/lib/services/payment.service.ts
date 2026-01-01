/**
 * Payment Service - On/Off Ramp Integration
 * Handles USDC <-> NGN conversions via Breet/Flutterwave
 */

import { breetService } from '@/lib/services/breet.service'

export type PaymentProvider = 'breet' | 'flutterwave' | 'prestmit'
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type TransactionType = 'on-ramp' | 'off-ramp'

export interface OnRampRequest {
    amount: number // NGN amount
    walletAddress: string
    userId: string
}

export interface OffRampRequest {
    amount: number // USDC amount
    bankAccountNumber: string
    bankCode: string
    userId: string
}

export interface Transaction {
    id: string
    type: TransactionType
    status: TransactionStatus
    amount: number
    currency: string
    provider: PaymentProvider
    createdAt: string
    completedAt?: string
}

class PaymentService {
    private baseUrl = '/api/payments'
    private onRampProvider = (process.env.NEXT_PUBLIC_ONRAMP_PROVIDER || 'breet') as PaymentProvider
    private offRampProvider = (process.env.NEXT_PUBLIC_OFFRAMP_PROVIDER || 'breet') as PaymentProvider

    /**
     * Get current USDC/NGN exchange rate
     */
    async getExchangeRate(): Promise<{ rate: number; timestamp: string }> {
        const rates = await breetService.getExchangeRate()
        return {
            rate: rates.rate,
            timestamp: rates.timestamp
        }
    }

    /**
     * Initiate on-ramp (NGN -> USDC)
     */
    async initiateOnRamp(request: OnRampRequest): Promise<any> {
        return breetService.initiateOnRamp({
            amount: request.amount,
            walletAddress: request.walletAddress,
            userId: request.userId
        })
    }

    /**
     * Initiate off-ramp (USDC -> NGN)
     */
    async initiateOffRamp(request: OffRampRequest): Promise<any> {
        // First verify bank account
        const accountCheck = await breetService.verifyBankAccount(request.bankCode, request.bankAccountNumber)
        if (!accountCheck.success) {
            throw new Error(accountCheck.error || 'Invalid bank account')
        }

        return breetService.initiateOffRamp({
            amount: request.amount,
            bankCode: request.bankCode,
            accountNumber: request.bankAccountNumber,
            accountName: accountCheck.accountName || 'Unknown',
            userId: request.userId
        })
    }

    /**
     * Get transaction status
     */
    async getTransactionStatus(transactionId: string): Promise<Transaction | null> {
        // This would typically delegate to the provider specific service
        const status = await breetService.getTransactionStatus(transactionId)
        if (!status) return null

        return {
            id: status.id,
            type: status.type,
            status: status.status,
            amount: status.amount,
            currency: status.currency,
            provider: 'breet',
            createdAt: status.createdAt,
            completedAt: status.completedAt
        }
    }

    /**
     * Get user transaction history
     */
    async getTransactionHistory(userId: string): Promise<Transaction[]> {
        // Return mock data for now to prevent 404 errors until backend is ready
        return [
            {
                id: "tx_1",
                type: "on-ramp",
                status: "completed",
                amount: 50000,
                currency: "NGN",
                provider: "breet",
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                completedAt: new Date(Date.now() - 86000000).toISOString()
            },
            {
                id: "tx_2",
                type: "off-ramp",
                status: "completed",
                amount: 100,
                currency: "USDC",
                provider: "breet",
                createdAt: new Date(Date.now() - 172800000).toISOString(),
                completedAt: new Date(Date.now() - 172400000).toISOString()
            }
        ];
    }

    /**
     * Calculate fees for transaction
     */
    calculateFees(amount: number, type: TransactionType): {
        amount: number
        fee: number
        total: number
    } {
        // Breet typically charges 0-1% fees
        const feePercentage = 0.01 // 1%
        const fee = amount * feePercentage

        return {
            amount,
            fee,
            total: type === 'on-ramp' ? amount + fee : amount - fee,
        }
    }
}

export const paymentService = new PaymentService()

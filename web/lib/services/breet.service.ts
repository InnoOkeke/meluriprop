/**
 * Breet On/Off-Ramp Service - USDC/NGN Conversions
 * https://docs.breet.io/
 */

export interface BreetConfig {
    apiKey: string
    secretKey: string
}

export interface OnRampRequest {
    amount: number // Amount in NGN
    walletAddress: string
    email?: string
    userId?: string
}

export interface OffRampRequest {
    amount: number // Amount in USDC
    bankCode: string
    accountNumber: string
    accountName: string
    userId?: string
}

export interface OnRampResponse {
    success: boolean
    transactionId?: string
    paymentUrl?: string
    paymentReference?: string
    expiresAt?: string
    error?: string
}

export interface OffRampResponse {
    success: boolean
    transactionId?: string
    estimatedTime?: string
    fee?: number
    amountNGN?: number
    error?: string
}

export interface TransactionStatusResponse {
    id: string
    type: 'on-ramp' | 'off-ramp'
    status: 'pending' | 'processing' | 'completed' | 'failed'
    amount: number
    currency: string
    createdAt: string
    completedAt?: string
    reference?: string
}

export interface ExchangeRateResponse {
    rate: number // USDC to NGN rate
    buyRate: number // Rate for buying USDC (NGN -> USDC)
    sellRate: number // Rate for selling USDC (USDC -> NGN)
    timestamp: string
}

export interface BankInfo {
    code: string
    name: string
}

class BreetService {
    private baseUrl = '/api/payments'

    // Nigerian banks list
    readonly nigerianBanks: BankInfo[] = [
        { code: '044', name: 'Access Bank' },
        { code: '023', name: 'Citibank Nigeria' },
        { code: '063', name: 'Diamond Bank' },
        { code: '050', name: 'Ecobank Nigeria' },
        { code: '084', name: 'Enterprise Bank' },
        { code: '070', name: 'Fidelity Bank' },
        { code: '011', name: 'First Bank of Nigeria' },
        { code: '214', name: 'First City Monument Bank' },
        { code: '058', name: 'Guaranty Trust Bank' },
        { code: '030', name: 'Heritage Bank' },
        { code: '301', name: 'Jaiz Bank' },
        { code: '082', name: 'Keystone Bank' },
        { code: '526', name: 'Parallex Bank' },
        { code: '076', name: 'Polaris Bank' },
        { code: '101', name: 'Providus Bank' },
        { code: '221', name: 'Stanbic IBTC Bank' },
        { code: '068', name: 'Standard Chartered Bank' },
        { code: '232', name: 'Sterling Bank' },
        { code: '100', name: 'Suntrust Bank' },
        { code: '032', name: 'Union Bank of Nigeria' },
        { code: '033', name: 'United Bank for Africa' },
        { code: '215', name: 'Unity Bank' },
        { code: '035', name: 'Wema Bank' },
        { code: '057', name: 'Zenith Bank' },
        { code: '999', name: 'OPay' },
        { code: '998', name: 'Kuda Bank' },
        { code: '997', name: 'Palmpay' },
        { code: '996', name: 'Moniepoint' },
    ]

    /**
     * Initiate on-ramp (NGN -> USDC)
     */
    async initiateOnRamp(request: OnRampRequest): Promise<OnRampResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/on-ramp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...request,
                    provider: 'breet'
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to initiate on-ramp')
            }

            const data = await response.json()
            return {
                success: true,
                transactionId: data.transactionId,
                paymentUrl: data.paymentUrl,
                paymentReference: data.paymentReference,
                expiresAt: data.expiresAt
            }
        } catch (error) {
            console.error('On-ramp error:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        }
    }

    /**
     * Initiate off-ramp (USDC -> NGN)
     */
    async initiateOffRamp(request: OffRampRequest): Promise<OffRampResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/off-ramp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...request,
                    provider: 'breet'
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to initiate off-ramp')
            }

            const data = await response.json()
            return {
                success: true,
                transactionId: data.transactionId,
                estimatedTime: data.estimatedTime,
                fee: data.fee,
                amountNGN: data.amountNGN
            }
        } catch (error) {
            console.error('Off-ramp error:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        }
    }

    /**
     * Get transaction status
     */
    async getTransactionStatus(transactionId: string): Promise<TransactionStatusResponse | null> {
        try {
            const response = await fetch(`${this.baseUrl}/status/${transactionId}`)

            if (!response.ok) {
                throw new Error('Failed to fetch transaction status')
            }

            return response.json()
        } catch (error) {
            console.error('Transaction status error:', error)
            return null
        }
    }

    /**
     * Get current exchange rate
     */
    async getExchangeRate(): Promise<ExchangeRateResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/exchange-rate`)

            if (!response.ok) {
                throw new Error('Failed to fetch exchange rate')
            }

            return response.json()
        } catch (error) {
            console.error('Exchange rate error:', error)
            // Return fallback rates
            return {
                rate: 1600,
                buyRate: 1580,
                sellRate: 1620,
                timestamp: new Date().toISOString()
            }
        }
    }

    /**
     * Calculate NGN amount from USDC
     */
    calculateNGN(usdcAmount: number, rate: number): number {
        return Math.round(usdcAmount * rate)
    }

    /**
     * Calculate USDC amount from NGN
     */
    calculateUSDC(ngnAmount: number, rate: number): number {
        return Number((ngnAmount / rate).toFixed(2))
    }

    /**
     * Get bank by code
     */
    getBankByCode(code: string): BankInfo | undefined {
        return this.nigerianBanks.find(bank => bank.code === code)
    }

    /**
     * Verify bank account (for off-ramp)
     */
    async verifyBankAccount(bankCode: string, accountNumber: string): Promise<{
        success: boolean
        accountName?: string
        error?: string
    }> {
        try {
            const response = await fetch(`${this.baseUrl}/verify-account`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ bankCode, accountNumber })
            })

            if (!response.ok) {
                throw new Error('Failed to verify account')
            }

            const data = await response.json()
            return {
                success: true,
                accountName: data.accountName
            }
        } catch (error) {
            console.error('Account verification error:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        }
    }
}

export const breetService = new BreetService()

/**
 * KYC Service - Dojah Integration
 * Handles identity verification for Nigerian users
 */

export type KYCStatus = 'unverified' | 'pending' | 'verified' | 'failed'

export interface KYCVerificationData {
    bvn?: string
    nin?: string
    firstName: string
    lastName: string
    dateOfBirth: string
    phoneNumber: string
}

export interface KYCResult {
    status: KYCStatus
    verificationId: string
    message: string
    data?: any
}

class KYCService {
    private baseUrl = '/api/kyc'
    private dojaAppId = process.env.NEXT_PUBLIC_DOJAH_APP_ID
    private sandboxMode = process.env.NEXT_PUBLIC_DOJAH_SANDBOX_MODE === 'true'

    /**
     * Check current KYC status for user
     */
    async getKYCStatus(userId: string): Promise<KYCStatus> {
        try {
            const response = await fetch(`${this.baseUrl}/status?userId=${userId}`)
            const data = await response.json()
            return data.status || 'unverified'
        } catch (error) {
            console.error('Error fetching KYC status:', error)
            return 'unverified'
        }
    }

    /**
     * Initiate KYC verification process
     */
    async initiateVerification(userId: string): Promise<{ verificationId: string }> {
        const response = await fetch(`${this.baseUrl}/initiate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        })

        if (!response.ok) {
            throw new Error('Failed to initiate KYC verification')
        }

        return response.json()
    }

    /**
     * Verify Bank Verification Number (BVN)
     * For sandbox, use: 22222222222
     */
    async verifyBVN(bvn: string, userId: string): Promise<KYCResult> {
        try {
            const response = await fetch(`${this.baseUrl}/verify-bvn`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bvn, userId }),
            })

            const data = await response.json()

            if (!response.ok) {
                return {
                    status: 'failed',
                    verificationId: '',
                    message: data.message || 'BVN verification failed',
                }
            }

            return {
                status: data.verified ? 'verified' : 'failed',
                verificationId: data.verificationId,
                message: data.message,
                data: data.userData,
            }
        } catch (error) {
            console.error('BVN verification error:', error)
            return {
                status: 'failed',
                verificationId: '',
                message: 'An error occurred during verification',
            }
        }
    }

    /**
     * Verify National Identification Number (NIN)
     * For sandbox, use: 12345678901
     */
    async verifyNIN(nin: string, userId: string): Promise<KYCResult> {
        try {
            const response = await fetch(`${this.baseUrl}/verify-nin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nin, userId }),
            })

            const data = await response.json()

            if (!response.ok) {
                return {
                    status: 'failed',
                    verificationId: '',
                    message: data.message || 'NIN verification failed',
                }
            }

            return {
                status: data.verified ? 'verified' : 'failed',
                verificationId: data.verificationId,
                message: data.message,
                data: data.userData,
            }
        } catch (error) {
            console.error('NIN verification error:', error)
            return {
                status: 'failed',
                verificationId: '',
                message: 'An error occurred during verification',
            }
        }
    }

    /**
     * Verify bank account details
     */
    async verifyBankAccount(
        accountNumber: string,
        bankCode: string
    ): Promise<{ accountName: string; verified: boolean }> {
        try {
            const response = await fetch(`${this.baseUrl}/verify-bank`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountNumber, bankCode }),
            })

            const data = await response.json()

            return {
                accountName: data.accountName || '',
                verified: data.verified || false,
            }
        } catch (error) {
            console.error('Bank verification error:', error)
            return {
                accountName: '',
                verified: false,
            }
        }
    }

    /**
     * Get list of Nigerian banks
     */
    async getNigerianBanks(): Promise<Array<{ name: string; code: string }>> {
        try {
            const response = await fetch(`${this.baseUrl}/banks`)
            const data = await response.json()
            return data.banks || []
        } catch (error) {
            console.error('Error fetching banks:', error)
            return []
        }
    }
}

export const kycService = new KYCService()

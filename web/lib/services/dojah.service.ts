/**
 * Dojah KYC Service - Nigerian BVN/NIN Verification
 * https://docs.dojah.io/
 */

export interface DojahConfig {
    publicKey: string
    appId: string
    secretKey?: string
}

export interface BVNVerificationRequest {
    bvn: string
    firstName?: string
    lastName?: string
    dateOfBirth?: string
}

export interface NINVerificationRequest {
    nin: string
}

export interface VerificationResult {
    success: boolean
    verified: boolean
    data?: {
        firstName?: string
        lastName?: string
        middleName?: string
        dateOfBirth?: string
        phoneNumber?: string
        gender?: string
        photo?: string
    }
    message?: string
    error?: string
}

export interface DojahWidgetConfig {
    type: 'custom' | 'liveness' | 'identification'
    app_id: string
    public_key: string
    user_data?: {
        user_id?: string
        email?: string
    }
    config?: {
        widget_id?: string
        debug?: boolean
        pages?: Array<{
            page: 'government-data' | 'selfie' | 'id'
            config: {
                bvn?: boolean
                nin?: boolean
                dl?: boolean
                vnin?: boolean
            }
        }>
    }
    onSuccess?: (response: any) => void
    onClose?: () => void
    onError?: (error: any) => void
}

class DojahService {
    private publicKey: string
    private appId: string
    private secretKey: string
    private baseUrl = 'https://api.dojah.io'

    constructor() {
        this.publicKey = process.env.NEXT_PUBLIC_DOJAH_PUBLIC_KEY || ''
        this.appId = process.env.NEXT_PUBLIC_DOJAH_APP_ID || ''
        this.secretKey = process.env.DOJAH_SECRET_KEY || ''
    }

    /**
     * Get widget configuration for Dojah React SDK
     */
    getWidgetConfig(userId?: string, email?: string): DojahWidgetConfig {
        return {
            type: 'custom',
            app_id: this.appId,
            public_key: this.publicKey,
            user_data: {
                user_id: userId,
                email: email
            },
            config: {
                debug: process.env.NODE_ENV === 'development',
                pages: [
                    {
                        page: 'government-data',
                        config: {
                            bvn: true,
                            nin: true,
                            vnin: true
                        }
                    }
                ]
            }
        }
    }

    /**
     * Verify BVN (Bank Verification Number)
     * Note: This should be called from a backend API route for security
     */
    async verifyBVN(request: BVNVerificationRequest): Promise<VerificationResult> {
        try {
            const response = await fetch('/api/kyc/verify-bvn', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request)
            })

            if (!response.ok) {
                throw new Error('BVN verification failed')
            }

            return response.json()
        } catch (error) {
            console.error('BVN verification error:', error)
            return {
                success: false,
                verified: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        }
    }

    /**
     * Verify NIN (National Identification Number)
     * Note: This should be called from a backend API route for security
     */
    async verifyNIN(request: NINVerificationRequest): Promise<VerificationResult> {
        try {
            const response = await fetch('/api/kyc/verify-nin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request)
            })

            if (!response.ok) {
                throw new Error('NIN verification failed')
            }

            return response.json()
        } catch (error) {
            console.error('NIN verification error:', error)
            return {
                success: false,
                verified: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        }
    }

    /**
     * Handle widget success callback
     */
    handleWidgetSuccess(response: any): VerificationResult {
        console.log('Dojah widget success:', response)

        return {
            success: true,
            verified: response?.verification?.verified || false,
            data: {
                firstName: response?.data?.first_name,
                lastName: response?.data?.last_name,
                middleName: response?.data?.middle_name,
                dateOfBirth: response?.data?.date_of_birth,
                phoneNumber: response?.data?.phone_number,
                gender: response?.data?.gender,
                photo: response?.data?.photo
            }
        }
    }

    /**
     * Check if Dojah is configured
     */
    isConfigured(): boolean {
        return Boolean(this.publicKey && this.appId)
    }
}

export const dojahService = new DojahService()

import { useState, useEffect } from 'react'
import { dojahService, VerificationResult } from '@/lib/services/dojah.service'
import { usePrivy } from '@privy-io/react-auth'

export type KYCStatus = 'unverified' | 'pending' | 'verified' | 'failed'

interface KYCState {
    bvnVerified: boolean
    ninVerified: boolean
    status: KYCStatus
}

export function useKYC() {
    const { user } = usePrivy()
    const [kycStatus, setKycStatus] = useState<KYCState>({
        bvnVerified: false,
        ninVerified: false,
        status: 'unverified'
    })
    const [loading, setLoading] = useState(true)
    const [verifying, setVerifying] = useState(false)

    useEffect(() => {
        if (user?.id) {
            checkStatus()
        } else {
            setLoading(false)
        }
    }, [user?.id])

    const checkStatus = async () => {
        // In a real app, we would fetch the user's KYC status from our backend
        // For now, we'll simulate it or check local storage
        setLoading(false)
    }

    const verifyBVN = async (bvn: string) => {
        if (!user?.id) throw new Error('User not authenticated')

        setVerifying(true)
        try {
            const result = await dojahService.verifyBVN({ bvn })
            if (result.verified) {
                setKycStatus(prev => ({ ...prev, bvnVerified: true }))
            }
            return result
        } catch (error) {
            console.error('BVN verification failed:', error)
            throw error
        } finally {
            setVerifying(false)
        }
    }

    const verifyNIN = async (nin: string) => {
        if (!user?.id) throw new Error('User not authenticated')

        setVerifying(true)
        try {
            const result = await dojahService.verifyNIN({ nin })
            if (result.verified) {
                setKycStatus(prev => ({ ...prev, ninVerified: true }))
            }
            return result
        } catch (error) {
            console.error('NIN verification failed:', error)
            throw error
        } finally {
            setVerifying(false)
        }
    }

    const getDojahConfig = () => {
        return dojahService.getWidgetConfig(user?.id, user?.email?.address)
    }

    const handleDojahSuccess = (response: any) => {
        const result = dojahService.handleWidgetSuccess(response)
        if (result.verified) {
            setKycStatus({
                bvnVerified: true,
                ninVerified: true,
                status: 'verified'
            })
        }
    }

    return {
        kycStatus,
        setKycStatus, // Exposed for widget callback
        loading,
        verifying,
        verifyBVN,
        verifyNIN,
        getDojahConfig,
        handleDojahSuccess,
        isVerified: kycStatus.bvnVerified && kycStatus.ninVerified,
        needsVerification: !kycStatus.bvnVerified || !kycStatus.ninVerified,
    }
}

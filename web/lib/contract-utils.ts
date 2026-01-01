/**
 * Contract Utilities for Meluriprop
 * Helper functions for blockchain interactions
 */

import { formatUnits, parseUnits } from 'viem'

/**
 * Standard token decimals
 */
export const TOKEN_DECIMALS = {
    USDC: 6,
    RET: 18, // Real Estate Token
} as const

/**
 * Check if a transaction hash is valid
 */
export function isValidTxHash(hash: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(hash)
}

/**
 * Check if an address is valid
 */
export function isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Get explorer URL for transaction
 */
export function getExplorerTxUrl(txHash: string, chainId: number = 5042002): string {
    const explorers: Record<number, string> = {
        5042002: 'https://explorer.testnet.arc.network', // Arc Testnet
    }

    const baseUrl = explorers[chainId] || explorers[5042002]
    return `${baseUrl}/tx/${txHash}`
}

/**
 * Get explorer URL for address
 */
export function getExplorerAddressUrl(address: string, chainId: number = 5042002): string {
    const explorers: Record<number, string> = {
        5042002: 'https://explorer.testnet.arc.network', // Arc Testnet
    }

    const baseUrl = explorers[chainId] || explorers[5042002]
    return `${baseUrl}/address/${address}`
}

/**
 * Format USDC amount (6 decimals)
 */
export function formatUSDC(amount: bigint): string {
    return formatUnits(amount, TOKEN_DECIMALS.USDC)
}

/**
 * Parse USDC amount (6 decimals)
 */
export function parseUSDC(amount: string): bigint {
    return parseUnits(amount, TOKEN_DECIMALS.USDC)
}

/**
 * Format Real Estate Token amount (18 decimals)
 */
export function formatRET(amount: bigint): string {
    return formatUnits(amount, TOKEN_DECIMALS.RET)
}

/**
 * Parse Real Estate Token amount (18 decimals)
 */
export function parseRET(amount: string): bigint {
    return parseUnits(amount, TOKEN_DECIMALS.RET)
}

/**
 * Wait for transaction confirmation with timeout
 */
export async function waitForTransaction(
    publicClient: any,
    txHash: `0x${string}`,
    timeoutMs: number = 60000
): Promise<any> {
    return Promise.race([
        publicClient.waitForTransactionReceipt({ hash: txHash }),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Transaction confirmation timeout')), timeoutMs)
        ),
    ])
}

/**
 * Handle contract error and return user-friendly message
 */
export function handleContractError(error: any): string {
    console.error('Contract error:', error)

    // Common error patterns
    if (error.message.includes('user rejected')) {
        return 'Transaction was rejected'
    }

    if (error.message.includes('insufficient funds')) {
        return 'Insufficient funds for transaction'
    }

    if (error.message.includes('execution reverted')) {
        // Try to extract revert reason
        const match = error.message.match(/execution reverted: (.+)/)
        if (match) {
            return `Transaction failed: ${match[1]}`
        }
        return 'Transaction failed - contract rejected the operation'
    }

    if (error.message.includes('gas required exceeds')) {
        return 'Transaction would fail - please check the parameters'
    }

    return 'An unexpected error occurred. Please try again.'
}

/**
 * Calculate price impact for a purchase
 */
export function calculatePriceImpact(
    amountToBuy: bigint,
    totalAvailable: bigint
): number {
    if (totalAvailable === 0n) return 0

    const percentage = Number(amountToBuy * 10000n / totalAvailable) / 100
    return Math.min(percentage, 100)
}

/**
 * Estimate transaction time based on gas price
 */
export function estimateTxTime(gasPrice?: bigint): string {
    // On Arc testnet, transactions are typically fast
    return '~15 seconds'
}

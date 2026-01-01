/**
 * Format Utilities for Meluriprop
 * Number, currency, date, and address formatting helpers
 */

/**
 * Format a number as currency with comma separators
 */
export function formatCurrency(amount: number | string, currency: string = 'USDC', decimals: number = 2): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount

    if (isNaN(num)) return '0 ' + currency

    return `${num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    })} ${currency}`
}

/**
 * Format a percentage
 */
export function formatPercentage(value: number | string, decimals: number = 1): string {
    const num = typeof value === 'string' ? parseFloat(value) : value

    if (isNaN(num)) return '0%'

    return `${num.toFixed(decimals)}%`
}

/**
 * Format a large number with K, M, B suffixes
 */
export function formatCompactNumber(value: number): string {
    if (value >= 1_000_000_000) {
        return `${(value / 1_000_000_000).toFixed(1)}B`
    }
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M`
    }
    if (value >= 1_000) {
        return `${(value / 1_000).toFixed(1)}K`
    }
    return value.toString()
}

/**
 * Truncate Ethereum address for display
 */
export function truncateAddress(address: string, startChars: number = 6, endChars: number = 4): string {
    if (!address) return ''
    if (address.length <= startChars + endChars) return address

    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}

/**
 * Format a date in a readable format
 */
export function formatDate(date: Date | string | number, format: 'short' | 'long' = 'short'): string {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date

    if (isNaN(d.getTime())) return 'Invalid Date'

    if (format === 'short') {
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    })
}

/**
 * Format time remaining until a deadline
 */
export function formatTimeRemaining(endTime: Date | string | number): string {
    const end = typeof endTime === 'string' || typeof endTime === 'number' ? new Date(endTime) : endTime
    const now = new Date()
    const remaining = end.getTime() - now.getTime()

    if (remaining <= 0) return 'Ended'

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) {
        return `${days}d ${hours}h remaining`
    }

    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m remaining`
}

/**
 * Convert Wei to token amount (handles both 18 and 6 decimal tokens)
 */
export function formatTokenAmount(amount: bigint | string, decimals: number = 18): string {
    const amountBigInt = typeof amount === 'string' ? BigInt(amount) : amount
    const divisor = BigInt(10 ** decimals)
    const integerPart = amountBigInt / divisor
    const fractionalPart = amountBigInt % divisor

    // Convert fractional part to decimal string
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0')

    // Trim trailing zeros
    const trimmedFractional = fractionalStr.replace(/0+$/, '')

    if (trimmedFractional === '') {
        return integerPart.toString()
    }

    return `${integerPart}.${trimmedFractional}`
}

/**
 * Parse token amount to Wei (handles both 18 and 6 decimal tokens)
 */
export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
    const [integerPart, fractionalPart = '0'] = amount.split('.')
    const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals)
    const fullAmount = integerPart + paddedFractional
    return BigInt(fullAmount)
}

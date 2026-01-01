"use client"

import React, { createContext, useContext, useState } from "react"

interface UIContextType {
    isProfileModalOpen: boolean
    openProfileModal: () => void
    closeProfileModal: () => void
}

const UIContext = createContext<UIContextType | undefined>(undefined)

export function UIProvider({ children }: { children: React.ReactNode }) {
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

    const openProfileModal = () => setIsProfileModalOpen(true)
    const closeProfileModal = () => setIsProfileModalOpen(false)

    return (
        <UIContext.Provider value={{ isProfileModalOpen, openProfileModal, closeProfileModal }}>
            {children}
        </UIContext.Provider>
    )
}

export function useUI() {
    const context = useContext(UIContext)
    if (context === undefined) {
        throw new Error("useUI must be used within a UIProvider")
    }
    return context
}

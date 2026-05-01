"use client"

import React, { createContext, useContext, ReactNode } from 'react'

export interface User {
    id?: string
    name: string
    email: string
    image?: string
    role: string
    userType?: string
}

const UserContext = createContext<User | null>(null)

export function UserProvider({ children, user }: { children: ReactNode, user: User | null }) {
    return (
        <UserContext.Provider value={user}>
            {children}
        </UserContext.Provider>
    )
}

export function useUser() {
    return useContext(UserContext)
}

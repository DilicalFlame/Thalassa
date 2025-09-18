// Shared TypeScript types for Thalassa project

// Ocean data types
export interface OceanDataPoint {
    id: string
    latitude: number
    longitude: number
    depth?: number
    temperature?: number
    salinity?: number
    timestamp: string
}

// API response types
export interface ApiResponse<T = any> {
    data: T
    message?: string
    status: 'success' | 'error'
}

// Re-export generated API types
// export * from './api/index.js'

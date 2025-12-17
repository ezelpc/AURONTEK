/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string
    readonly VITE_CLOUDINARY_CLOUD_NAME: string
    readonly VITE_AURONTEK_ADMIN_PASSWORD: string
    // Add more env variables as needed
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

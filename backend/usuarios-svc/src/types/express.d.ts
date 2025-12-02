declare global {
    namespace Express {
        interface Request {
            usuario?: any;
            imageUrl?: string;
            isServiceCall?: boolean;
            serviceName?: string;
        }
    }
}

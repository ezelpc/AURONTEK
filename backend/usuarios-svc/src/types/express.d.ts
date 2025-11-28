import { Request } from 'express';
import { Request } from 'express';

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

import { generarCodigoAcceso } from '../../src/Utils/utils';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Utils - Unit Tests', () => {
    describe('generarCodigoAcceso', () => {
        it('should generate a code with default length of 8', () => {
            const codigo = generarCodigoAcceso();
            expect(codigo).toHaveLength(8);
        });

        it('should generate a code with custom length', () => {
            const length = 12;
            const codigo = generarCodigoAcceso(length);
            expect(codigo).toHaveLength(length);
        });

        it('should generate alphanumeric code only', () => {
            const codigo = generarCodigoAcceso(100);
            const alphanumericRegex = /^[A-Za-z0-9]+$/;
            expect(codigo).toMatch(alphanumericRegex);
        });

        it('should generate unique codes', () => {
            const codigo1 = generarCodigoAcceso();
            const codigo2 = generarCodigoAcceso();
            // While theoretically they could be the same, probability is extremely low
            expect(codigo1).not.toBe(codigo2);
        });

        it('should handle edge case of length 1', () => {
            const codigo = generarCodigoAcceso(1);
            expect(codigo).toHaveLength(1);
        });
    });

    describe('Password Hashing (bcrypt)', () => {
        const testPassword = 'TestPassword123!';

        it('should hash password successfully', async () => {
            const hashedPassword = await bcrypt.hash(testPassword, 10);
            expect(hashedPassword).toBeDefined();
            expect(hashedPassword).not.toBe(testPassword);
            expect(hashedPassword.length).toBeGreaterThan(20);
        });

        it('should verify correct password', async () => {
            const hashedPassword = await bcrypt.hash(testPassword, 10);
            const isValid = await bcrypt.compare(testPassword, hashedPassword);
            expect(isValid).toBe(true);
        });

        it('should reject incorrect password', async () => {
            const hashedPassword = await bcrypt.hash(testPassword, 10);
            const isValid = await bcrypt.compare('WrongPassword', hashedPassword);
            expect(isValid).toBe(false);
        });

        it('should generate different hashes for same password', async () => {
            const hash1 = await bcrypt.hash(testPassword, 10);
            const hash2 = await bcrypt.hash(testPassword, 10);
            // Bcrypt includes salt, so hashes should be different
            expect(hash1).not.toBe(hash2);
            // But both should validate the same password
            expect(await bcrypt.compare(testPassword, hash1)).toBe(true);
            expect(await bcrypt.compare(testPassword, hash2)).toBe(true);
        });
    });

    describe('JWT Token Generation and Validation', () => {
        const secret = process.env.JWT_SECRET || 'test-secret';
        const testPayload = {
            userId: '123456',
            email: 'test@example.com',
            role: 'usuario'
        };

        it('should generate JWT token', () => {
            const token = jwt.sign(testPayload, secret, { expiresIn: '1h' });
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
        });

        it('should verify valid JWT token', () => {
            const token = jwt.sign(testPayload, secret, { expiresIn: '1h' });
            const decoded = jwt.verify(token, secret) as any;

            expect(decoded.userId).toBe(testPayload.userId);
            expect(decoded.email).toBe(testPayload.email);
            expect(decoded.role).toBe(testPayload.role);
        });

        it('should reject invalid JWT token', () => {
            const invalidToken = 'invalid.token.here';
            expect(() => {
                jwt.verify(invalidToken, secret);
            }).toThrow();
        });

        it('should reject token with wrong secret', () => {
            const token = jwt.sign(testPayload, secret, { expiresIn: '1h' });
            expect(() => {
                jwt.verify(token, 'wrong-secret');
            }).toThrow();
        });

        it('should include expiration in token', () => {
            const token = jwt.sign(testPayload, secret, { expiresIn: '1h' });
            const decoded = jwt.verify(token, secret) as any;

            expect(decoded.exp).toBeDefined();
            expect(decoded.iat).toBeDefined();
            expect(decoded.exp).toBeGreaterThan(decoded.iat);
        });
    });
});

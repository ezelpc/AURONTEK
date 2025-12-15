import bcrypt from 'bcrypt';

/**
 * Encripta una contraseña usando bcrypt.
 * @param password Contraseña en texto plano
 * @returns Hash de la contraseña
 */
export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

/**
 * Compara una contraseña en texto plano con un hash.
 * @param password Contraseña en texto plano
 * @param hash Hash almacenado
 * @returns true si coinciden, false si no
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
};

// ==========================================
// CLI EXECUTION: npx ts-node src/Utils/hash.utils.ts <password>
// ==========================================
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length > 0) {
        const passwordToHash = args[0];
        console.log(`🔒 Hashing: ${passwordToHash}`);
        hashPassword(passwordToHash).then(hash => {
            console.log(`🔑 Hash: ${hash}`);
            process.exit(0);
        }).catch(err => {
            console.error('❌ Error:', err);
            process.exit(1);
        });
    } else {
        // If no args, just ignore (imported as module)
        // or print usage if running explicitly with no args?
        // Let's print usage if direct run but no args.
        console.log('ℹ️  Uso: npx ts-node src/Utils/hash.utils.ts <contraseña>');
    }
}

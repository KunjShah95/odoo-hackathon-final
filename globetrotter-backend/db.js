import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve backend root regardless of current working directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Attempt to load .env from backend root
dotenv.config({ path: path.join(__dirname, '.env') });

const { Pool } = pkg;

const hasUrl = !!process.env.DATABASE_URL;

// Minimal sanity check to help diagnose "client password must be a string"
if (!hasUrl) {
    const required = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD'];
    const missing = required.filter(k => !process.env[k]);
    if (missing.length) {
        console.warn('[db] Missing env vars:', missing.join(', '), '\nEnsure you ran from backend root and created .env based on .env.example');
    }
    if (process.env.DB_PASSWORD && typeof process.env.DB_PASSWORD !== 'string') {
        console.warn('[db] DB_PASSWORD is not a string');
    }
}
const pool = hasUrl
    ? new Pool({
            connectionString: process.env.DATABASE_URL,
        })
    : new Pool({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
        });

export default pool;

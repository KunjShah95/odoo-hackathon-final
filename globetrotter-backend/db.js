import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

const hasUrl = !!process.env.DATABASE_URL;
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

import pg from "pg";
import env from "../config/env.js";
import logger from "../config/logger.js";

const {Pool} = pg;

const pool = new Pool({
    connectionString: env.databaseUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// pool.on("connect", () => {
//     logger.info("PostgreSQL connected");
// });

pool.on("connect", () => {
  logger.debug("New PostgreSQL pool client created");
});

pool.on("error", (err) => {
    logger.error({ err }, "Unexpected PostgreSQL error")
});

export async function connectDB() {
    try{
        const client = await pool.connect();
        client.release();
        logger.info("Database connection established");
    }catch(error){
        logger.fatal({error}, "Database connection failed");
        process.exit(1);
    }
}

export async function disconnectDB() {
  await pool.end();
  logger.info("Database pool closed");
}

export default pool;
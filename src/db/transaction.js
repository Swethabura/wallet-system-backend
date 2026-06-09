// import pool from "./db.js";

// const withTransaction = async (callback) => {
//   const client = await pool.connect();

//   try {
//     await client.query("BEGIN");

//     const result = await callback(client);

//     await client.query("COMMIT");

//     return result;
//   } catch (error) {
//     try {
//       await client.query("ROLLBACK");
//     } catch (error) {
//       await client.query("ROLLBACK");
//       logger.error({ err: error }, "Transaction rolled back");
//       throw error;
//     }

//     throw error;  //If rollback fails, you still want original error preserved.
//   } finally {
//     client.release();
//   }
// };

// export default withTransaction;


import logger from "../config/logger.js";
import pool from "./db.js";

const RETRYABLE_ERRORS = ["40001", "40P01"];  //Serialization failure and Deadlock detected

const withTransaction = async (
    callback, retries = 3, 
) => {
    const client = await pool.connect();

    try{
        await client.query("BEGIN");

        const result = await callback(client);

        await client.query("COMMIT");

        return result;
    }catch(error){
        await client.query("ROLLBACK");

        if(retries > 0 && RETRYABLE_ERRORS.includes(error.code)){
            logger.warn({
                code: error.code,
                retriesLeft: retries - 1,
            }, "Retrying transaction");

            return withTransaction(callback, retries - 1);
        }

        throw error;
    }finally{
        client.release();
    }
}

export default withTransaction;
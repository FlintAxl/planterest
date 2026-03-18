import * as SQLite from 'expo-sqlite';

const DB_NAME = 'planterest.db';
const GUEST_USER_ID = 'guest';

let dbPromise;

const getDb = async () => {
    if (!dbPromise) {
        dbPromise = SQLite.openDatabaseAsync(DB_NAME);
    }

    return dbPromise;
};

export const initializeCartDatabase = async () => {
    const db = await getDb();

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS cart_state_by_user (
            user_id TEXT PRIMARY KEY NOT NULL,
            data TEXT NOT NULL
        );
    `);
};

export const loadCartFromSQLite = async (userId = GUEST_USER_ID) => {
    await initializeCartDatabase();
    const db = await getDb();

    const row = await db.getFirstAsync(
        'SELECT data FROM cart_state_by_user WHERE user_id = ?;',
        [userId]
    );

    if (!row?.data) {
        return [];
    }

    try {
        const parsed = JSON.parse(row.data);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.log('Failed to parse cart data from SQLite:', error);
        return [];
    }
};

export const saveCartToSQLite = async (cartItems = [], userId = GUEST_USER_ID) => {
    await initializeCartDatabase();
    const db = await getDb();

    const payload = JSON.stringify(Array.isArray(cartItems) ? cartItems : []);

    await db.runAsync(
        'INSERT OR REPLACE INTO cart_state_by_user (user_id, data) VALUES (?, ?);',
        [userId, payload]
    );
};

export const clearCartInSQLite = async (userId = GUEST_USER_ID) => {
    await initializeCartDatabase();
    const db = await getDb();

    await db.runAsync('DELETE FROM cart_state_by_user WHERE user_id = ?;', [userId]);
};

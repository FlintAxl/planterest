import {
    ADD_TO_CART,
    REMOVE_FROM_CART,
    CLEAR_CART,
    SET_CART_ITEMS,
    UPDATE_QUANTITY
} from '../constants';

import {
    clearCartInSQLite,
    loadCartFromSQLite,
    saveCartToSQLite
} from '../../assets/common/cart-sqlite';

export const loadCartFromDatabase = (userId = 'guest') => async (dispatch) => {
    try {
        const items = await loadCartFromSQLite(userId);

        dispatch({
            type: SET_CART_ITEMS,
            payload: items
        });
    } catch (error) {
        console.log('Failed to load cart from SQLite:', error);
    }
};

export const addToCart = (payload, userId = 'guest') => {
    return async (dispatch, getState) => {
        dispatch({
            type: ADD_TO_CART,
            payload
        });

        try {
            await saveCartToSQLite(getState().cartItems, userId);
        } catch (error) {
            console.log('Failed to save cart to SQLite:', error);
        }
    }
}

export const removeFromCart = (payload, userId = 'guest') => {
    return async (dispatch, getState) => {
        dispatch({
            type: REMOVE_FROM_CART,
            payload
        });

        try {
            await saveCartToSQLite(getState().cartItems, userId);
        } catch (error) {
            console.log('Failed to save cart after remove:', error);
        }
    }
}

export const clearCart = (userId = 'guest') => {
    return async (dispatch) => {
        dispatch({
            type: CLEAR_CART
        });

        try {
            await clearCartInSQLite(userId);
        } catch (error) {
            console.log('Failed to clear cart in SQLite:', error);
        }
    }
}

export const updateQuantity = (productId, newQuantity, userId = 'guest') => {
    return async (dispatch, getState) => {
        dispatch({
            type: UPDATE_QUANTITY,
            payload: {
                productId,
                newQuantity
            }
        });

        try {
            await saveCartToSQLite(getState().cartItems, userId);
        } catch (error) {
            console.log('Failed to update quantity in SQLite:', error);
        }
    }
}
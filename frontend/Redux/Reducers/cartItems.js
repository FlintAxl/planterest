import {
    ADD_TO_CART,
    REMOVE_FROM_CART,
    CLEAR_CART,
    SET_CART_ITEMS,
    UPDATE_QUANTITY
} from '../constants';

const cartItems = (state = [], action) => {
    switch (action.type) {
        case ADD_TO_CART:
            // Check if product already exists in cart
            const existingItem = state.find(item => 
                (item._id === action.payload._id) || (item.id === action.payload.id)
            );
            
            if (existingItem) {
                // If product exists, increment quantity
                return state.map(item =>
                    (item._id === action.payload._id || item.id === action.payload.id)
                        ? { ...item, quantity: (item.quantity || 1) + (action.payload.quantity || 1) }
                        : item
                );
            } else {
                // If product doesn't exist, add it
                return [...state, action.payload];
            }
        case REMOVE_FROM_CART:
            return state.filter(cartItem => cartItem !== action.payload)
        case CLEAR_CART:
            return state = []
        case SET_CART_ITEMS:
            return Array.isArray(action.payload) ? action.payload : []
        case UPDATE_QUANTITY:
            return state.map(item => {
                if ((item._id === action.payload.productId) || (item.id === action.payload.productId)) {
                    return { ...item, quantity: Math.max(1, action.payload.newQuantity) };
                }
                return item;
            })
    }
    return state;
}

export default cartItems;
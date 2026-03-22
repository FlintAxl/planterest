import {
    ADD_TO_CART,
    REMOVE_FROM_CART,
    CLEAR_CART,
    SET_CART_ITEMS,
    UPDATE_QUANTITY
} from '../constants';

const getMaxStock = (item = {}) => {
    const maxStock = Number(item.countInStock);
    return Number.isFinite(maxStock) && maxStock >= 0 ? maxStock : Number.MAX_SAFE_INTEGER;
};

const clampQuantityByStock = (quantity, item = {}) => {
    const minQuantity = 1;
    const maxStock = getMaxStock(item);
    return Math.max(minQuantity, Math.min(quantity, maxStock));
};

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
                        ? {
                            ...item,
                            countInStock: action.payload.countInStock ?? item.countInStock,
                            quantity: clampQuantityByStock(
                                (item.quantity || 1) + (action.payload.quantity || 1),
                                { ...item, ...action.payload }
                            )
                        }
                        : item
                );
            } else {
                // If product doesn't exist, add it
                if (getMaxStock(action.payload) <= 0) {
                    return state;
                }

                return [
                    ...state,
                    {
                        ...action.payload,
                        quantity: clampQuantityByStock(action.payload.quantity || 1, action.payload),
                    }
                ];
            }
        case REMOVE_FROM_CART:
            return state.filter(cartItem => cartItem !== action.payload)
        case CLEAR_CART:
            return state = []
        case SET_CART_ITEMS:
            return Array.isArray(action.payload)
                ? action.payload
                    .filter((item) => getMaxStock(item) > 0)
                    .map((item) => ({
                        ...item,
                        quantity: clampQuantityByStock(item.quantity || 1, item),
                    }))
                : []
        case UPDATE_QUANTITY:
            return state.map(item => {
                if ((item._id === action.payload.productId) || (item.id === action.payload.productId)) {
                    return {
                        ...item,
                        quantity: clampQuantityByStock(action.payload.newQuantity, item),
                    };
                }
                return item;
            })
    }
    return state;
}

export default cartItems;
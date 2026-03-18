import {
    FETCH_PRODUCTS_REQUEST,
    FETCH_PRODUCTS_SUCCESS,
    FETCH_PRODUCTS_FAIL,
    FETCH_PRODUCT_BY_ID_REQUEST,
    FETCH_PRODUCT_BY_ID_SUCCESS,
    FETCH_PRODUCT_BY_ID_FAIL,
    APPLY_PRODUCT_DISCOUNT,
    REMOVE_PRODUCT_DISCOUNT,
} from '../constants';

const initialState = {
    products: [],
    selectedProduct: null,
    loading: false,
    error: null,
    discounts: []
};

const products = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_PRODUCTS_REQUEST:
            return {
                ...state,
                loading: true,
                error: null
            };
        case FETCH_PRODUCTS_SUCCESS:
            return {
                ...state,
                products: action.payload,
                loading: false,
                error: null
            };
        case FETCH_PRODUCTS_FAIL:
            return {
                ...state,
                loading: false,
                error: action.payload,
                products: []
            };
        
        case FETCH_PRODUCT_BY_ID_REQUEST:
            return {
                ...state,
                loading: true,
                error: null
            };
        case FETCH_PRODUCT_BY_ID_SUCCESS:
            return {
                ...state,
                selectedProduct: action.payload,
                loading: false,
                error: null
            };
        case FETCH_PRODUCT_BY_ID_FAIL:
            return {
                ...state,
                loading: false,
                error: action.payload,
                selectedProduct: null
            };
        
        case APPLY_PRODUCT_DISCOUNT:
            return {
                ...state,
                discounts: [...state.discounts, action.payload]
            };
        
        case REMOVE_PRODUCT_DISCOUNT:
            return {
                ...state,
                discounts: state.discounts.filter(
                    discount => !action.payload.productIds.includes(discount.productId)
                )
            };
        
        default:
            return state;
    }
};

export default products;

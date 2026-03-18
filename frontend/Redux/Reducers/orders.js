import {
    FETCH_ORDERS_REQUEST,
    FETCH_ORDERS_SUCCESS,
    FETCH_ORDERS_FAIL,
    FETCH_ORDER_BY_ID_REQUEST,
    FETCH_ORDER_BY_ID_SUCCESS,
    FETCH_ORDER_BY_ID_FAIL,
    CREATE_ORDER_REQUEST,
    CREATE_ORDER_SUCCESS,
    CREATE_ORDER_FAIL,
    UPDATE_ORDER_STATUS,
    CANCEL_ORDER,
    FETCH_USER_ORDERS,
} from '../constants';

const initialState = {
    orders: [],
    userOrders: [],
    selectedOrder: null,
    loading: false,
    error: null,
    lastCreatedOrder: null
};

const orders = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_ORDERS_REQUEST:
            return {
                ...state,
                loading: true,
                error: null
            };
        case FETCH_ORDERS_SUCCESS:
            return {
                ...state,
                orders: action.payload,
                loading: false,
                error: null
            };
        case FETCH_ORDERS_FAIL:
            return {
                ...state,
                loading: false,
                error: action.payload,
                orders: []
            };
        
        case FETCH_ORDER_BY_ID_REQUEST:
            return {
                ...state,
                loading: true,
                error: null
            };
        case FETCH_ORDER_BY_ID_SUCCESS:
            return {
                ...state,
                selectedOrder: action.payload,
                loading: false,
                error: null
            };
        case FETCH_ORDER_BY_ID_FAIL:
            return {
                ...state,
                loading: false,
                error: action.payload,
                selectedOrder: null
            };
        
        case CREATE_ORDER_REQUEST:
            return {
                ...state,
                loading: true,
                error: null
            };
        case CREATE_ORDER_SUCCESS:
            return {
                ...state,
                lastCreatedOrder: action.payload,
                orders: [...state.orders, action.payload],
                loading: false,
                error: null
            };
        case CREATE_ORDER_FAIL:
            return {
                ...state,
                loading: false,
                error: action.payload
            };
        
        case UPDATE_ORDER_STATUS:
            return {
                ...state,
                selectedOrder: action.payload,
                orders: state.orders.map(order =>
                    order._id === action.payload._id ? action.payload : order
                )
            };
        
        case CANCEL_ORDER:
            return {
                ...state,
                selectedOrder: action.payload,
                orders: state.orders.map(order =>
                    order._id === action.payload._id ? action.payload : order
                )
            };
        
        case FETCH_USER_ORDERS:
            return {
                ...state,
                userOrders: action.payload
            };
        
        default:
            return state;
    }
};

export default orders;

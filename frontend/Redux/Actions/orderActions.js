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

import baseURL from '../../assets/common/baseurl';

const ordersURL = baseURL + 'orders';

export const fetchOrders = () => async (dispatch) => {
    dispatch({ type: FETCH_ORDERS_REQUEST });
    try {
        const response = await fetch(ordersURL);
        const data = await response.json();
        
        if (response.ok) {
            dispatch({
                type: FETCH_ORDERS_SUCCESS,
                payload: data
            });
        } else {
            dispatch({
                type: FETCH_ORDERS_FAIL,
                payload: 'Failed to fetch orders'
            });
        }
    } catch (error) {
        dispatch({
            type: FETCH_ORDERS_FAIL,
            payload: error.message
        });
    }
};

export const fetchOrderById = (orderId) => async (dispatch) => {
    dispatch({ type: FETCH_ORDER_BY_ID_REQUEST });
    try {
        const response = await fetch(`${ordersURL}/${orderId}`);
        const data = await response.json();
        
        if (response.ok) {
            dispatch({
                type: FETCH_ORDER_BY_ID_SUCCESS,
                payload: data
            });
        } else {
            dispatch({
                type: FETCH_ORDER_BY_ID_FAIL,
                payload: 'Failed to fetch order'
            });
        }
    } catch (error) {
        dispatch({
            type: FETCH_ORDER_BY_ID_FAIL,
            payload: error.message
        });
    }
};

export const createOrder = (orderData) => async (dispatch) => {
    dispatch({ type: CREATE_ORDER_REQUEST });
    try {
        const response = await fetch(ordersURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        const data = await response.json();
        
        if (response.ok) {
            dispatch({
                type: CREATE_ORDER_SUCCESS,
                payload: data
            });
            return { success: true, order: data };
        } else {
            dispatch({
                type: CREATE_ORDER_FAIL,
                payload: data.message || 'Failed to create order'
            });
            return { success: false, error: data.message };
        }
    } catch (error) {
        dispatch({
            type: CREATE_ORDER_FAIL,
            payload: error.message
        });
        return { success: false, error: error.message };
    }
};

export const updateOrderStatus = (orderId, status) => async (dispatch) => {
    try {
        const response = await fetch(`${ordersURL}/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        const data = await response.json();
        
        if (response.ok) {
            dispatch({
                type: UPDATE_ORDER_STATUS,
                payload: data
            });
            return { success: true };
        }
    } catch (error) {
        console.log('Error updating order status:', error);
        return { success: false, error: error.message };
    }
};

export const cancelOrder = (orderId, cancelReason) => async (dispatch) => {
    try {
        const response = await fetch(`${ordersURL}/${orderId}/cancel`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cancelReason })
        });
        const data = await response.json();
        
        if (response.ok) {
            dispatch({
                type: CANCEL_ORDER,
                payload: data
            });
            return { success: true };
        }
    } catch (error) {
        console.log('Error cancelling order:', error);
        return { success: false, error: error.message };
    }
};

export const fetchUserOrders = (userId) => async (dispatch) => {
    try {
        const response = await fetch(`${ordersURL}/my-orders/${userId}`);
        const data = await response.json();
        
        if (response.ok) {
            dispatch({
                type: FETCH_USER_ORDERS,
                payload: data
            });
        }
    } catch (error) {
        console.log('Error fetching user orders:', error);
    }
};

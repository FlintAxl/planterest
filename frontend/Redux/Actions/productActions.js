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

import baseURL from '../../assets/common/baseurl';

const productsURL = baseURL + 'products';

export const fetchProducts = (categoryId = null) => async (dispatch) => {
    dispatch({ type: FETCH_PRODUCTS_REQUEST });
    try {
        const url = categoryId 
            ? `${productsURL}?categories=${categoryId}`
            : productsURL;
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok) {
            dispatch({
                type: FETCH_PRODUCTS_SUCCESS,
                payload: data
            });
        } else {
            dispatch({
                type: FETCH_PRODUCTS_FAIL,
                payload: 'Failed to fetch products'
            });
        }
    } catch (error) {
        dispatch({
            type: FETCH_PRODUCTS_FAIL,
            payload: error.message
        });
    }
};

export const fetchProductById = (productId) => async (dispatch) => {
    dispatch({ type: FETCH_PRODUCT_BY_ID_REQUEST });
    try {
        const response = await fetch(`${productsURL}/${productId}`);
        const data = await response.json();
        
        if (response.ok) {
            dispatch({
                type: FETCH_PRODUCT_BY_ID_SUCCESS,
                payload: data
            });
        } else {
            dispatch({
                type: FETCH_PRODUCT_BY_ID_FAIL,
                payload: 'Failed to fetch product'
            });
        }
    } catch (error) {
        dispatch({
            type: FETCH_PRODUCT_BY_ID_FAIL,
            payload: error.message
        });
    }
};

export const applyDiscount = (productIds, discountPercentage, discountDays) => async (dispatch) => {
    try {
        const response = await fetch(`${productsURL}/apply-discount`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productIds,
                discountPercentage,
                discountDays
            })
        });
        const data = await response.json();
        
        if (response.ok) {
            dispatch({
                type: APPLY_PRODUCT_DISCOUNT,
                payload: data
            });
        }
    } catch (error) {
        console.log('Error applying discount:', error);
    }
};

export const removeDiscount = (productIds) => async (dispatch) => {
    try {
        const response = await fetch(`${productsURL}/remove-discount`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productIds })
        });
        const data = await response.json();
        
        if (response.ok) {
            dispatch({
                type: REMOVE_PRODUCT_DISCOUNT,
                payload: data
            });
        }
    } catch (error) {
        console.log('Error removing discount:', error);
    }
};

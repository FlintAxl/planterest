import {
    FETCH_REVIEWS_REQUEST,
    FETCH_REVIEWS_SUCCESS,
    FETCH_REVIEWS_FAIL,
    CREATE_REVIEW_REQUEST,
    CREATE_REVIEW_SUCCESS,
    CREATE_REVIEW_FAIL,
    UPDATE_REVIEW_REQUEST,
    UPDATE_REVIEW_SUCCESS,
    UPDATE_REVIEW_FAIL,
    CHECK_REVIEW_ELIGIBILITY,
} from '../constants';

import baseURL from '../../assets/common/baseurl';

const reviewsURL = baseURL + 'reviews';

export const fetchReviewsByProduct = (productId) => async (dispatch) => {
    dispatch({ type: FETCH_REVIEWS_REQUEST });
    try {
        const response = await fetch(`${reviewsURL}/product/${productId}`);
        const data = await response.json();
        
        if (response.ok) {
            dispatch({
                type: FETCH_REVIEWS_SUCCESS,
                payload: data
            });
        } else {
            dispatch({
                type: FETCH_REVIEWS_FAIL,
                payload: 'Failed to fetch reviews'
            });
        }
    } catch (error) {
        dispatch({
            type: FETCH_REVIEWS_FAIL,
            payload: error.message
        });
    }
};

export const checkReviewEligibility = (productId, userId) => async (dispatch) => {
    try {
        const response = await fetch(`${reviewsURL}/check/${productId}/${userId}`);
        const data = await response.json();
        
        if (response.ok) {
            dispatch({
                type: CHECK_REVIEW_ELIGIBILITY,
                payload: data
            });
            return data;
        }
    } catch (error) {
        console.log('Error checking review eligibility:', error);
        return { canReview: false, hasReviewed: false };
    }
};

export const createReview = (reviewData) => async (dispatch) => {
    dispatch({ type: CREATE_REVIEW_REQUEST });
    try {
        const response = await fetch(reviewsURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewData)
        });
        const data = await response.json();
        
        if (response.ok) {
            dispatch({
                type: CREATE_REVIEW_SUCCESS,
                payload: data
            });
            return { success: true, review: data };
        } else {
            dispatch({
                type: CREATE_REVIEW_FAIL,
                payload: data.message || 'Failed to create review'
            });
            return { success: false, error: data.message || data };
        }
    } catch (error) {
        dispatch({
            type: CREATE_REVIEW_FAIL,
            payload: error.message
        });
        return { success: false, error: error.message };
    }
};

export const updateReview = (reviewId, reviewData) => async (dispatch) => {
    dispatch({ type: UPDATE_REVIEW_REQUEST });
    try {
        const response = await fetch(`${reviewsURL}/${reviewId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewData)
        });
        const data = await response.json();
        
        if (response.ok) {
            dispatch({
                type: UPDATE_REVIEW_SUCCESS,
                payload: data
            });
            return { success: true, review: data };
        } else {
            dispatch({
                type: UPDATE_REVIEW_FAIL,
                payload: data.message || 'Failed to update review'
            });
            return { success: false, error: data.message };
        }
    } catch (error) {
        dispatch({
            type: UPDATE_REVIEW_FAIL,
            payload: error.message
        });
        return { success: false, error: error.message };
    }
};

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

const initialState = {
    reviews: [],
    loading: false,
    error: null,
    reviewEligibility: {
        canReview: false,
        hasReviewed: false
    }
};

const reviews = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_REVIEWS_REQUEST:
            return {
                ...state,
                loading: true,
                error: null
            };
        case FETCH_REVIEWS_SUCCESS:
            return {
                ...state,
                reviews: action.payload,
                loading: false,
                error: null
            };
        case FETCH_REVIEWS_FAIL:
            return {
                ...state,
                loading: false,
                error: action.payload,
                reviews: []
            };
        
        case CREATE_REVIEW_REQUEST:
            return {
                ...state,
                loading: true,
                error: null
            };
        case CREATE_REVIEW_SUCCESS:
            return {
                ...state,
                reviews: [...state.reviews, action.payload],
                loading: false,
                error: null,
                reviewEligibility: {
                    canReview: false,
                    hasReviewed: true
                }
            };
        case CREATE_REVIEW_FAIL:
            return {
                ...state,
                loading: false,
                error: action.payload
            };
        
        case UPDATE_REVIEW_REQUEST:
            return {
                ...state,
                loading: true,
                error: null
            };
        case UPDATE_REVIEW_SUCCESS:
            return {
                ...state,
                reviews: state.reviews.map(review =>
                    review._id === action.payload._id ? action.payload : review
                ),
                loading: false,
                error: null
            };
        case UPDATE_REVIEW_FAIL:
            return {
                ...state,
                loading: false,
                error: action.payload
            };
        
        case CHECK_REVIEW_ELIGIBILITY:
            return {
                ...state,
                reviewEligibility: action.payload
            };
        
        default:
            return state;
    }
};

export default reviews;

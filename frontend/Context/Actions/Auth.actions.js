// import "core-js/stable/atob";
import { jwtDecode } from "jwt-decode"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Toast from "react-native-toast-message"
import baseURL from "../../assets/common/baseurl";

export const SET_CURRENT_USER = "SET_CURRENT_USER";

export const loginUser = (user, dispatch) => {

    fetch(`${baseURL}users/login`, {
        method: "POST",
        body: JSON.stringify(user),
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
    })
        .then((res) => {
            if (!res.ok) {
                throw new Error(`Login failed with status ${res.status}`);
            }
            return res.json();
        })
        .then((data) => {
            if (data && data.token) {
                // Store token first
                AsyncStorage.setItem("jwt", data.token)
                    .then(() => {
                        // Then decode and dispatch
                        const decoded = jwtDecode(data.token);
                        console.log("Login successful, token stored", decoded);
                        dispatch(setCurrentUser(decoded, user));
                    })
                    .catch((storageError) => {
                        console.log("Error storing token:", storageError);
                        Toast.show({
                            topOffset: 60,
                            type: "error",
                            text1: "Storage error",
                            text2: "Failed to save authentication token"
                        });
                        logoutUser(dispatch);
                    });
            } else {
                console.log("Invalid login response", data);
                Toast.show({
                    topOffset: 60,
                    type: "error",
                    text1: "Invalid response",
                    text2: "Please try again"
                });
                logoutUser(dispatch);
            }
        })
        .catch((err) => {
            console.log("Login error:", err);
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Please provide correct credentials",
                text2: ""
            });
            logoutUser(dispatch);
        });
};

export const getUserProfile = (id) => {
    fetch(`${baseURL}users/${id}`, {
        method: "GET",
        body: JSON.stringify(user),
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
        },
    })
        .then((res) => res.json())
        .then((data) => console.log(data));
}

export const logoutUser = (dispatch) => {
    AsyncStorage.removeItem("jwt");
    dispatch(setCurrentUser({}))
}

export const setCurrentUser = (decoded, user) => {
    return {
        type: SET_CURRENT_USER,
        payload: decoded,
        userProfile: user
    }
}
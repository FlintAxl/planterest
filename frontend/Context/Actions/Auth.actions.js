// import "core-js/stable/atob";
import { jwtDecode } from "jwt-decode"
import Toast from "react-native-toast-message"
import baseURL from "../../assets/common/baseurl";
import { GoogleAuthProvider, signInWithCredential, signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { getAuthToken, removeAuthToken, setAuthToken } from "../../assets/common/token-storage";
import { removePushTokenOnServer } from "../../assets/common/push-notifications";

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
                setAuthToken(data.token)
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

export const loginWithGoogle = async (idToken, dispatch) => {
    try {
        const googleCredential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, googleCredential);
        const firebaseUser = userCredential.user;

        const normalizedUser = {
            sub: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            picture: firebaseUser.photoURL,
            provider: "google",
        };

        dispatch(setCurrentUser(normalizedUser, {
            email: firebaseUser.email,
            name: firebaseUser.displayName,
        }));

        Toast.show({
            topOffset: 60,
            type: "success",
            text1: "Signed in with Google",
            text2: "Welcome back!",
        });
    } catch (err) {
        console.log("Google login error:", err);
        Toast.show({
            topOffset: 60,
            type: "error",
            text1: "Google sign-in failed",
            text2: "Please try again",
        });
        throw err;
    }
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
    getAuthToken()
        .then(async (token) => {
            if (token) {
                const decoded = jwtDecode(token);
                if (decoded?.userId) {
                    try {
                        await removePushTokenOnServer({ userId: decoded.userId, authToken: token });
                    } catch (error) {
                        console.log("Failed to remove push token on logout", error?.message || error);
                    }
                }
            }

            await removeAuthToken();
        })
        .finally(() => {
            signOut(auth).catch(() => {
                // Ignore sign-out errors when no Firebase session exists.
            });
            dispatch(setCurrentUser({}))
        });
}

export const setCurrentUser = (decoded, user) => {
    return {
        type: SET_CURRENT_USER,
        payload: decoded,
        userProfile: user
    }
}
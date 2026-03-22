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
    return fetch(`${baseURL}users/login`, {
        method: "POST",
        body: JSON.stringify(user),
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
    })
        .then(async (res) => {
            let responseBody = null;

            try {
                responseBody = await res.json();
            } catch (_) {
                responseBody = null;
            }

            if (!res.ok) {
                const backendMessage = responseBody?.message || "Login failed";
                const isDeactivated =
                    res.status === 403 &&
                    String(backendMessage).toLowerCase().includes("deactivated");

                if (isDeactivated) {
                    throw {
                        code: "DEACTIVATED",
                        message: backendMessage,
                    };
                }

                throw {
                    code: "INVALID_CREDENTIALS",
                    message: backendMessage,
                };
            }

            return responseBody;
        })
        .then((data) => {
            if (data && data.token) {
                return setAuthToken(data.token)
                    .then(() => {
                        const decoded = jwtDecode(data.token);
                        dispatch(setCurrentUser(decoded, user));
                        return { success: true };
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
                        throw {
                            code: "STORAGE_ERROR",
                            message: "Failed to save authentication token",
                        };
                    });
            }

            throw {
                code: "INVALID_RESPONSE",
                message: "Invalid response. Please try again.",
            };
        })
        .catch((err) => {
            logoutUser(dispatch);
            throw err;
        });
};

export const loginWithGoogle = async (idToken, dispatch) => {
    try {
        const googleCredential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, googleCredential);
        const firebaseUser = userCredential.user;

        const response = await fetch(`${baseURL}users/google-login`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ idToken }),
        });

        let data = null;
        try {
            data = await response.json();
        } catch (_) {
            data = null;
        }

        if (!response.ok) {
            const backendMessage = data?.message || "Google sign-in failed";
            const isDeactivated =
                response.status === 403 &&
                String(backendMessage).toLowerCase().includes("deactivated");

            if (isDeactivated) {
                throw {
                    code: "DEACTIVATED",
                    message: backendMessage,
                };
            }

            throw new Error(backendMessage);
        }

        if (!data?.token) {
            throw new Error("Backend did not return an auth token");
        }

        await setAuthToken(data.token);
        const decoded = jwtDecode(data.token);

        const normalizedUser = {
            sub: decoded.userId || firebaseUser.uid,
            userId: decoded.userId,
            isAdmin: decoded.isAdmin,
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
        if (err?.code === "DEACTIVATED") {
            logoutUser(dispatch);
            throw err;
        }

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
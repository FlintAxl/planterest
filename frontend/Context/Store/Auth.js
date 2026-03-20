import React, { useEffect, useReducer, useState } from "react";
// import "core-js/stable/atob";
import { jwtDecode } from "jwt-decode"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { onAuthStateChanged } from "firebase/auth";

import AuthReducer from "../Reducers/Auth.reducer";
import { setCurrentUser } from "../Actions/Auth.actions";
import AuthGlobal from './AuthGlobal'
import { auth } from "../../firebase";

const Auth = props => {
    // console.log(props.children)
    const [stateUser, dispatch] = useReducer(AuthReducer, {
        isAuthenticated: null,
        user: {}
    });
    const [showChild, setShowChild] = useState(false);

    useEffect(() => {
        // Restore authentication state from AsyncStorage on app start
        let unsubscribeFirebaseAuth = null;

        const restoreToken = async () => {
            try {
                const token = await AsyncStorage.getItem("jwt");
                if (token) {
                    try {
                        const decoded = jwtDecode(token);
                        dispatch(setCurrentUser(decoded));
                    } catch (decodeError) {
                        console.log("Invalid token, clearing", decodeError);
                        await AsyncStorage.removeItem("jwt");
                        dispatch(setCurrentUser({}));
                    }
                    setShowChild(true);
                } else {
                    // No JWT found, restore Firebase session for Google sign-in users.
                    unsubscribeFirebaseAuth = onAuthStateChanged(auth, (firebaseUser) => {
                        if (firebaseUser) {
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
                        } else {
                            dispatch(setCurrentUser({}));
                        }

                        setShowChild(true);
                    });
                }
            } catch (error) {
                console.log("Error restoring token", error);
                dispatch(setCurrentUser({}));
                setShowChild(true);
            }
        };

        restoreToken();
        return () => {
            if (unsubscribeFirebaseAuth) {
                unsubscribeFirebaseAuth();
            }
            setShowChild(false);
        };
    }, [])


    if (!showChild) {
        return null;
    } else {
        return (
            <AuthGlobal.Provider
                value={{
                    stateUser,
                    dispatch
                }}
            >
                {props.children}
            </AuthGlobal.Provider>
        )
    }
};

export default Auth
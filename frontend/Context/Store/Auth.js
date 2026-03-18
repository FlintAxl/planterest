import React, { useEffect, useReducer, useState } from "react";
// import "core-js/stable/atob";
import { jwtDecode } from "jwt-decode"
import AsyncStorage from '@react-native-async-storage/async-storage'

import AuthReducer from "../Reducers/Auth.reducer";
import { setCurrentUser } from "../Actions/Auth.actions";
import AuthGlobal from './AuthGlobal'

const Auth = props => {
    // console.log(props.children)
    const [stateUser, dispatch] = useReducer(AuthReducer, {
        isAuthenticated: null,
        user: {}
    });
    const [showChild, setShowChild] = useState(false);

    useEffect(() => {
        // Restore authentication state from AsyncStorage on app start
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
                } else {
                    // No token found, user is not logged in
                    dispatch(setCurrentUser({}));
                }
            } catch (error) {
                console.log("Error restoring token", error);
                dispatch(setCurrentUser({}));
            } finally {
                setShowChild(true);
            }
        };

        restoreToken();
        return () => setShowChild(false);
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
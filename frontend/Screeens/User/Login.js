import React, { useState, useContext, useEffect } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    TextInput,
    Dimensions,
    Image,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native'
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ionicons } from "@expo/vector-icons";

import AuthGlobal from '../../Context/Store/AuthGlobal'
import { loginUser } from '../../Context/Actions/Auth.actions'

const { width, height } = Dimensions.get('window');

const Login = (props) => {
    const context = useContext(AuthGlobal)
    const navigation = useNavigation()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)

    const handleSubmit = () => {
        const user = {
            email,
            password,
        };

        if (email === "" || password === "") {
            setError("Please fill in your credentials");
        } else {
            loginUser(user, context.dispatch);
        }
    };

    useEffect(() => {
        if (context.stateUser.isAuthenticated === true) {
            navigation.replace("User Profile")
        }
    }, [context.stateUser.isAuthenticated, navigation])

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            {/* Header with plant image */}
            <View style={styles.headerContainer}>
                <Image 
                    source={{ uri: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800' }}
                    style={styles.headerImage}
                />
                <View style={styles.headerOverlay} />
            </View>

            {/* Main content */}
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.contentContainer}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Title Section */}
                    <View style={styles.titleContainer}>
                        <Text style={styles.welcomeText}>Welcome Back</Text>
                        <Text style={styles.subtitleText}>Login to your account</Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formContainer}>
                        {/* Email Input */}
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#2E7D32" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                placeholderTextColor="#9E9E9E"
                                value={email}
                                onChangeText={(text) => setEmail(text.toLowerCase())}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#2E7D32" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor="#9E9E9E"
                                value={password}
                                onChangeText={(text) => setPassword(text)}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons 
                                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                                    size={20} 
                                    color="#2E7D32" 
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Remember Me & Forgot Password */}
                        <View style={styles.optionsRow}>
                            <TouchableOpacity 
                                style={styles.rememberContainer}
                                onPress={() => setRememberMe(!rememberMe)}
                            >
                                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                                    {rememberMe && <Ionicons name="checkmark" size={12} color="white" />}
                                </View>
                                <Text style={styles.rememberText}>Remember Me</Text>
                            </TouchableOpacity>
                            <TouchableOpacity>
                                <Text style={styles.forgotText}>Forgot Password?</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Error Message */}
                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        {/* Login Button */}
                        <TouchableOpacity style={styles.loginButton} onPress={handleSubmit}>
                            <Text style={styles.loginButtonText}>Login</Text>
                        </TouchableOpacity>

                        {/* Sign Up Link */}
                        <View style={styles.signupContainer}>
                            <Text style={styles.signupText}>Don't have account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                                <Text style={styles.signupLink}>Sign up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    headerContainer: {
        height: height * 0.35,
        position: 'relative',
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    headerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(46, 125, 50, 0.3)',
    },
    contentContainer: {
        flex: 1,
        backgroundColor: '#fff',
        marginTop: -30,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    scrollContent: {
        paddingHorizontal: 30,
        paddingTop: 30,
        paddingBottom: 50,
    },
    titleContainer: {
        marginBottom: 30,
    },
    welcomeText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2E7D32',
        fontStyle: 'italic',
    },
    subtitleText: {
        fontSize: 16,
        color: '#757575',
        marginTop: 5,
    },
    formContainer: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 15,
        height: 55,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    rememberContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#2E7D32',
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#2E7D32',
    },
    rememberText: {
        fontSize: 14,
        color: '#757575',
    },
    forgotText: {
        fontSize: 14,
        color: '#2E7D32',
        fontWeight: '500',
    },
    errorText: {
        color: '#D32F2F',
        textAlign: 'center',
        marginBottom: 15,
    },
    loginButton: {
        backgroundColor: '#2E7D32',
        borderRadius: 25,
        height: 55,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        shadowColor: '#2E7D32',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    signupText: {
        fontSize: 14,
        color: '#757575',
    },
    signupLink: {
        fontSize: 14,
        color: '#2E7D32',
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});

export default Login;
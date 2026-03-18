import React, { useState, useEffect } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    Image, 
    TouchableOpacity, 
    Dimensions, 
    Linking, 
    TextInput,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import baseURL from "../../assets/common/baseurl";
import Toast from "react-native-toast-message";
import mime from "mime";
import * as ImagePicker from "expo-image-picker"
import * as Location from 'expo-location';

const { height, width } = Dimensions.get("window");

const Register = (props) => {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [image, setImage] = useState(null);
    const [mainImage, setMainImage] = useState('');
    const [location, setLocation] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [emailValid, setEmailValid] = useState(false);
    const navigation = useNavigation();

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleEmailChange = (text) => {
        const lowerText = text.toLowerCase();
        setEmail(lowerText);
        setEmailValid(validateEmail(lowerText));
    };

    const takePhoto = async () => {
        const c = await ImagePicker.requestCameraPermissionsAsync();

        if (c.status === "granted") {
            let result = await ImagePicker.launchCameraAsync({
                aspect: [4, 3],
                quality: 1,
            });

            if (!result.canceled) {
                setMainImage(result.assets[0].uri);
                setImage(result.assets[0].uri);
            }
        }
    };

    const register = () => {
        if (email === "" || name === "" || phone === "" || password === "") {
            setError("Please fill in the form correctly");
            return;
        }

        let formData = new FormData();
        
        if (image) {
            const newImageUri = "file:///" + image.split("file:/").join("");
            formData.append("image", {
                uri: newImageUri,
                type: mime.getType(newImageUri),
                name: newImageUri.split("/").pop()
            });
        }

        formData.append("name", name);
        formData.append("email", email);
        formData.append("password", password);
        formData.append("phone", phone);
        formData.append("isAdmin", false);

        const config = {
            headers: {
                "Content-Type": "multipart/form-data",
            }
        };

        axios
            .post(`${baseURL}users/register`, formData, config)
            .then((res) => {
                if (res.status === 200) {
                    Toast.show({
                        topOffset: 60,
                        type: "success",
                        text1: "Registration Succeeded",
                        text2: "Please Login into your account",
                    });
                    setTimeout(() => {
                        navigation.navigate("Login");
                    }, 500);
                }
            })
            .catch((error) => {
                Toast.show({
                    position: 'bottom',
                    bottomOffset: 20,
                    type: "error",
                    text1: "Something went wrong",
                    text2: "Please try again",
                });
                console.log(error);
            });
    };

    const getLocation = () => {
        if (location && location.coords) {
            const { coords } = location;
            const url = `geo:${coords.latitude},${coords.longitude}?z=5`;
            Linking.openURL(url);
        }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
            setMainImage(result.assets[0].uri);
        }
    };

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);
        })();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* Back Button */}
            <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="chevron-back" size={24} color="#2E7D32" />
            </TouchableOpacity>

            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Title Section with Plant Decoration */}
                    <View style={styles.titleContainer}>
                        <View style={styles.titleRow}>
                            <Text style={styles.titleText}>Register</Text>
                            <Image 
                                source={{ uri: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=100' }}
                                style={styles.leafDecoration}
                            />
                        </View>
                        <Text style={styles.subtitleText}>Create your new account</Text>
                    </View>

                    {/* Profile Image Picker */}
                    <View style={styles.imageContainer}>
                        <Image 
                            style={styles.profileImage} 
                            source={mainImage ? { uri: mainImage } : { uri: 'https://via.placeholder.com/150/E8F5E9/2E7D32?text=+' }} 
                        />
                        <TouchableOpacity
                            onPress={pickImage}
                            style={styles.imagePicker}
                        >
                            <Ionicons name="camera" size={18} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formContainer}>
                        {/* Full Name Input */}
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#2E7D32" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Full Name"
                                placeholderTextColor="#9E9E9E"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        {/* Email Input */}
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color="#2E7D32" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="user@mail.com"
                                placeholderTextColor="#9E9E9E"
                                value={email}
                                onChangeText={handleEmailChange}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            {emailValid && (
                                <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
                            )}
                        </View>

                        {/* Phone Input */}
                        <View style={styles.inputContainer}>
                            <Ionicons name="call-outline" size={20} color="#2E7D32" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Phone Number"
                                placeholderTextColor="#9E9E9E"
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
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
                                onChangeText={setPassword}
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

                        {/* Register Button */}
                        <TouchableOpacity style={styles.registerButton} onPress={register}>
                            <Text style={styles.registerButtonText}>Register</Text>
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>Or continue with</Text>
                            <View style={styles.divider} />
                        </View>

                        {/* Social Login Buttons */}
                        <View style={styles.socialContainer}>
                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-facebook" size={24} color="#1877F2" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-google" size={24} color="#DB4437" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-apple" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>

                        {/* Location Button */}
                        <TouchableOpacity style={styles.locationButton} onPress={getLocation}>
                            <Ionicons name="location-outline" size={20} color="#2E7D32" />
                            <Text style={styles.locationText}>View Location</Text>
                        </TouchableOpacity>

                        {/* Login Link */}
                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                                <Text style={styles.loginLink}>Login</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 30,
        paddingTop: 100,
        paddingBottom: 50,
    },
    titleContainer: {
        marginBottom: 20,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    titleText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
    },
    leafDecoration: {
        width: 50,
        height: 50,
        marginLeft: 10,
        borderRadius: 25,
    },
    subtitleText: {
        fontSize: 16,
        color: '#757575',
        marginTop: 5,
    },
    imageContainer: {
        alignSelf: 'center',
        width: 100,
        height: 100,
        marginBottom: 25,
        position: 'relative',
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#E8F5E9',
    },
    imagePicker: {
        position: "absolute",
        right: 0,
        bottom: 0,
        backgroundColor: "#2E7D32",
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#fff',
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
        marginBottom: 20,
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
    registerButton: {
        backgroundColor: '#2E7D32',
        borderRadius: 25,
        height: 55,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
        shadowColor: '#2E7D32',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    dividerText: {
        marginHorizontal: 15,
        color: '#757575',
        fontSize: 14,
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    socialButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10,
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginBottom: 15,
    },
    locationText: {
        marginLeft: 8,
        color: '#2E7D32',
        fontSize: 14,
        fontWeight: '500',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    loginText: {
        fontSize: 14,
        color: '#757575',
    },
    loginLink: {
        fontSize: 14,
        color: '#2E7D32',
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});

export default Register;

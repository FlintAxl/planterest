import React from 'react';
import { TextInput, StyleSheet } from 'react-native'

const Input = (props) => {
    return (
        <TextInput
            style={[styles.input, props.style, props.hasError && styles.inputError]}
            placeholder={props.placeholder}
            name={props.name}
            id={props.id}
            value={props.value}
            autoCorrect={props.autoCorrect}
            onChangeText={props.onChangeText}
            onFocus={props.onFocus}
            secureTextEntry={props.secureTextEntry}
            keyboardType={props.keyboardType}
            placeholderTextColor={props.placeholderTextColor || '#8C8C8C'}
            multiline={props.multiline}
            numberOfLines={props.numberOfLines}
        >
        </TextInput>
    );
}

const styles = StyleSheet.create({
    input: {
        width: '80%',
        height: 60,
        backgroundColor: 'white',
        margin: 10,
        borderRadius: 20,
        padding: 10,
        borderWidth: 2,
        borderColor: 'orange'
    },
    inputError: {
        borderColor: '#C62828',
        borderWidth: 2,
    },
});

export default Input;
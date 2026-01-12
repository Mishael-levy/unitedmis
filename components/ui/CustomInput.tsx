import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { Colors } from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';

interface Props {
  placeholder?: string;
  handleTextChange?: (value: string) => void;
  secureTextEntry?: boolean; 
  sendInput? : boolean;
  value?: string;
}

export default function CustomInput({ placeholder, handleTextChange, secureTextEntry ,sendInput, value}: Props) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        onChangeText={handleTextChange}
        placeholder={placeholder}
        secureTextEntry={!isPasswordVisible} // Toggle secureTextEntry
        value={value}
      />
      {secureTextEntry && (
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => setIsPasswordVisible((prev) => !prev)}
        >
          <Ionicons
            name={isPasswordVisible ? 'eye' : 'eye-off'}
            size={24}
            color="#a5a5a5"
          />
        </TouchableOpacity>
      )}
      {sendInput && (
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => setIsPasswordVisible((prev) => !prev)}
        >
          <Ionicons
            name='send'
            size={24}
            color="#a5a5a5"
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    marginTop: 10,
    width: '100%',
    position: 'relative', // To position the icon inside the container
  },
  input: {
    width: '100%',
    borderRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    fontSize: 16,
    padding: 15,
    textAlign: 'right',
    backgroundColor: '#e5e5e5',
    borderWidth: 2,
    borderColor: '#a5a5a5',
    paddingRight: 40, // Add padding for the icon
  },
  iconContainer: {
    position: 'absolute',
    textAlign: 'left', // Position the icon to the right inside the container
    marginLeft: 30,
    top: '50%',
    transform: [{ translateY: -12 }], // Center vertically
  },
});

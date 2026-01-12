import {
  View,
  Text,
  StyleSheet,
  ToastAndroid,
  I18nManager,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/stores/authStore';
import BackArrow from '@/components/ui/BackArrow';
import { CustomButton } from '@/components/ui/CustomButton';
import CustomInput from '@/components/ui/CustomInput';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function SignIn() {
  const navigation = useNavigation();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isGuest = useAuthStore((state) => state.isGuest);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });

    // Ensure app is in RTL mode for Hebrew
    I18nManager.forceRTL(true);
  }, []);

  useEffect(() => {
    // Only redirect if authenticated AND not a guest
    if (isAuthenticated && !isGuest) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isGuest]);

  const onSignIn = async () => {
    if (!email || !password) {
      ToastAndroid.show('יש למלא את כל השדות', ToastAndroid.LONG);
      return;
    }

    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <ImageBackground
          source={require('@/assets/background.jpg')} // עדכן את הנתיב לפי המיקום המדויק
          style={styles.background}
        >
    <View style={styles.container}>

      <Text style={styles.title}>בואו נתחבר</Text>
      <Text style={styles.subtitle}>ברוכים הבאים</Text>

      {/* Email Input */}
      <CustomInput placeholder="הכניסו אימייל" handleTextChange={setEmail} />

      {/* Password Input */}
      <CustomInput
        placeholder="הכניסו סיסמה"
        handleTextChange={setPassword}
        secureTextEntry={true}
      />

      {/* Sign In Button */}
      <CustomButton
        backgroundColor={Colors.accent}
        title={'התחבר'}
        handlePress={onSignIn}
      ></CustomButton>

      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.dividerSpan}>או</Text>
        <View style={styles.line} />
      </View>

      {/* Create Account Button */}
      <CustomButton
        backgroundColor={Colors.accent}
        title={'צור חשבון'}
        handlePress={() => router.push('/auth/register')}
      ></CustomButton>

      {/* אייקון דלת */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => router.push('/(tabs)')}
      >
        <Ionicons name="exit-outline" size={28} color={Colors.orange} />
      </TouchableOpacity>
    </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover', // מתאים את התמונה למסך
  },

  container: {
    ...StyleSheet.absoluteFillObject, // ממלא את כל המסך
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 30,
    height: '100%',
    // backgroundColor: Colors.accent,
    gap: 10,
  },

  title: {
    marginTop: 100,
    fontSize: 32,
    marginBottom: 10,
    color: 'black',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 24,
    color: 'black',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginTop: 10,
    width: '100%',
  },
  input: {
    width: '100%',
    borderRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    fontSize: 16,
    padding: 15,
    backgroundColor: '#e5e5e5',
    borderWidth: 2,
    borderColor: '#a5a5a5',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },

  line: {
    borderWidth: 0.5,
    width: '45%',
    backgroundColor: 'black',
  },

  dividerSpan: {
    color: 'black',
    fontSize: 18,
  },

  iconButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: Colors.white,
    padding: 10,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
});

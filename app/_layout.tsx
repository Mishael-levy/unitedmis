import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import 'react-native-reanimated';
import { LogBox } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import AppLoading from '@/components/AppLoading';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/configs/FirebaseConfig';
import Call from '@/components/Call';
import { useArrayStore } from '@/stores/arrStore';
import { initializeAIProcessor } from '@/services/AIContentProcessor';

// Suppress known warnings
LogBox.ignoreLogs([
  'Unexpected text node',
  'pointerEvents is deprecated',
  'Image: style.resizeMode is deprecated',
]);

export default function RootLayout() {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [callId, setCallId] = useState('');
  const user = useAuthStore((state) => state.user);
  const Items = useArrayStore((state) => state.items);

  useEffect(() => {
    // Use Groq API for AI-powered exercise generation (free!)
    // Get your free API key at: https://console.groq.com/keys
    initializeAIProcessor({ 
      provider: 'groq',
      apiKey: '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',
      model: 'llama-3.3-70b-versatile', // Free, fast, and great for Hebrew
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const callsRef = collection(db, 'calls');
    const unsubscribe = onSnapshot(
      callsRef, 
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            try {
              const newCall = change.doc.data();
              if (!newCall || !newCall.skill) return;
              
              const userBadges = user.badges || [];
              const hasBadge = userBadges.some((badge) => badge?.title === newCall.skill);
               if (!hasBadge) return;

              const message = `קריאה חדשה לעזרה ${newCall.skill || ''} במיקום: ${newCall.location || 'לא ידוע'}`;
              setModalMessage(message);

              const callIdMap: any = {
                Fire: '1',
                CPR: '11',
                Snakes: '4',
                Stroke: '2',
              };
              setCallId(callIdMap[newCall.skill] || '');

              setModalVisible(true);
            } catch (error) {
              console.error('Error processing call:', error);
            }
          }
        });
      },
      (error) => {
        console.error('Firestore listener error:', error);
      }
    );
    
    return () => unsubscribe();
  }, [user]);

  const loading = useAuthStore((state) => state.loading);

  if (loading) {
    return <AppLoading />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>

      {/* Render the Call modal */}
      <Call visible={modalVisible} setVisible={setModalVisible} message={modalMessage} id={callId} />
    </>
  );
}

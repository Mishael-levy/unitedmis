import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, TextInput, Modal } from 'react-native';
import React, { useState, useEffect } from 'react';
import MockCards from '@/mocks/community';
import Qcard from '@/components/Community/Qcard';
import ScrollToTopContainer from '@/components/ui/ScrollToTopContainer';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

// Time in milliseconds (1 hour = 3600000ms)
const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour

interface Discussion {
  id: number;
  title: string;
  messages: any[];
  lastActivity: number;
}

export default function Discussions() {
  // Styles for the new components
  const styles = StyleSheet.create({
    background: {
      flex: 1,
      resizeMode: 'cover',
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    header: {
      padding: 20,
      paddingTop: 40,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: Colors.text,
    },
    headerSubtitle: {
      fontSize: 14,
      color: '#666',
      marginTop: 5,
    },
    container: {
      padding: 10,
      paddingBottom: 100,
    },
    fab: {
      position: 'absolute',
      bottom: 30,
      right: 30,
      backgroundColor: Colors.accent,
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: '#FFF',
      borderRadius: 15,
      padding: 20,
      width: '85%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 15,
      color: Colors.text,
    },
    input: {
      borderWidth: 1,
      borderColor: '#DDD',
      borderRadius: 10,
      padding: 15,
      fontSize: 16,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    cancelButton: {
      padding: 12,
      borderRadius: 10,
      backgroundColor: '#EEE',
      flex: 1,
      marginRight: 10,
    },
    cancelText: {
      textAlign: 'center',
      color: '#666',
      fontWeight: 'bold',
    },
    submitButton: {
      padding: 12,
      borderRadius: 10,
      backgroundColor: Colors.accent,
      flex: 1,
      marginLeft: 10,
    },
    submitText: {
      textAlign: 'center',
      color: '#FFF',
      fontWeight: 'bold',
    },
  });

  // Initialize discussions with lastActivity timestamp
  const [discussions, setDiscussions] = useState<Discussion[]>(() => 
    MockCards.map(card => ({
      ...card,
      lastActivity: Date.now(),
    }))
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  // Check for inactive discussions every minute and remove them
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setDiscussions(prev => 
        prev.filter(discussion => {
          const isActive = (now - discussion.lastActivity) < INACTIVITY_TIMEOUT;
          if (!isActive) {
            console.log(`דיון נמחק עקב חוסר פעילות: ${discussion.title}`);
          }
          return isActive;
        })
      );
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const addDiscussion = () => {
    if (newTitle.trim()) {
      const newDiscussion: Discussion = {
        id: Date.now(),
        title: newTitle,
        messages: [],
        lastActivity: Date.now(),
      };
      setDiscussions([newDiscussion, ...discussions]);
      setNewTitle('');
      setModalVisible(false);
    }
  };

  return (
    <ImageBackground
      source={require('@/assets/background.jpg')}
      style={styles.background}
    >
      <View style={styles.overlay} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>דיונים ושאלות</Text>
        <Text style={styles.headerSubtitle}>שתפו, שאלו ולמדו מאחרים</Text>
      </View>

      <ScrollToTopContainer contentContainerStyle={styles.container}>
        {discussions.map((card: any, key: number) => (
          <Qcard key={key} title={card.title} id={card.id} />
        ))}
      </ScrollToTopContainer>

      {/* Add Discussion Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>

      {/* New Discussion Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>דיון חדש</Text>
            <TextInput
              style={styles.input}
              placeholder="מה תרצה לשאול או לדון?"
              value={newTitle}
              onChangeText={setNewTitle}
              multiline
              textAlign="right"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={addDiscussion}>
                <Text style={styles.submitText}>פרסם</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

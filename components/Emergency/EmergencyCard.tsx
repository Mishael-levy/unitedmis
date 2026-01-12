import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Ensure you have expo/vector-icons installed

type EmergencyCardProps = {
  header: string;
  steps: string[];
  onClose?: () => void; // Optional prop for handling close action
};

const EmergencyCard: React.FC<EmergencyCardProps> = ({
  header,
  steps,
  onClose,
}) => {
  const handleCall = () => {
    Linking.openURL('tel:101');
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>{header}</Text>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <ScrollView style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepContainer}>
              <Text style={styles.stepNumber}>{index + 1}.</Text>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </ScrollView>
        {/* Call 101 Button */}
        <TouchableOpacity style={styles.callButton} onPress={handleCall}>
          <Ionicons
            name="call"
            size={24}
            color="#fff"
            style={styles.callIcon}
          />
          <Text style={styles.callButtonText}>התקשר ל-101</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default EmergencyCard;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // Elevation for Android
    elevation: 5,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    flexWrap: 'wrap',
  },
  closeButton: {
    padding: 5,
    marginLeft: 10,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#555',
  },
  stepsContainer: {
    marginTop: 10,
  },
  stepContainer: {
    flexDirection: 'row-reverse', // Changed from 'row' to 'row-reverse' to align numbers on the right
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginLeft: 8, // Changed from marginRight to marginLeft
    writingDirection: 'ltr', // Ensure number and dot are rendered left-to-right
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: '#555',
    writingDirection: 'rtl', // Ensure the text is right-to-left
  },
  callButton: {
    flexDirection: 'row-reverse', // Changed to 'row-reverse' for RTL alignment
    alignItems: 'center',
    backgroundColor: '#dc3545', // Red color for emergency
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  callIcon: {
    marginLeft: 10, // Changed to marginLeft for RTL
  },
  callButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10, // Added margin for spacing between icon and text
  },
});

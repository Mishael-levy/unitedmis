import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Modal,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { Exercise } from '@/types/data';
import PressableOption from './PressableOption';
import AnswerIndex from './AnswerIndex';

interface ChoiceExerciseProps {
  exercise: Exercise;
  onAnswerSelected: (isCorrect: boolean) => void;
}

export default function ChoiceExercise({
  exercise,
  onAnswerSelected,
}: ChoiceExerciseProps) {
  const { question, answers, correct, subQuestion } = exercise;
  const [modalVisible, setModalVisible] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [fillBlankAnswer, setFillBlankAnswer] = useState('');
  const [fillBlankSubmitted, setFillBlankSubmitted] = useState(false);
  const [fillBlankCorrect, setFillBlankCorrect] = useState(false);

  // Reset state when exercise changes
  useEffect(() => {
    setModalVisible(false);
    setCorrectAnswer('');
    setFillBlankAnswer('');
    setFillBlankSubmitted(false);
    setFillBlankCorrect(false);
  }, [exercise.id]);

  const handleAnswerPress = (index: number) => {
    const isCorrect = index === correct;

    if (!isCorrect) {
      setCorrectAnswer(answers[correct as number]);
      setModalVisible(true);
    }

    onAnswerSelected(isCorrect);
  };

  const handleFillBlankSubmit = () => {
    if (!fillBlankAnswer.trim()) {
      Alert.alert('שגיאה', 'אנא הזן תשובה');
      return;
    }

    // Compare answers (case insensitive, trimmed)
    const userAnswer = fillBlankAnswer.trim().toLowerCase();
    const correctAnswerStr = String(correct).trim().toLowerCase();
    const isCorrect = userAnswer === correctAnswerStr;

    setFillBlankCorrect(isCorrect);
    setFillBlankSubmitted(true);

    if (!isCorrect) {
      setCorrectAnswer(String(correct));
      setModalVisible(true);
    }

    // Delay the callback to allow showing feedback
    setTimeout(() => {
      onAnswerSelected(isCorrect);
    }, isCorrect ? 500 : 0);
  };

  // Render fill-blank exercise
  if (exercise.type === 'fill-blank') {
    return (
      <View style={styles.container}>
        <Text style={styles.questionText}>{question}</Text>
        
        {subQuestion && (
          <Text style={styles.subQuestionText}>{subQuestion}</Text>
        )}

        <View style={styles.fillBlankContainer}>
          <TextInput
            style={[
              styles.fillBlankInput,
              fillBlankSubmitted && fillBlankCorrect && styles.inputCorrect,
              fillBlankSubmitted && !fillBlankCorrect && styles.inputIncorrect,
            ]}
            placeholder="הקלד את התשובה..."
            placeholderTextColor="#999"
            value={fillBlankAnswer}
            onChangeText={setFillBlankAnswer}
            editable={!fillBlankSubmitted}
            textAlign="right"
          />
          
          {!fillBlankSubmitted && (
            <Pressable style={styles.submitButton} onPress={handleFillBlankSubmit}>
              <Text style={styles.submitButtonText}>בדוק</Text>
            </Pressable>
          )}

          {fillBlankSubmitted && fillBlankCorrect && (
            <View style={styles.feedbackCorrect}>
              <Text style={styles.feedbackText}>✅ תשובה נכונה!</Text>
            </View>
          )}
        </View>

        {/* Modal for wrong answer */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalText}>אופס טעות😮</Text>
              <Text style={styles.modalText}>התשובה הנכונה היא:</Text>
              <Text style={styles.correctAnswerText}>{correctAnswer}</Text>
              <Pressable
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>OK</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Render true-false exercise
  if (exercise.type === 'true-false') {
    return (
      <View style={styles.container}>
        <Text style={styles.questionText}>{question}</Text>
        
        {subQuestion && (
          <Text style={styles.subQuestionText}>{subQuestion}</Text>
        )}

        <View style={styles.trueFalseContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.trueFalseButton,
              styles.trueButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => handleAnswerPress(0)}
          >
            <Text style={styles.trueFalseText}>✓ נכון</Text>
          </Pressable>
          
          <Pressable
            style={({ pressed }) => [
              styles.trueFalseButton,
              styles.falseButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => handleAnswerPress(1)}
          >
            <Text style={styles.trueFalseText}>✗ לא נכון</Text>
          </Pressable>
        </View>

        {/* Modal for wrong answer */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalText}>אופס טעות😮</Text>
              <Text style={styles.modalText}>התשובה הנכונה היא:</Text>
              <Text style={styles.correctAnswerText}>{correctAnswer}</Text>
              <Pressable
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>OK</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Default: multiple choice rendering
  return (
    <View style={styles.container}>
      {exercise.type.startsWith('text') || exercise.type === 'text-to-text' ? (
        <Text style={styles.questionText}>{question}</Text>
      ) : (
        <Image source={{ uri: question }} style={{ width: 200, height: 200 }} />
      )}

      {subQuestion && (
        <Text style={styles.subQuestionText}>{subQuestion}</Text>
      )}

      <View style={styles.answersContainer}>
        {answers.map((answer, index) =>
          exercise.type.endsWith('text') || exercise.type === 'text-to-text' ? (
            <PressableOption
              correct={index === correct}
              key={index}
              index={index}
              handleAnswerPress={handleAnswerPress}
            >
              <AnswerIndex text={(index + 1).toString()} />
              <Text style={{ fontSize: 20 }}>{answer}</Text>
            </PressableOption>
          ) : (
            <PressableOption
              correct={index === correct}
              key={index}
              isSquare={true}
              index={index}
              handleAnswerPress={handleAnswerPress}
            >
              {answer.endsWith('.png') || answer.endsWith('.jpg') ? (
                <Image
                  source={{ uri: answer }}
                  style={{ width: 100, height: 100 }}
                />
              ) : (
                <Text style={{ fontSize: 50 }}>{answer}</Text>
              )}
            </PressableOption>
          ),
        )}
      </View>

      {/* Modal to show the correct answer */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>אופס טעות😮</Text>
            <Text style={styles.modalText}>התשובה הנכונה היא:</Text>
            {exercise.type.endsWith('text') || exercise.type === 'text-to-text' ? (
              <Text style={styles.correctAnswerText}>{correctAnswer}</Text>
            ) : (
              <Image
                source={{ uri: correctAnswer}}
                style={styles.robotImage}
              />
            )}
            <Pressable
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  questionText: {
    textAlign: 'center',
    fontSize: 24,
    marginBottom: 20,
    color: '#333',
  },
  subQuestionText: {
    textAlign: 'center',
    fontSize: 18,
    marginBottom: 20,
    color: '#666',
  },
  answersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    marginTop: 20,
  },
  // Fill-blank styles
  fillBlankContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  fillBlankInput: {
    width: '90%',
    borderWidth: 2,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    backgroundColor: '#fff',
    textAlign: 'right',
  },
  inputCorrect: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e9',
  },
  inputIncorrect: {
    borderColor: '#f44336',
    backgroundColor: '#ffebee',
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  feedbackCorrect: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  // True-false styles
  trueFalseContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 30,
  },
  trueFalseButton: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 16,
    borderWidth: 2,
    borderBottomWidth: 6,
  },
  trueButton: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4CAF50',
  },
  falseButton: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  buttonPressed: {
    transform: [{ translateY: 4 }],
    borderBottomWidth: 2,
  },
  trueFalseText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  correctAnswerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 20,
    textAlign: 'center',
  },
  robotImage: {
    marginBottom: 20,
    width: 100,
    height: 100,
  },
  closeButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  I18nManager,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { CustomButton } from '@/components/ui/CustomButton';
import CustomInput from '@/components/ui/CustomInput';
import { useAuthStore } from '@/stores/authStore';
import { useContentAndStudyStore } from '@/stores/contentAndStudyStore';
import { getAIProcessor } from '@/services/AIContentProcessor';

// Helper function to extract text from PDF using Gemini Vision
const extractTextFromPDFWithAI = async (base64Data: string, apiKey: string): Promise<string> => {
  try {
    console.log('Extracting text from PDF using Gemini Vision...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              {
                inline_data: {
                  mime_type: 'application/pdf',
                  data: base64Data
                }
              },
              {
                text: 'אנא חלץ את כל הטקסט מקובץ ה-PDF הזה. החזר רק את הטקסט עצמו, ללא הערות או תוספות. שמור על המבנה והפסקאות.'
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('PDF extraction error:', data?.error?.message);
      throw new Error(data?.error?.message || 'Failed to extract PDF text');
    }

    const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('PDF text extracted, length:', extractedText.length);
    return extractedText;
  } catch (error) {
    console.error('PDF extraction failed:', error);
    throw error;
  }
};

// Helper functions for file processing (legacy - kept for reference)
const extractTextFromPDF = async (uri: string): Promise<string> => {
  // PDF files now handled by extractTextFromPDFWithAI
  return '';
};

const extractTextFromWord = async (uri: string): Promise<string> => {
  // Word files need special handling - for now, return empty and show alert
  Alert.alert(
    'קובץ Word',
    'קריאת Word מוגבלת. מומלץ לפתוח את הקובץ ולהעתיק את הטקסט ידנית דרך כפתור "הדבק טקסט".',
    [{ text: 'הבנתי' }]
  );
  return '';
};

I18nManager.forceRTL(true);

interface UploadState {
  title: string;
  description: string;
  subject: string;
  fileContent: string;
  fileName: string;
  fileType: 'pdf' | 'text' | 'document' | 'image';
}

export default function UploadContent() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { uploadContent, updateContentStatus } = useContentAndStudyStore();
  const [state, setState] = useState<UploadState>({
    title: '',
    description: '',
    subject: '',
    fileContent: '',
    fileName: '',
    fileType: 'text',
  });
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedText, setPastedText] = useState('');

  // Debug: Check if user is authenticated
  useEffect(() => {
    console.log('Upload page loaded. User:', user ? user.email : 'Not logged in');
    if (!user) {
      console.warn('User not authenticated - upload will not work');
    }
  }, [user]);

  const handlePickFile = async () => {
    try {
      console.log('Starting file picker...');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'text/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      console.log('File picker result:', result);

      if (!result.canceled && result.assets.length > 0) {
        const file = result.assets[0];
        setUploadProgress('קריאת קובץ...');

        const isPDF = file.mimeType?.includes('pdf') || file.name.endsWith('.pdf');
        const isWord = file.mimeType?.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx');
        
        // Check if it's Word - show message and stop (PDF is now supported)
        if (isWord) {
          setUploadProgress('');
          Alert.alert(
            `קובץ Word לא נתמך`,
            `אנא פתח את המסמך, העתק את הטקסט (Ctrl+A, Ctrl+C), ולחץ על כפתור "הדבק טקסט" למטה.`,
            [{ text: 'הבנתי' }]
          );
          return;
        }

        let fileContent = '';

        try {
          if (isPDF) {
            // Handle PDF files with Gemini Vision API
            setUploadProgress('מחלץ טקסט מ-PDF...');
            
            let base64Data = '';
            if (Platform.OS === 'web') {
              if (file.file) {
                const arrayBuffer = await file.file.arrayBuffer();
                const bytes = new Uint8Array(arrayBuffer);
                let binary = '';
                for (let i = 0; i < bytes.length; i++) {
                  binary += String.fromCharCode(bytes[i]);
                }
                base64Data = btoa(binary);
              } else {
                throw new Error('לא ניתן לקרוא את הקובץ בדפדפן זה');
              }
            } else {
              base64Data = await FileSystem.readAsStringAsync(
                file.uri,
                { encoding: FileSystem.EncodingType.Base64 }
              );
            }
            
            // Get API key from AI processor
            const processor = getAIProcessor();
            const apiKey = (processor as any).config?.apiKey || 'AIzaSyCk8Xkm_c8IFG17EolqCsTjPmTVImbiOdM';
            
            fileContent = await extractTextFromPDFWithAI(base64Data, apiKey);
            
            if (!fileContent || fileContent.trim().length < 50) {
              throw new Error('לא הצלחנו לחלץ טקסט מספיק מה-PDF');
            }
          } else {
            // Handle plain text files
            if (Platform.OS === 'web') {
              if (file.file) {
                fileContent = await file.file.text();
              } else {
                throw new Error('לא ניתן לקרוא את הקובץ בדפדפן זה');
              }
            } else {
              fileContent = await FileSystem.readAsStringAsync(
                file.uri,
                { encoding: FileSystem.EncodingType.UTF8 }
              );
            }
          }
        } catch (error) {
          console.error('File reading error:', error);
          Alert.alert(
            'שגיאה בקריאת קובץ',
            isPDF 
              ? 'לא הצלחנו לחלץ טקסט מה-PDF. אנא נסה להעתיק את הטקסט ידנית דרך כפתור "הדבק טקסט".'
              : 'לא הצלחנו לקרוא את הקובץ. אנא נסה להעתיק את הטקסט ידנית דרך כפתור "הדבק טקסט".',
            [{ text: 'הבנתי' }]
          );
          setUploadProgress('');
          return;
        }

        if (!fileContent || fileContent.trim().length === 0) {
          Alert.alert(
            'קובץ ריק',
            'הקובץ שבחרת ריק או לא ניתן לקריאה. אנא נסה קובץ אחר או השתמש בכפתור "הדבק טקסט".',
            [{ text: 'הבנתי' }]
          );
          setUploadProgress('');
          return;
        }

        console.log('File loaded successfully:', file.name, 'Type:', isPDF ? 'pdf' : 'text', 'Content length:', fileContent.length);
        
        setState((prev) => ({
          ...prev,
          fileContent,
          fileName: file.name,
          fileType: isPDF ? 'pdf' : 'text',
        }));

        setUploadProgress('');
        Alert.alert('הצלחה', `הקובץ "${file.name}" נטען בהצלחה (${fileContent.length} תווים)`);
      }
    } catch (error) {
      console.error('Error picking file:', error);
      const errorMsg = error instanceof Error ? error.message : 'אירעה שגיאה בעת בחירת הקובץ';
      Alert.alert('שגיאה', errorMsg);
    }
  };

  const handlePasteText = () => {
    setShowPasteModal(true);
    setPastedText('');
  };

  const handlePasteConfirm = () => {
    if (pastedText.trim()) {
      setState((prev) => ({
        ...prev,
        fileContent: pastedText,
        fileName: `text-${Date.now()}`,
        fileType: 'text',
      }));
      setShowPasteModal(false);
      setPastedText('');
      Alert.alert('הצלחה', 'הטקסט נטען בהצלחה');
    } else {
      Alert.alert('שגיאה', 'אנא הזן טקסט');
    }
  };

  const validateForm = (): boolean => {
    console.log('Validating form:', {
      title: state.title,
      subject: state.subject,
      fileContentLength: state.fileContent.length
    });
    
    if (!state.title.trim()) {
      console.log('Validation failed: missing title');
      Alert.alert('שגיאה', 'אנא הזן כותרת');
      return false;
    }
    if (!state.subject.trim()) {
      console.log('Validation failed: missing subject');
      Alert.alert('שגיאה', 'אנא בחר תחום ידע');
      return false;
    }
    if (!state.fileContent.trim()) {
      console.log('Validation failed: missing content');
      Alert.alert('שגיאה', 'אנא העלה או הדבק תוכן ללימוד');
      return false;
    }
    console.log('Form validation passed');
    return true;
  };

  const handleUploadAndProcess = async () => {
    console.log('Starting upload process...');
    console.log('User:', user?.email);
    console.log('State:', { title: state.title, subject: state.subject, fileContentLength: state.fileContent.length });
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }
    
    // No longer require authentication - guest mode is supported

    try {
      setLoading(true);
      const isGuest = useAuthStore.getState().isGuest;
      const userId = user?.email || `guest-${Date.now()}`;
      
      let contentId = `local-${Date.now()}`;
      
      if (!isGuest) {
        // Only save to Firebase for authenticated users
        setUploadProgress('העלאת קובץ...');
        console.log('Uploading to Firestore...');

        contentId = await uploadContent({
          userId: userId,
          fileName: state.fileName || `content-${Date.now()}`,
          fileType: state.fileType,
          fileUrl: `gs://bucket/${state.fileName}`,
          title: state.title,
          description: state.description,
          subject: state.subject,
          uploadedAt: Date.now(),
          status: 'processing',
        });
        
        console.log('Content uploaded successfully, ID:', contentId);
      } else {
        console.log('Guest mode - skipping Firebase upload');
      }
      
      setUploadProgress('עיבוד התוכן בעזרת AI...');

      // Fetch good question examples for this subject to improve AI generation
      const { fetchGoodQuestionExamples } = useContentAndStudyStore.getState();
      const goodExamples = await fetchGoodQuestionExamples(state.subject, 5);
      console.log('Good examples found:', goodExamples.length);

      // Process content with AI, using good examples for better questions
      const processor = getAIProcessor();
      const response = await processor.processContent({
        contentId,
        userId: userId,
        title: state.title,
        content: state.fileContent,
        subject: state.subject,
        preferredExerciseTypes: [
          'multiple-choice',
          'fill-blank',
          'true-false',
          'matching',
        ],
        targetDifficulty: ['easy', 'medium', 'hard'],
        numberOfExercises: 10,
      }, goodExamples);

      console.log('AI processing complete. Exercises:', response.exercises?.length);

      if (!response.exercises || response.exercises.length === 0) {
        throw new Error('לא הצלחנו ליצור תרגילים מהתוכן');
      }

      // Create study set from generated exercises
      setUploadProgress('יצירת מערך תרגול...');

      const studySetData = {
        userId: userId,
        contentId,
        title: state.title,
        description: response.summary || '',
        subject: state.subject,
        exercises: response.exercises,
        originalContent: state.fileContent, // Save content for regenerating exercises
        completedExercises: 0,
        totalExercises: response.exercises.length,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      console.log('Creating study set with data:', {
        ...studySetData,
        exercises: `${studySetData.exercises.length} exercises`,
      });

      let setId: string;
      
      if (!isGuest) {
        // Save to Firebase for authenticated users
        const { createStudySet } = useContentAndStudyStore.getState();
        setId = await createStudySet(studySetData);
        console.log('Study set created in Firebase, ID:', setId);
        
        // Update content status
        await updateContentStatus(contentId, 'completed');
      } else {
        // For guests, store locally and use local ID
        setId = `local-${Date.now()}`;
        // Store in local state for the session
        const { setLocalStudySet } = useContentAndStudyStore.getState();
        if (setLocalStudySet) {
          setLocalStudySet({ ...studySetData, id: setId });
        }
        console.log('Study set stored locally for guest, ID:', setId);
      }

      setUploadProgress('');
      Alert.alert(
        'הצלחה!',
        `תוכן "${state.title}" עובד בהצלחה. נוצרו ${response.exercises.length} תרגילים${isGuest ? '\n\n💡 התחבר כדי לשמור את ההתקדמות שלך!' : ''}`,
        [
          {
            text: 'התחל ללמוד',
            onPress: () => {
              // Navigate to study set with ID
              router.push(`/study-set?setId=${setId}`);
            },
          },
          { text: 'חזור לבית', onPress: () => router.back() },
        ]
      );

      // Reset form
      setState({
        title: '',
        description: '',
        subject: '',
        fileContent: '',
        fileName: '',
        fileType: 'text',
      });
    } catch (error) {
      console.error('Error processing content:', error);
      Alert.alert(
        'שגיאה',
        `אירעה שגיאה: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`
      );
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  const SUBJECTS = [
    'מתמטיקה',
    'פיזיקה',
    'כימיה',
    'ביולוגיה',
    'ספרות',
    'היסטוריה',
    'גיאוגרפיה',
    'תכנות',
    'אנגלית',
    'אומנות',
    'ספורט',
    'אחר',
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)')}
          style={{ alignSelf: 'flex-end' }}
        >
          <Ionicons name="arrow-forward" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>העלאת חומר לימוד</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Title Input */}
      <View style={styles.section}>
        <Text style={styles.label}>כותרת החומר *</Text>
        <CustomInput
          placeholder="לדוגמה: פרק 3 - התהליך הפוטוסינתטי"
          handleTextChange={(text: string) => setState((prev) => ({ ...prev, title: text }))}
          value={state.title}
        />
      </View>

      {/* Subject Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>תחום ידע *</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.subjectScroll}
        >
          {SUBJECTS.map((subject) => (
            <TouchableOpacity
              key={subject}
              style={[
                styles.subjectChip,
                state.subject === subject && styles.subjectChipActive,
              ]}
              onPress={() => setState((prev) => ({ ...prev, subject }))}
              disabled={loading}
            >
              <Text
                style={[
                  styles.subjectChipText,
                  state.subject === subject && styles.subjectChipTextActive,
                ]}
              >
                {subject}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Description Input */}
      <View style={styles.section}>
        <Text style={styles.label}>תיאור (אופציונלי)</Text>
        <CustomInput
          placeholder="תיאור קצר של התוכן"
          handleTextChange={(text: string) => setState((prev) => ({ ...prev, description: text }))}
          value={state.description}
        />
      </View>

      {/* File Upload Section */}
      <View style={styles.section}>
        <Text style={styles.label}>העלאת קובץ</Text>

        {state.fileContent ? (
          <View style={styles.uploadedFile}>
            <Text style={styles.uploadedFileName}>{state.fileName}</Text>
            <Text style={styles.uploadedFileSize}>
              {state.fileContent.length} תווים
            </Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() =>
                setState((prev) => ({
                  ...prev,
                  fileContent: '',
                  fileName: '',
                }))
              }
              disabled={loading}
            >
              <Text style={styles.removeButtonText}>הסר</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <CustomButton
              title="בחר קובץ"
              handlePress={handlePickFile}
              disabled={loading}
              backgroundColor={Colors.accent}
            />
            <View style={styles.dividerContainer}>
              <Text style={styles.divider}>או</Text>
            </View>
            <CustomButton
              title="הדבק טקסט"
              handlePress={handlePasteText}
              disabled={loading}
              backgroundColor={Colors.secondary}
            />
          </>
        )}
      </View>

      {/* Upload Progress */}
      {uploadProgress && (
        <View style={styles.progressSection}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.progressText}>{uploadProgress}</Text>
        </View>
      )}

      {/* Upload Button */}
      <CustomButton
        title={loading ? 'בעיבוד...' : 'העלה ועיבד'}
        handlePress={handleUploadAndProcess}
        disabled={loading || !state.fileContent}
        backgroundColor={Colors.accent}
      />

      <View style={{ height: 40 }} />

      {/* Paste Text Modal */}
      <Modal
        visible={showPasteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPasteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>הדבק טקסט</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="הדבק או הקלד את התוכן כאן..."
              multiline
              numberOfLines={10}
              value={pastedText}
              onChangeText={setPastedText}
              textAlignVertical="top"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowPasteModal(false)}
              >
                <Text style={styles.modalButtonText}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handlePasteConfirm}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>אישור</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  subjectScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  subjectChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  subjectChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  subjectChipText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  subjectChipTextActive: {
    color: Colors.white,
  },
  uploadedFile: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  uploadedFileName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  uploadedFileSize: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#ff6b6b',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  removeButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    textAlign: 'center',
    color: '#ccc',
    marginVertical: 12,
    fontSize: 12,
  },
  dividerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  progressSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
  },
  progressText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 200,
    textAlign: 'right',
    backgroundColor: '#f9f9f9',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f0f0f0',
  },
  modalButtonConfirm: {
    backgroundColor: Colors.accent,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
});

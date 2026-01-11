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
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { CustomButton } from '@/components/ui/CustomButton';
import CustomInput from '@/components/ui/CustomInput';
import BackArrow from '@/components/ui/BackArrow';
import { useAuthStore } from '@/stores/authStore';
import { useContentAndStudyStore } from '@/stores/contentAndStudyStore';
import { getAIProcessor } from '@/services/AIContentProcessor';

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

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const file = result.assets[0];
        setUploadProgress('קריאת קובץ...');

        let fileContent = '';

        // Handle file reading based on platform
        if (Platform.OS === 'web') {
          // On web, DocumentPicker returns a File object
          // We need to read it differently
          if (file.file) {
            const text = await file.file.text();
            fileContent = text;
          } else {
            throw new Error('לא ניתן לקרוא את הקובץ בדפדפן זה');
          }
        } else {
          // On native platforms, use FileSystem
          fileContent = await FileSystem.readAsStringAsync(
            file.uri,
            {
              encoding: FileSystem.EncodingType.UTF8,
            }
          );
        }

        let fileType: UploadState['fileType'] = 'text';
        if (file.mimeType?.includes('pdf')) fileType = 'pdf';
        else if (file.mimeType?.includes('word') || file.mimeType?.includes('document'))
          fileType = 'document';

        setState((prev) => ({
          ...prev,
          fileContent,
          fileName: file.name,
          fileType,
        }));

        setUploadProgress('');
        Alert.alert('הצלחה', `הקובץ "${file.name}" נטען בהצלחה`);
      }
    } catch (error) {
      console.error('Error picking file:', error);
      const errorMsg = error instanceof Error ? error.message : 'אירעה שגיאה בעת בחירת הקובץ';
      Alert.alert('שגיאה', errorMsg);
    }
  };

  const handlePasteText = async () => {
    // This would use clipboard API if available in React Native
    // For now, we'll show a text input modal
    Alert.prompt(
      'הדבק טקסט',
      'הדבק את תוכן הלימוד כאן',
      [
        { text: 'ביטול', onPress: () => {}, style: 'cancel' },
        {
          text: 'אישור',
          onPress: (text) => {
            if (text) {
              setState((prev) => ({
                ...prev,
                fileContent: text,
                fileName: `text-${Date.now()}`,
                fileType: 'text',
              }));
            }
          },
        },
      ],
      'plain-text',
      ''
    );
  };

  const validateForm = (): boolean => {
    if (!state.title.trim()) {
      Alert.alert('שגיאה', 'אנא הזן כותרת');
      return false;
    }
    if (!state.subject.trim()) {
      Alert.alert('שגיאה', 'אנא בחר תחום ידע');
      return false;
    }
    if (!state.fileContent.trim()) {
      Alert.alert('שגיאה', 'אנא העלה או הדבק תוכן ללימוד');
      return false;
    }
    return true;
  };

  const handleUploadAndProcess = async () => {
    if (!validateForm() || !user) return;

    try {
      setLoading(true);
      setUploadProgress('העלאת קובץ...');

      // Upload content to Firestore
      const contentId = await uploadContent({
        userId: user.email || '',
        fileName: state.fileName || `content-${Date.now()}`,
        fileType: state.fileType,
        fileUrl: `gs://bucket/${state.fileName}`, // Placeholder - would be real Firebase Storage URL
        title: state.title,
        description: state.description,
        subject: state.subject,
        uploadedAt: Date.now(),
        status: 'processing',
      });

      setUploadProgress('עיבוד התוכן בעזרת AI...');

      // Process content with AI
      const processor = getAIProcessor();
      const response = await processor.processContent({
        contentId,
        userId: user.email || '',
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
      });

      // Create study set from generated exercises
      setUploadProgress('יצירת מערך תרגול...');

      const { createStudySet } = useContentAndStudyStore.getState();
      const setId = await createStudySet({
        userId: user.email || '',
        contentId,
        title: state.title,
        description: response.summary,
        subject: state.subject,
        exercises: response.exercises,
        completedExercises: 0,
        totalExercises: response.exercises.length,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Update content status
      await updateContentStatus(contentId, 'completed');

      setUploadProgress('');
      Alert.alert(
        'הצלחה!',
        `תוכן "${state.title}" עובד בהצלחה. נוצרו ${response.exercises.length} תרגילים`,
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
        <BackArrow />
        <Text style={styles.title}>העלאת חומר לימוד</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Title Input */}
      <View style={styles.section}>
        <Text style={styles.label}>כותרת החומר *</Text>
        <CustomInput
          placeholder="לדוגמה: פרק 3 - התהליך הפוטוסינתטי"
          handleTextChange={(text: string) => setState((prev) => ({ ...prev, title: text }))}
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
            <Text style={styles.divider}>או</Text>
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
});

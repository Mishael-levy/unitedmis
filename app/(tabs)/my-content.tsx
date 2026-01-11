import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  I18nManager,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useContentAndStudyStore } from '@/stores/contentAndStudyStore';
import { useAuthStore } from '@/stores/authStore';
import { UploadedContent, StudySet } from '@/types/ai-learning';

I18nManager.forceRTL(true);

export default function MyContent() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const {
    uploadedContents,
    studySets,
    loading,
    error,
    fetchUserContents,
    fetchUserStudySets,
    deleteContent,
    deleteStudySet,
  } = useContentAndStudyStore();

  useEffect(() => {
    if (user?.email) {
      loadContent();
    }
  }, [user]);

  const loadContent = async () => {
    if (user?.email) {
      await fetchUserContents(user.email);
      await fetchUserStudySets(user.email);
    }
  };

  const handleDeleteContent = (contentId: string, title: string) => {
    Alert.alert(
      'מחק קובץ',
      `האם אתה בטוח שברצונך למחוק את "${title}"?`,
      [
        {
          text: 'ביטול',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'מחק',
          onPress: async () => {
            try {
              await deleteContent(contentId);
              await loadContent();
              Alert.alert('הצלחה', 'הקובץ נמחק בהצלחה');
            } catch (err) {
              Alert.alert('שגיאה', 'לא הצלח למחוק את הקובץ');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleDeleteStudySet = (setId: string, title: string) => {
    Alert.alert(
      'מחק מערך תרגול',
      `האם אתה בטוח שברצונך למחוק את "${title}"?`,
      [
        {
          text: 'ביטול',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'מחק',
          onPress: async () => {
            try {
              await deleteStudySet(setId);
              await loadContent();
              Alert.alert('הצלחה', 'מערך התרגול נמחק בהצלחה');
            } catch (err) {
              Alert.alert('שגיאה', 'לא הצלח למחוק את מערך התרגול');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Ionicons name="hourglass" size={16} color="#FF9800" />;
      case 'completed':
        return <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />;
      case 'failed':
        return <Ionicons name="close-circle" size={16} color="#f44336" />;
      default:
        return <Ionicons name="help-circle" size={16} color={Colors.gray} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'processing':
        return 'בעיבוד';
      case 'completed':
        return 'הושלם';
      case 'failed':
        return 'נכשל';
      default:
        return 'לא ידוע';
    }
  };

  const renderContentItem = (item: UploadedContent) => (
    <View style={styles.contentCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitle}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.subject}>{item.subject}</Text>
        </View>
        <View style={styles.statusBadge}>
          {getStatusIcon(item.status)}
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="document" size={14} color={Colors.gray} />
          <Text style={styles.detailText}>
            {item.fileType === 'pdf'
              ? 'PDF'
              : item.fileType === 'text'
              ? 'טקסט'
              : item.fileType === 'document'
              ? 'מסמך'
              : 'תמונה'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={14} color={Colors.gray} />
          <Text style={styles.detailText}>
            {new Date(item.uploadedAt).toLocaleDateString('he-IL')}
          </Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            // Find related study set
            const relatedSet = studySets.find((s) => s.contentId === item.id);
            if (relatedSet) {
              router.push(`/study-set?setId=${relatedSet.id}`);
            } else {
              Alert.alert('הודעה', 'עדיין לא נוצרו תרגילים לקובץ זה');
            }
          }}
        >
          <Ionicons name="play-circle" size={18} color={Colors.accent} />
          <Text style={styles.actionButtonText}>לימוד</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteContent(item.id, item.title)}
        >
          <Ionicons name="trash" size={18} color="#f44336" />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>מחק</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStudySetItem = (item: StudySet) => (
    <View style={styles.contentCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitle}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.subject}>{item.subject}</Text>
        </View>
        <View style={styles.exerciseCount}>
          <Ionicons name="list" size={16} color={Colors.accent} />
          <Text style={styles.countText}>{item.exercises?.length || 0}</Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="checkmark-circle" size={14} color={Colors.gray} />
          <Text style={styles.detailText}>
            {item.completedExercises || 0} / {item.totalExercises} הושלמו
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={14} color={Colors.gray} />
          <Text style={styles.detailText}>
            {new Date(item.createdAt).toLocaleDateString('he-IL')}
          </Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${((item.completedExercises || 0) / (item.totalExercises || 1)) * 100}%`,
            },
          ]}
        />
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/study-set?setId=${item.id}`)}
        >
          <Ionicons name="play-circle" size={18} color={Colors.accent} />
          <Text style={styles.actionButtonText}>המשך לימוד</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteStudySet(item.id, item.title)}
        >
          <Ionicons name="trash" size={18} color="#f44336" />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>מחק</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>טוען את הקבצים שלך...</Text>
      </View>
    );
  }

  const hasContent = uploadedContents && uploadedContents.length > 0;
  const hasStudySets = studySets && studySets.length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>הקבצים שלי</Text>
        <Text style={styles.headerSubtitle}>צפה בכל הקבצים והתרגילים שלך</Text>
      </View>

      {/* Uploaded Contents Section */}
      {hasContent && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={20} color={Colors.accent} />
            <Text style={styles.sectionTitle}>קבצים שהעלויו ({uploadedContents.length})</Text>
          </View>
          {uploadedContents.map((item) => (
            <React.Fragment key={item.id}>
              {renderContentItem(item)}
            </React.Fragment>
          ))}
        </View>
      )}

      {/* Study Sets Section */}
      {hasStudySets && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school" size={20} color={Colors.accent} />
            <Text style={styles.sectionTitle}>מערכות תרגול ({studySets.length})</Text>
          </View>
          {studySets.map((item) => (
            <React.Fragment key={item.id}>
              {renderStudySetItem(item)}
            </React.Fragment>
          ))}
        </View>
      )}

      {/* Empty State */}
      {!hasContent && !hasStudySets && (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={80} color={Colors.lightGray} />
          <Text style={styles.emptyTitle}>אין לך קבצים עדיין</Text>
          <Text style={styles.emptyText}>
            היא לך קבצים או טקסט בחדש בטאב "העלאה" כדי להתחיל ללמוד
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/(tabs)/upload')}
          >
            <Ionicons name="cloud-upload" size={20} color="white" />
            <Text style={styles.emptyButtonText}>עלה קובץ</Text>
          </TouchableOpacity>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#f44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadContent}>
            <Text style={styles.retryButtonText}>נסה שוב</Text>
          </TouchableOpacity>
        </View>
      )}

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
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textDark,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
  },
  contentCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
  },
  subject: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    color: Colors.gray,
    fontWeight: '500',
  },
  exerciseCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFF3E0',
    borderRadius: 6,
  },
  countText: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '600',
  },
  cardDetails: {
    gap: 6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 11,
    color: Colors.gray,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 3,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.accent,
    gap: 4,
  },
  deleteButton: {
    borderColor: '#f44336',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accent,
  },
  deleteButtonText: {
    color: '#f44336',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textDark,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.accent,
    borderRadius: 8,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  errorContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f44336',
    borderRadius: 6,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 12,
  },
});

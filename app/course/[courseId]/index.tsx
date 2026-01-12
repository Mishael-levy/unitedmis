import AppError from '@/components/AppError';
import AppLoading from '@/components/AppLoading';
import LessonTree from '@/components/Course/LessonTree';
import NoItem from '@/components/NoItem';
import BackArrow from '@/components/ui/BackArrow';
import useCourseStore from '@/stores/courseStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { isCustomCourse } from '@/types/data';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

const CourseDetails = () => {
  const { courseId } = useLocalSearchParams();
  const router = useRouter();

  const { course, localCourses, loading, error, fetchCourse, getLocalCourse, deleteCourse } = useCourseStore();

  useEffect(() => {
    if (typeof courseId === 'string') {
      // Check if it's a local course first
      if (courseId.startsWith('local-course-')) {
        const localCourse = getLocalCourse(courseId);
        if (localCourse) {
          // Local course found, it will be set by fetchCourse
          fetchCourse(courseId);
          return;
        }
      }
      // Fetch from Firebase
      fetchCourse(courseId);
    }
  }, [courseId, fetchCourse]);

  const handleDeleteCourse = async () => {
    console.log('Delete button pressed, courseId:', courseId);
    console.log('Course:', course?.title);
    
    if (!course || typeof courseId !== 'string') {
      console.log('Early return - no course or invalid courseId');
      return;
    }

    const confirmDelete = async () => {
      if (Platform.OS === 'web') {
        return window.confirm(`האם אתה בטוח שברצונך למחוק את הקורס "${course.title}"?`);
      }
      return new Promise<boolean>((resolve) => {
        Alert.alert(
          'מחיקת קורס',
          `האם אתה בטוח שברצונך למחוק את הקורס "${course.title}"?`,
          [
            { text: 'ביטול', style: 'cancel', onPress: () => resolve(false) },
            { text: 'מחק', style: 'destructive', onPress: () => resolve(true) },
          ]
        );
      });
    };

    const confirmed = await confirmDelete();
    console.log('Confirmed:', confirmed);
    if (!confirmed) return;

    try {
      console.log('Calling deleteCourse with:', courseId);
      await deleteCourse(courseId);
      console.log('Course deleted successfully');
      
      if (Platform.OS === 'web') {
        alert('הקורס נמחק בהצלחה');
      } else {
        Alert.alert('הצלחה', 'הקורס נמחק בהצלחה');
      }
      
      router.back();
    } catch (err) {
      console.error('Error deleting course:', err);
      Alert.alert('שגיאה', 'לא הצלחנו למחוק את הקורס');
    }
  };

  if (loading) return <AppLoading />;
  if (error) return <AppError error={error} />;
  if (!course) return <NoItem text={'אין קורס כזה כרגע'} />;

  // Check if this is a custom course for display purposes
  const isCustom = isCustomCourse(course);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackArrow />
        {isCustom && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteCourse}>
            <Ionicons name="trash-outline" size={22} color="#f44336" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.title}>{course.title}</Text>
      {isCustom && (
        <Text style={styles.customBadge}>קורס מותאם אישית</Text>
      )}
      <LessonTree {...course} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7FB',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  customBadge: {
    fontSize: 14,
    color: '#8b5cf6',
    marginBottom: 16,
    fontWeight: '500',
  },
});

export default CourseDetails;

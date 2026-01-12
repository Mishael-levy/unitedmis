import { create } from 'zustand';
import { collection, doc, getDoc, getDocs, addDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import { Course, Lesson, CustomCourse, AnyCourse, isCustomCourse } from '@/types/data';
import { db } from '@/configs/FirebaseConfig';

interface CourseState {
  course: AnyCourse | null;
  courses: Course[] | null;
  localCourses: CustomCourse[]; // For guest mode and custom courses
  loading: boolean;
  error: string | null;
  fetchCourse: (id: string) => Promise<void>;
  fetchAllCourses: () => Promise<void>;
  createLocalCourse: (course: Omit<CustomCourse, 'id'>) => string;
  createCourse: (course: Omit<CustomCourse, 'id'>, lessons: Omit<Lesson, 'id'>[]) => Promise<string>;
  deleteLocalCourse: (id: string) => void;
  deleteCourse: (id: string) => Promise<void>;
  getLocalCourse: (id: string) => CustomCourse | null;
  removeLessonByStudySetId: (studySetId: string) => void;
}

const useCourseStore = create<CourseState>((set, get) => ({
  course: null,
  courses: null,
  localCourses: [],
  loading: false,
  error: null,

  fetchCourse: async (id) => {
    // First check if it's a local course
    if (id.startsWith('local-course-')) {
      const localCourse = get().localCourses.find(c => c.id === id);
      if (localCourse) {
        set({ course: localCourse, loading: false });
        return;
      }
    }

    set({ loading: true, error: null });
    try {
      const courseDoc = doc(db, 'courses', id);
      const courseSnapshot = await getDoc(courseDoc);

      if (courseSnapshot.exists()) {
        const courseData = courseSnapshot.data();
        const lessonIds: string[] = courseData.lessons || []; // Assuming `lessons` is an array of lesson IDs in courseData

        // Fetch lessons by IDs
        const lessons: Lesson[] = [];
        for (const lessonId of lessonIds) {
          const lessonDoc = doc(db, 'lessons', lessonId);
          const lessonSnapshot = await getDoc(lessonDoc);

          if (lessonSnapshot.exists()) {
            lessons.push({
              id: lessonSnapshot.id,
              ...(lessonSnapshot.data() as Omit<Lesson, 'id'>),
            });
          }
        }

        const course: Course = {
          id: courseSnapshot.id,
          ...(courseData as Omit<Course, 'id' | 'lessons'>), // Exclude `lessons` field to avoid duplication
          lessons: lessons,
        };

        set({
          course: course,
          loading: false,
        });
      } else {
        set({ error: 'Course not found.', loading: false });
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({ error: error.message, loading: false });
      } else {
        set({ error: 'An unexpected error occurred.', loading: false });
      }
    }
  },

  fetchAllCourses: async () => {
    set({ loading: true, error: null });
    try {
      const coursesCollection = collection(db, 'courses');
      const coursesSnapshot = await getDocs(coursesCollection);

      const courses: Course[] = [];

      for (const courseDoc of coursesSnapshot.docs) {
        const courseData = courseDoc.data();
        const lessonIds: string[] = courseData.lessons || []; // Assuming `lessons` is an array of lesson IDs in courseData

        // Fetch lessons for each course
        const lessons: Lesson[] = [];
        for (const lessonId of lessonIds) {
          const lessonDoc = doc(db, 'lessons', lessonId);
          const lessonSnapshot = await getDoc(lessonDoc);

          if (lessonSnapshot.exists()) {
            lessons.push({
              id: lessonSnapshot.id,
              ...(lessonSnapshot.data() as Omit<Lesson, 'id'>),
            });
          }
        }

        courses.push({
          id: courseDoc.id,
          ...(courseData as Omit<Course, 'id' | 'lessons'>),
          lessons: lessons,
        });
      }

      set({ courses: courses, loading: false });
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({ error: error.message, loading: false });
      } else {
        set({ error: 'An unexpected error occurred.', loading: false });
      }
    }
  },

  // Create a local course (for guests or immediate use)
  createLocalCourse: (courseData) => {
    const id = `local-course-${Date.now()}`;
    const newCourse: CustomCourse = {
      ...courseData,
      id,
    };
    
    set((state) => ({
      localCourses: [...state.localCourses, newCourse],
      course: newCourse,
    }));
    
    return id;
  },

  // Create a course in Firebase (for authenticated users)
  createCourse: async (courseData, lessons) => {
    set({ loading: true, error: null });
    try {
      const batch = writeBatch(db);
      
      // Create lessons first and collect their IDs
      const lessonIds: string[] = [];
      for (const lesson of lessons) {
        const lessonRef = doc(collection(db, 'lessons'));
        // Filter out undefined values and the old 'id' field - Firebase will use its own ID
        const lessonToSave = Object.fromEntries(
          Object.entries(lesson).filter(([key, v]) => v !== undefined && key !== 'id')
        );
        batch.set(lessonRef, lessonToSave);
        lessonIds.push(lessonRef.id);
      }
      
      // Create course with lesson IDs
      const courseRef = doc(collection(db, 'courses'));
      const courseToSave = {
        title: courseData.title,
        description: courseData.description,
        coverColor: courseData.coverColor,
        image: courseData.image || '',
        isCustom: true,
        userId: courseData.userId,
        createdAt: courseData.createdAt,
        studySetIds: courseData.studySetIds,
        lessons: lessonIds,
      };
      batch.set(courseRef, courseToSave);
      
      await batch.commit();
      
      // Also add to local courses for immediate display
      const fullCourse: CustomCourse = {
        ...courseData,
        id: courseRef.id,
        lessons: lessons.map((l, i) => ({ ...l, id: lessonIds[i] })),
      };
      
      set((state) => ({
        localCourses: [...state.localCourses, fullCourse],
        course: fullCourse,
        loading: false,
      }));
      
      return courseRef.id;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create course';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  // Delete a local course
  deleteLocalCourse: (id) => {
    set((state) => ({
      localCourses: state.localCourses.filter(c => c.id !== id),
    }));
  },

  // Delete a course (handles both local and Firebase)
  deleteCourse: async (id) => {
    // If it's a local course, delete locally
    if (id.startsWith('local-course-')) {
      set((state) => ({
        localCourses: state.localCourses.filter(c => c.id !== id),
        course: state.course?.id === id ? null : state.course,
      }));
      return;
    }
    
    // Otherwise delete from Firebase
    try {
      set({ loading: true, error: null });
      
      // First get the course to find its lessons
      const courseDoc = doc(db, 'courses', id);
      const courseSnapshot = await getDoc(courseDoc);
      
      if (courseSnapshot.exists()) {
        const courseData = courseSnapshot.data();
        const lessonIds: string[] = courseData.lessons || [];
        
        // Delete all lessons
        for (const lessonId of lessonIds) {
          const lessonDoc = doc(db, 'lessons', lessonId);
          await deleteDoc(lessonDoc);
        }
        
        // Delete the course
        await deleteDoc(courseDoc);
      }
      
      // Also remove from local state if it's there
      set((state) => ({
        localCourses: state.localCourses.filter(c => c.id !== id),
        course: state.course?.id === id ? null : state.course,
        loading: false,
      }));
      
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete course';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  // Get a local course by ID
  getLocalCourse: (id) => {
    return get().localCourses.find(c => c.id === id) || null;
  },

  // Remove lessons that reference a deleted study set
  removeLessonByStudySetId: (studySetId) => {
    set((state) => {
      const updatedCourses = state.localCourses.map(course => {
        // Filter out lessons that reference the deleted study set
        const updatedLessons = course.lessons.filter(
          lesson => lesson.studySetId !== studySetId
        );
        
        // Also update studySetIds array
        const updatedStudySetIds = course.studySetIds.filter(id => id !== studySetId);
        
        return {
          ...course,
          lessons: updatedLessons,
          studySetIds: updatedStudySetIds,
          description: `קורס מותאם אישית עם ${updatedLessons.length} שיעורים`,
        };
      }).filter(course => course.lessons.length > 0); // Remove courses with no lessons
      
      return { localCourses: updatedCourses };
    });
  },
}));

export default useCourseStore;

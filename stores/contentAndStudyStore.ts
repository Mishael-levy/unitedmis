import { create } from 'zustand';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  getDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/configs/FirebaseConfig';
import {
  UploadedContent,
  StudySet,
  GeneratedExercise,
  UserProgress,
} from '@/types/ai-learning';

interface ContentAndStudyState {
  // Uploaded Content
  uploadedContents: UploadedContent[];
  currentContent: UploadedContent | null;

  // Study Sets
  studySets: StudySet[];
  currentSet: StudySet | null;

  // User Progress
  userProgress: UserProgress[];

  // State
  loading: boolean;
  error: string | null;

  // Content Methods
  uploadContent: (content: Omit<UploadedContent, 'id'>) => Promise<string>;
  fetchUserContents: (userId: string) => Promise<void>;
  fetchContent: (contentId: string) => Promise<void>;
  deleteContent: (contentId: string) => Promise<void>;
  updateContentStatus: (
    contentId: string,
    status: UploadedContent['status'],
    error?: string
  ) => Promise<void>;

  // Study Set Methods
  createStudySet: (set: Omit<StudySet, 'id'>) => Promise<string>;
  fetchUserStudySets: (userId: string) => Promise<void>;
  fetchStudySet: (setId: string) => Promise<void>;
  deleteStudySet: (setId: string) => Promise<void>;
  updateStudySet: (setId: string, updates: Partial<StudySet>) => Promise<void>;

  // Progress Methods
  recordProgress: (progress: UserProgress) => Promise<void>;
  fetchUserProgress: (userId: string, setId: string) => Promise<void>;
  getExerciseProgress: (
    userId: string,
    exerciseId: string
  ) => Promise<UserProgress | null>;
}

const useContentAndStudyStore = create<ContentAndStudyState>((set, get) => ({
  uploadedContents: [],
  currentContent: null,
  studySets: [],
  currentSet: null,
  userProgress: [],
  loading: false,
  error: null,

  // ============ CONTENT METHODS ============

  uploadContent: async (content) => {
    try {
      set({ loading: true, error: null });
      const contentRef = await addDoc(collection(db, 'uploadedContents'), {
        ...content,
        uploadedAt: Date.now(),
        status: 'processing',
      });
      set((state) => ({
        uploadedContents: [
          ...state.uploadedContents,
          { id: contentRef.id, ...content, uploadedAt: Date.now(), status: 'processing' },
        ],
      }));
      return contentRef.id;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Upload failed';
      set({ error: errorMsg });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchUserContents: async (userId) => {
    try {
      set({ loading: true, error: null });
      const q = query(
        collection(db, 'uploadedContents'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const contents = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UploadedContent[];
      set({ uploadedContents: contents });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch contents';
      set({ error: errorMsg });
    } finally {
      set({ loading: false });
    }
  },

  fetchContent: async (contentId) => {
    try {
      set({ loading: true, error: null });
      const docRef = doc(db, 'uploadedContents', contentId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        set({ currentContent: { id: snapshot.id, ...snapshot.data() } as UploadedContent });
      } else {
        set({ error: 'Content not found' });
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch content';
      set({ error: errorMsg });
    } finally {
      set({ loading: false });
    }
  },

  deleteContent: async (contentId) => {
    try {
      set({ loading: true, error: null });
      // Delete content and associated study sets
      const docRef = doc(db, 'uploadedContents', contentId);
      const setsQuery = query(
        collection(db, 'studySets'),
        where('contentId', '==', contentId)
      );
      const setsSnapshot = await getDocs(setsQuery);

      const batch = writeBatch(db);
      batch.delete(docRef);
      setsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      set((state) => ({
        uploadedContents: state.uploadedContents.filter((c) => c.id !== contentId),
      }));
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete content';
      set({ error: errorMsg });
    } finally {
      set({ loading: false });
    }
  },

  updateContentStatus: async (contentId, status, error) => {
    try {
      const docRef = doc(db, 'uploadedContents', contentId);
      const updateData: any = { status };
      if (error) updateData.processingError = error;
      await updateDoc(docRef, updateData);

      set((state) => ({
        uploadedContents: state.uploadedContents.map((c) =>
          c.id === contentId ? { ...c, status, processingError: error } : c
        ),
      }));
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to update status';
      set({ error: errorMsg });
    }
  },

  // ============ STUDY SET METHODS ============

  createStudySet: async (studySet) => {
    try {
      set({ loading: true, error: null });
      const setRef = await addDoc(collection(db, 'studySets'), {
        ...studySet,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      set((state) => ({
        studySets: [
          ...state.studySets,
          { id: setRef.id, ...studySet, createdAt: Date.now(), updatedAt: Date.now() },
        ],
      }));
      return setRef.id;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create study set';
      set({ error: errorMsg });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchUserStudySets: async (userId) => {
    try {
      set({ loading: true, error: null });
      const q = query(collection(db, 'studySets'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const sets = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as StudySet[];
      set({ studySets: sets });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch study sets';
      set({ error: errorMsg });
    } finally {
      set({ loading: false });
    }
  },

  fetchStudySet: async (setId) => {
    try {
      set({ loading: true, error: null });
      const docRef = doc(db, 'studySets', setId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        set({ currentSet: { id: snapshot.id, ...snapshot.data() } as StudySet });
      } else {
        set({ error: 'Study set not found' });
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch study set';
      set({ error: errorMsg });
    } finally {
      set({ loading: false });
    }
  },

  deleteStudySet: async (setId) => {
    try {
      set({ loading: true, error: null });
      const docRef = doc(db, 'studySets', setId);
      await deleteDoc(docRef);
      set((state) => ({
        studySets: state.studySets.filter((s) => s.id !== setId),
      }));
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete study set';
      set({ error: errorMsg });
    } finally {
      set({ loading: false });
    }
  },

  updateStudySet: async (setId, updates) => {
    try {
      const docRef = doc(db, 'studySets', setId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Date.now(),
      });
      set((state) => ({
        studySets: state.studySets.map((s) =>
          s.id === setId ? { ...s, ...updates, updatedAt: Date.now() } : s
        ),
      }));
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to update study set';
      set({ error: errorMsg });
    }
  },

  // ============ PROGRESS METHODS ============

  recordProgress: async (progress) => {
    try {
      const progressRef = await addDoc(collection(db, 'userProgress'), progress);
      set((state) => ({
        userProgress: [...state.userProgress, { ...progress, id: progressRef.id }],
      }));
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to record progress';
      set({ error: errorMsg });
    }
  },

  fetchUserProgress: async (userId, setId) => {
    try {
      set({ loading: true, error: null });
      const q = query(
        collection(db, 'userProgress'),
        where('userId', '==', userId),
        where('setId', '==', setId)
      );
      const snapshot = await getDocs(q);
      const progress = snapshot.docs.map((doc) => ({
        ...doc.data(),
      })) as UserProgress[];
      set({ userProgress: progress });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch progress';
      set({ error: errorMsg });
    } finally {
      set({ loading: false });
    }
  },

  getExerciseProgress: async (userId, exerciseId) => {
    try {
      const q = query(
        collection(db, 'userProgress'),
        where('userId', '==', userId),
        where('exerciseId', '==', exerciseId)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return snapshot.docs[0].data() as UserProgress;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch exercise progress';
      set({ error: errorMsg });
      return null;
    }
  },
}));

export { useContentAndStudyStore };

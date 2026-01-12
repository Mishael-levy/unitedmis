export interface EventProps {
  id: string;
  name: string;
  description: string;
  location: string;
  emoji: string;
  date: string;
  time: string;
}
export interface Badge {
  id: number;
  title: string;
  icon: string;
}
export interface UserProf { 
    name : string;
    email : string;
    gems : number;
    hearts : number;
    streak : number; // Date.now
    avatar : string;
    progress : string[];
    xp : number;
    badges : Badge[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  image: string;
  lessons: Lesson[];
}

// Custom course created by user from uploaded content
export interface CustomCourse extends Omit<Course, 'image'> {
  coverColor: string;
  image?: string; // Optional for future use
  isCustom: true;
  userId: string;
  createdAt: number;
  studySetIds: string[]; // IDs of study sets used to create this course
}

// Union type for any course
export type AnyCourse = Course | CustomCourse;

// Type guard to check if course is custom
export function isCustomCourse(course: AnyCourse): course is CustomCourse {
  return 'isCustom' in course && course.isCustom === true;
}

export interface Lesson {
  id: string;
  name?: string;
  icon: string;
  color: string;
  exercises: Exercise[];
  // For custom lessons with dynamic exercise generation
  originalContent?: string;
  subject?: string;
  studySetId?: string; // Reference to source study set
}

export interface Exercise {
  id: string;
  type: 'text-to-text' | 'text-to-image' | 'image-to-text' | 'image-to-image' | 'fill-blank' | 'true-false';
  answers: string[];
  correct: number | string; // number for choice, string for fill-blank
  question: string; //| Image;
  subQuestion?: string;
}

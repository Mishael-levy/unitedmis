import { View, ScrollView } from 'react-native';
import React from 'react';
import { Course } from '@/types/data';
import LessonNode from './LessonNode';
import { useAuthStore } from '@/stores/authStore';

export default function LessonTree({ lessons, id }: { lessons: Course['lessons']; id: string }) {
  const user = useAuthStore((state) => state.user);

  const handleDisabled = (lessonId: string, key: number, lessons: Course['lessons']) => {
    if (!user) return true; // Disable if no user is logged in

    const isLessonCompleted = user.progress.includes(lessonId);
    
    if (key === 0) return false;

    const previousLesson = lessons[key - 1];
    const isPreviousLessonCompleted =
      previousLesson && user.progress.includes(previousLesson.id);

    return !(isLessonCompleted || isPreviousLessonCompleted);
  };

  return (
    <ScrollView
      contentContainerStyle={{
        margin: 10,
        marginTop: 20,
        paddingBottom: 50,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {lessons.map((item, key) => {
        const step = 70;
        const snakeMargin = step * Math.abs((key % 4) - 2) - step;

        return (
          <View key={key} style={{ marginLeft: snakeMargin }}>
            <LessonNode
              {...item}
              courseId={id}
              disabled={handleDisabled(item.id, key, lessons)}
            />
          </View>
        );
      })}
    </ScrollView>
  );
}
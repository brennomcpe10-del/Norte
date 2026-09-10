import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  getDocs,
  writeBatch,
  getDoc,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  CategoryItem,
  DailyLog,
  FailureReason,
  FixedRoutineItem,
  JournalEntry,
  SyncStatus,
  UserObjective,
  UserProfile,
  UserTask,
} from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_INITIAL_ROUTINE } from '../constants/defaults';
import { getTodayString } from '../utils/dateUtils';

export class FirestoreService {
  // Subscribe to all tasks
  static subscribeTasks(
    userId: string,
    onSuccess: (tasks: UserTask[]) => void,
    onError?: (error: Error) => void
  ) {
    const colRef = collection(db, 'users', userId, 'tasks');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const tasks: UserTask[] = [];
        snapshot.forEach((docSnap) => {
          tasks.push({ id: docSnap.id, ...(docSnap.data() as Omit<UserTask, 'id'>) });
        });
        onSuccess(tasks);
      },
      (err) => {
        console.error('Firestore tasks error:', err);
        if (onError) onError(err);
      }
    );
  }

  // Save / Update Task
  static async saveTask(userId: string, task: Partial<UserTask> & { id?: string }): Promise<string> {
    const now = new Date().toISOString();
    const taskId = task.id || `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const docRef = doc(db, 'users', userId, 'tasks', taskId);

    const data: Record<string, any> = {
      ...task,
      id: taskId,
      updatedAt: now,
    };

    if (!task.createdAt) {
      data.createdAt = now;
    }
    if (!task.status) {
      data.status = 'inbox';
    }

    // Clean undefined fields so Firestore doesn't reject
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    await setDoc(docRef, data, { merge: true });
    return taskId;
  }

  // Mark task completed
  static async completeTask(userId: string, task: UserTask): Promise<void> {
    const now = new Date().toISOString();
    const docRef = doc(db, 'users', userId, 'tasks', task.id);
    await updateDoc(docRef, {
      status: 'completed',
      completedAt: now,
      updatedAt: now,
    });

    // If task is recurring, automatically spawn the next cycle without erasing history
    if (task.isRecurring && task.recurrenceRule) {
      const nextDate = new Date();
      if (task.recurrenceRule === 'weekly') {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (task.recurrenceRule === 'biweekly') {
        nextDate.setDate(nextDate.getDate() + 14);
      } else {
        nextDate.setDate(nextDate.getDate() + 1);
      }
      const yyyy = nextDate.getFullYear();
      const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dd = String(nextDate.getDate()).padStart(2, '0');
      const nextPlannedDate = `${yyyy}-${mm}-${dd}`;

      await this.saveTask(userId, {
        title: task.title,
        category: task.category,
        status: 'planned',
        plannedDate: nextPlannedDate,
        isRecurring: true,
        recurrenceRule: task.recurrenceRule,
        recurrenceParentId: task.recurrenceParentId || task.id,
        notes: task.notes,
        objectiveId: task.objectiveId,
      });
    }
  }

  // Register task not completed with reason (Failure Reason)
  static async registerTaskIncomplete(
    userId: string,
    task: UserTask,
    reason: FailureReason,
    notes?: string,
    replanDate?: string | null
  ): Promise<void> {
    const now = new Date().toISOString();
    const docRef = doc(db, 'users', userId, 'tasks', task.id);

    const postponedCount = (task.postponedCount || 0) + 1;
    const originalPlannedDate = task.originalPlannedDate || task.plannedDate;

    if (replanDate) {
      // Postponed to a new date
      await updateDoc(docRef, {
        status: 'planned',
        plannedDate: replanDate,
        originalPlannedDate,
        postponedCount,
        failureReason: reason,
        failureNotes: notes || '',
        updatedAt: now,
      });
    } else {
      // Marked as not completed for this day
      await updateDoc(docRef, {
        status: 'not_completed',
        originalPlannedDate,
        postponedCount,
        failureReason: reason,
        failureNotes: notes || '',
        updatedAt: now,
      });
    }
  }

  // Delete task
  static async deleteTask(userId: string, taskId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'tasks', taskId);
    await deleteDoc(docRef);
  }

  // Batch update task plan dates
  static async batchAssignTaskDates(
    userId: string,
    assignments: { taskId: string; assignedDate: string }[]
  ): Promise<void> {
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    assignments.forEach(({ taskId, assignedDate }) => {
      const docRef = doc(db, 'users', userId, 'tasks', taskId);
      batch.update(docRef, {
        status: 'planned',
        plannedDate: assignedDate,
        updatedAt: now,
      });
    });

    await batch.commit();
  }

  // Subscribe Routine
  static subscribeRoutine(
    userId: string,
    onSuccess: (routine: FixedRoutineItem[]) => void,
    onError?: (error: Error) => void
  ) {
    const colRef = collection(db, 'users', userId, 'routine');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: FixedRoutineItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as Omit<FixedRoutineItem, 'id'>) });
        });
        onSuccess(items);
      },
      onError
    );
  }

  static async saveRoutineItem(userId: string, item: Partial<FixedRoutineItem> & { id?: string }): Promise<void> {
    const id = item.id || `routine-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const docRef = doc(db, 'users', userId, 'routine', id);
    await setDoc(docRef, { ...item, id }, { merge: true });
  }

  static async deleteRoutineItem(userId: string, itemId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'routine', itemId);
    await deleteDoc(docRef);
  }

  // Subscribe Daily Logs (Sleep, Energy, Mood, Bad Day)
  static subscribeDailyLogs(
    userId: string,
    onSuccess: (logs: DailyLog[]) => void,
    onError?: (error: Error) => void
  ) {
    const colRef = collection(db, 'users', userId, 'dailyLogs');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const logs: DailyLog[] = [];
        snapshot.forEach((docSnap) => {
          logs.push({ id: docSnap.id, ...(docSnap.data() as Omit<DailyLog, 'id'>) });
        });
        onSuccess(logs);
      },
      onError
    );
  }

  static async saveDailyLog(userId: string, log: Partial<DailyLog> & { date: string }): Promise<void> {
    const docRef = doc(db, 'users', userId, 'dailyLogs', log.date);
    const now = new Date().toISOString();
    const data = {
      ...log,
      id: log.date,
      updatedAt: now,
    };
    Object.keys(data).forEach((k) => (data as any)[k] === undefined && delete (data as any)[k]);
    await setDoc(docRef, data, { merge: true });
  }

  // Subscribe Journal
  static subscribeJournal(
    userId: string,
    onSuccess: (entries: JournalEntry[]) => void,
    onError?: (error: Error) => void
  ) {
    const colRef = collection(db, 'users', userId, 'journal');
    return onSnapshot(
      query(colRef, orderBy('createdAt', 'desc')),
      (snapshot) => {
        const entries: JournalEntry[] = [];
        snapshot.forEach((docSnap) => {
          entries.push({ id: docSnap.id, ...(docSnap.data() as Omit<JournalEntry, 'id'>) });
        });
        onSuccess(entries);
      },
      onError
    );
  }

  static async saveJournalEntry(userId: string, entry: Partial<JournalEntry> & { id?: string }): Promise<string> {
    const now = new Date().toISOString();
    const id = entry.id || `journal-${Date.now()}`;
    const docRef = doc(db, 'users', userId, 'journal', id);
    const data = {
      ...entry,
      id,
      updatedAt: now,
      createdAt: entry.createdAt || now,
    };
    await setDoc(docRef, data, { merge: true });
    return id;
  }

  static async deleteJournalEntry(userId: string, entryId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'journal', entryId);
    await deleteDoc(docRef);
  }

  // Subscribe Categories
  static subscribeCategories(
    userId: string,
    onSuccess: (cats: CategoryItem[]) => void,
    onError?: (error: Error) => void
  ) {
    const colRef = collection(db, 'users', userId, 'categories');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: CategoryItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as Omit<CategoryItem, 'id'>) });
        });
        if (items.length === 0) {
          // If empty, return default categories
          onSuccess(DEFAULT_CATEGORIES);
        } else {
          onSuccess(items);
        }
      },
      onError
    );
  }

  static async saveCategory(userId: string, cat: CategoryItem): Promise<void> {
    const docRef = doc(db, 'users', userId, 'categories', cat.id);
    await setDoc(docRef, cat, { merge: true });
  }

  static async deleteCategory(userId: string, catId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'categories', catId);
    await deleteDoc(docRef);
  }

  // Subscribe Objectives
  static subscribeObjectives(
    userId: string,
    onSuccess: (objs: UserObjective[]) => void,
    onError?: (error: Error) => void
  ) {
    const colRef = collection(db, 'users', userId, 'objectives');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: UserObjective[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as Omit<UserObjective, 'id'>) });
        });
        onSuccess(items);
      },
      onError
    );
  }

  static async saveObjective(userId: string, obj: Partial<UserObjective> & { id?: string }): Promise<void> {
    const id = obj.id || `obj-${Date.now()}`;
    const docRef = doc(db, 'users', userId, 'objectives', id);
    const now = new Date().toISOString();
    const data = {
      ...obj,
      id,
      active: obj.active !== undefined ? obj.active : true,
      createdAt: obj.createdAt || now,
    };
    await setDoc(docRef, data, { merge: true });
  }

  static async deleteObjective(userId: string, objId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'objectives', objId);
    await deleteDoc(docRef);
  }

  // User Profile
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'users', userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  }

  static async saveUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
    const docRef = doc(db, 'users', userId);
    const now = new Date().toISOString();
    await setDoc(docRef, { ...profile, uid: userId, updatedAt: now }, { merge: true });
  }

  // Bootstrap initial user data on first sign-up / onboarding
  static async initializeFirstTimeUser(userId: string, email: string, displayName: string): Promise<void> {
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    // User profile doc
    const userDoc = doc(db, 'users', userId);
    batch.set(userDoc, {
      uid: userId,
      email: email || '',
      displayName: displayName || email.split('@')[0] || 'Usuário',
      onboarded: false,
      createdAt: now,
      updatedAt: now,
    });

    // Default categories
    DEFAULT_CATEGORIES.forEach((cat) => {
      const catDoc = doc(db, 'users', userId, 'categories', cat.id);
      batch.set(catDoc, cat);
    });

    // Default routine (Escola de seg a sex)
    DEFAULT_INITIAL_ROUTINE.forEach((r, idx) => {
      const rDoc = doc(db, 'users', userId, 'routine', `default-routine-${idx}`);
      batch.set(rDoc, { ...r, id: `default-routine-${idx}` });
    });

    await batch.commit();
  }

  // Export all user data as clean structured JSON
  static async exportAllUserData(userId: string): Promise<Record<string, any>> {
    const profile = await this.getUserProfile(userId);

    const getCol = async (sub: string) => {
      const snap = await getDocs(collection(db, 'users', userId, sub));
      const list: any[] = [];
      snap.forEach((d) => list.push(d.data()));
      return list;
    };

    const [tasks, routine, dailyLogs, journal, categories, objectives] = await Promise.all([
      getCol('tasks'),
      getCol('routine'),
      getCol('dailyLogs'),
      getCol('journal'),
      getCol('categories'),
      getCol('objectives'),
    ]);

    return {
      version: 'meu-norte-v1',
      exportedAt: new Date().toISOString(),
      profile,
      tasks,
      routine,
      dailyLogs,
      journal,
      categories,
      objectives,
    };
  }

  // Seed sample tasks for initial demonstration (can be removed at any time)
  static async seedSampleData(userId: string): Promise<void> {
    const today = getTodayString();
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    const sampleTasks: Partial<UserTask>[] = [
      {
        id: `sample-1-${Date.now()}`,
        title: 'Fazer 15 questões de Matemática',
        category: 'Matemática',
        status: 'planned',
        plannedDate: today,
        notes: 'Foco em funções de 2º grau e gráficos',
      },
      {
        id: `sample-2-${Date.now()}`,
        title: 'Fazer introdução da redação',
        category: 'Redação',
        status: 'completed',
        completedAt: now,
        plannedDate: today,
        notes: 'Tema: Impactos da inteligência artificial na educação',
      },
      {
        id: `sample-3-${Date.now()}`,
        title: 'Ler capítulo 3 de Biologia',
        category: 'Biologia',
        status: 'planned',
        plannedDate: today,
        notes: 'Genética e leis de Mendel',
      },
      {
        id: `sample-4-${Date.now()}`,
        title: 'Trabalho de História sobre Revolução Industrial',
        category: 'História',
        status: 'inbox',
        notes: 'Entrega na próxima sexta',
      },
      {
        id: `sample-5-${Date.now()}`,
        title: 'Revisar fórmulas de Física',
        category: 'Física',
        status: 'inbox',
      },
    ];

    sampleTasks.forEach((t) => {
      const docRef = doc(db, 'users', userId, 'tasks', t.id!);
      batch.set(docRef, { ...t, createdAt: now, updatedAt: now });
    });

    // Sample daily log
    const logDoc = doc(db, 'users', userId, 'dailyLogs', today);
    batch.set(logDoc, {
      id: today,
      date: today,
      bedTime: '23:15',
      wakeTime: '06:45',
      sleepHours: 7.5,
      energy: 4,
      mood: 4,
      overload: 2,
      updatedAt: now,
    }, { merge: true });

    await batch.commit();
  }

  // Clear demo/sample data
  static async clearSampleData(userId: string): Promise<void> {
    const snap = await getDocs(collection(db, 'users', userId, 'tasks'));
    const batch = writeBatch(db);
    snap.forEach((d) => {
      if (d.id.startsWith('sample-')) {
        batch.delete(d.ref);
      }
    });
    await batch.commit();
  }
}

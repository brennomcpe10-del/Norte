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
  UserObjective,
  UserProfile,
  UserTask,
} from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_INITIAL_ROUTINE } from '../constants/defaults';
import { getTodayString } from '../utils/dateUtils';

// Local storage helper for guest mode
const isGuestUser = (userId: string) => !userId || userId.startsWith('guest-');

const getLocal = <T>(key: string, defaultValue: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setLocal = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('LocalStorage write error:', err);
  }
};

const triggerLocalUpdate = (userId: string, col: string) => {
  window.dispatchEvent(new CustomEvent(`meu_norte_${col}_${userId}`));
};

export class FirestoreService {
  // Subscribe to all tasks
  static subscribeTasks(
    userId: string,
    onSuccess: (tasks: UserTask[]) => void,
    onError?: (error: Error) => void
  ) {
    if (isGuestUser(userId)) {
      const key = `meu_norte_tasks_${userId}`;
      const deliver = () => {
        const tasks = getLocal<UserTask[]>(key, []);
        onSuccess(tasks);
      };
      deliver();
      const listener = () => deliver();
      window.addEventListener(`meu_norte_tasks_${userId}`, listener);
      return () => window.removeEventListener(`meu_norte_tasks_${userId}`, listener);
    }

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

    if (isGuestUser(userId)) {
      const key = `meu_norte_tasks_${userId}`;
      const tasks = getLocal<UserTask[]>(key, []);
      const idx = tasks.findIndex((t) => t.id === taskId);
      const existing = idx >= 0 ? tasks[idx] : null;
      const updated: UserTask = {
        title: '',
        category: 'Geral',
        status: 'inbox',
        createdAt: now,
        ...existing,
        ...task,
        id: taskId,
        updatedAt: now,
      } as UserTask;

      if (idx >= 0) {
        tasks[idx] = updated;
      } else {
        tasks.push(updated);
      }
      setLocal(key, tasks);
      triggerLocalUpdate(userId, 'tasks');
      return taskId;
    }

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

    if (isGuestUser(userId)) {
      const key = `meu_norte_tasks_${userId}`;
      const tasks = getLocal<UserTask[]>(key, []);
      const idx = tasks.findIndex((t) => t.id === task.id);
      if (idx >= 0) {
        tasks[idx] = {
          ...tasks[idx],
          status: 'completed',
          completedAt: now,
          updatedAt: now,
        };
        setLocal(key, tasks);
        triggerLocalUpdate(userId, 'tasks');
      }

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
      return;
    }

    const docRef = doc(db, 'users', userId, 'tasks', task.id);
    await updateDoc(docRef, {
      status: 'completed',
      completedAt: now,
      updatedAt: now,
    });

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
    const postponedCount = (task.postponedCount || 0) + 1;
    const originalPlannedDate = task.originalPlannedDate || task.plannedDate;

    if (isGuestUser(userId)) {
      const key = `meu_norte_tasks_${userId}`;
      const tasks = getLocal<UserTask[]>(key, []);
      const idx = tasks.findIndex((t) => t.id === task.id);
      if (idx >= 0) {
        tasks[idx] = {
          ...tasks[idx],
          status: replanDate ? 'planned' : 'not_completed',
          plannedDate: replanDate || tasks[idx].plannedDate,
          originalPlannedDate,
          postponedCount,
          failureReason: reason,
          failureNotes: notes || '',
          updatedAt: now,
        };
        setLocal(key, tasks);
        triggerLocalUpdate(userId, 'tasks');
      }
      return;
    }

    const docRef = doc(db, 'users', userId, 'tasks', task.id);
    if (replanDate) {
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
    if (isGuestUser(userId)) {
      const key = `meu_norte_tasks_${userId}`;
      const tasks = getLocal<UserTask[]>(key, []);
      const filtered = tasks.filter((t) => t.id !== taskId);
      setLocal(key, filtered);
      triggerLocalUpdate(userId, 'tasks');
      return;
    }
    const docRef = doc(db, 'users', userId, 'tasks', taskId);
    await deleteDoc(docRef);
  }

  // Batch update task plan dates
  static async batchAssignTaskDates(
    userId: string,
    assignments: { taskId: string; assignedDate: string }[]
  ): Promise<void> {
    const now = new Date().toISOString();

    if (isGuestUser(userId)) {
      const key = `meu_norte_tasks_${userId}`;
      const tasks = getLocal<UserTask[]>(key, []);
      const map = new Map(assignments.map((a) => [a.taskId, a.assignedDate]));
      const updated = tasks.map((t) => {
        if (map.has(t.id)) {
          return {
            ...t,
            status: 'planned' as const,
            plannedDate: map.get(t.id)!,
            updatedAt: now,
          };
        }
        return t;
      });
      setLocal(key, updated);
      triggerLocalUpdate(userId, 'tasks');
      return;
    }

    const batch = writeBatch(db);
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
    if (isGuestUser(userId)) {
      const key = `meu_norte_routine_${userId}`;
      const deliver = () => {
        const items = getLocal<FixedRoutineItem[]>(key, DEFAULT_INITIAL_ROUTINE.map((r, i) => ({ ...r, id: `routine-${i}` })));
        onSuccess(items);
      };
      deliver();
      const listener = () => deliver();
      window.addEventListener(`meu_norte_routine_${userId}`, listener);
      return () => window.removeEventListener(`meu_norte_routine_${userId}`, listener);
    }

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

    if (isGuestUser(userId)) {
      const key = `meu_norte_routine_${userId}`;
      const routine = getLocal<FixedRoutineItem[]>(key, []);
      const idx = routine.findIndex((r) => r.id === id);
      const updated: FixedRoutineItem = {
        id,
        title: item.title || 'Rotina',
        dayOfWeek: item.dayOfWeek !== undefined ? item.dayOfWeek : 1,
        startTime: item.startTime || '08:00',
        endTime: item.endTime || '12:00',
        intensity: item.intensity || 'moderate',
        ...item,
      };
      if (idx >= 0) {
        routine[idx] = updated;
      } else {
        routine.push(updated);
      }
      setLocal(key, routine);
      triggerLocalUpdate(userId, 'routine');
      return;
    }

    const docRef = doc(db, 'users', userId, 'routine', id);
    await setDoc(docRef, { ...item, id }, { merge: true });
  }

  static async deleteRoutineItem(userId: string, itemId: string): Promise<void> {
    if (isGuestUser(userId)) {
      const key = `meu_norte_routine_${userId}`;
      const routine = getLocal<FixedRoutineItem[]>(key, []);
      setLocal(key, routine.filter((r) => r.id !== itemId));
      triggerLocalUpdate(userId, 'routine');
      return;
    }
    const docRef = doc(db, 'users', userId, 'routine', itemId);
    await deleteDoc(docRef);
  }

  // Subscribe Daily Logs (Sleep, Energy, Mood, Bad Day)
  static subscribeDailyLogs(
    userId: string,
    onSuccess: (logs: DailyLog[]) => void,
    onError?: (error: Error) => void
  ) {
    if (isGuestUser(userId)) {
      const key = `meu_norte_dailyLogs_${userId}`;
      const deliver = () => {
        const logs = getLocal<DailyLog[]>(key, []);
        onSuccess(logs);
      };
      deliver();
      const listener = () => deliver();
      window.addEventListener(`meu_norte_dailyLogs_${userId}`, listener);
      return () => window.removeEventListener(`meu_norte_dailyLogs_${userId}`, listener);
    }

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
    const now = new Date().toISOString();

    if (isGuestUser(userId)) {
      const key = `meu_norte_dailyLogs_${userId}`;
      const logs = getLocal<DailyLog[]>(key, []);
      const idx = logs.findIndex((l) => l.date === log.date);
      const existing = idx >= 0 ? logs[idx] : null;
      const updated: DailyLog = {
        id: log.date,
        date: log.date,
        updatedAt: now,
        ...existing,
        ...log,
      };
      if (idx >= 0) {
        logs[idx] = updated;
      } else {
        logs.push(updated);
      }
      setLocal(key, logs);
      triggerLocalUpdate(userId, 'dailyLogs');
      return;
    }

    const docRef = doc(db, 'users', userId, 'dailyLogs', log.date);
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
    if (isGuestUser(userId)) {
      const key = `meu_norte_journal_${userId}`;
      const deliver = () => {
        const entries = getLocal<JournalEntry[]>(key, []);
        onSuccess(entries);
      };
      deliver();
      const listener = () => deliver();
      window.addEventListener(`meu_norte_journal_${userId}`, listener);
      return () => window.removeEventListener(`meu_norte_journal_${userId}`, listener);
    }

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

    if (isGuestUser(userId)) {
      const key = `meu_norte_journal_${userId}`;
      const entries = getLocal<JournalEntry[]>(key, []);
      const idx = entries.findIndex((e) => e.id === id);
      const existing = idx >= 0 ? entries[idx] : null;
      const updated: JournalEntry = {
        id,
        date: getTodayString(),
        text: '',
        createdAt: entry.createdAt || now,
        updatedAt: now,
        ...existing,
        ...entry,
      };
      if (idx >= 0) {
        entries[idx] = updated;
      } else {
        entries.unshift(updated);
      }
      setLocal(key, entries);
      triggerLocalUpdate(userId, 'journal');
      return id;
    }

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
    if (isGuestUser(userId)) {
      const key = `meu_norte_journal_${userId}`;
      const entries = getLocal<JournalEntry[]>(key, []);
      setLocal(key, entries.filter((e) => e.id !== entryId));
      triggerLocalUpdate(userId, 'journal');
      return;
    }
    const docRef = doc(db, 'users', userId, 'journal', entryId);
    await deleteDoc(docRef);
  }

  // Subscribe Categories
  static subscribeCategories(
    userId: string,
    onSuccess: (cats: CategoryItem[]) => void,
    onError?: (error: Error) => void
  ) {
    if (isGuestUser(userId)) {
      const key = `meu_norte_categories_${userId}`;
      const deliver = () => {
        const items = getLocal<CategoryItem[]>(key, DEFAULT_CATEGORIES);
        onSuccess(items);
      };
      deliver();
      const listener = () => deliver();
      window.addEventListener(`meu_norte_categories_${userId}`, listener);
      return () => window.removeEventListener(`meu_norte_categories_${userId}`, listener);
    }

    const colRef = collection(db, 'users', userId, 'categories');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: CategoryItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as Omit<CategoryItem, 'id'>) });
        });
        if (items.length === 0) {
          onSuccess(DEFAULT_CATEGORIES);
        } else {
          onSuccess(items);
        }
      },
      onError
    );
  }

  static async saveCategory(userId: string, cat: CategoryItem): Promise<void> {
    if (isGuestUser(userId)) {
      const key = `meu_norte_categories_${userId}`;
      const cats = getLocal<CategoryItem[]>(key, DEFAULT_CATEGORIES);
      const idx = cats.findIndex((c) => c.id === cat.id);
      if (idx >= 0) {
        cats[idx] = cat;
      } else {
        cats.push(cat);
      }
      setLocal(key, cats);
      triggerLocalUpdate(userId, 'categories');
      return;
    }
    const docRef = doc(db, 'users', userId, 'categories', cat.id);
    await setDoc(docRef, cat, { merge: true });
  }

  static async deleteCategory(userId: string, catId: string): Promise<void> {
    if (isGuestUser(userId)) {
      const key = `meu_norte_categories_${userId}`;
      const cats = getLocal<CategoryItem[]>(key, DEFAULT_CATEGORIES);
      setLocal(key, cats.filter((c) => c.id !== catId));
      triggerLocalUpdate(userId, 'categories');
      return;
    }
    const docRef = doc(db, 'users', userId, 'categories', catId);
    await deleteDoc(docRef);
  }

  // Subscribe Objectives
  static subscribeObjectives(
    userId: string,
    onSuccess: (objs: UserObjective[]) => void,
    onError?: (error: Error) => void
  ) {
    if (isGuestUser(userId)) {
      const key = `meu_norte_objectives_${userId}`;
      const deliver = () => {
        const items = getLocal<UserObjective[]>(key, []);
        onSuccess(items);
      };
      deliver();
      const listener = () => deliver();
      window.addEventListener(`meu_norte_objectives_${userId}`, listener);
      return () => window.removeEventListener(`meu_norte_objectives_${userId}`, listener);
    }

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
    const now = new Date().toISOString();

    if (isGuestUser(userId)) {
      const key = `meu_norte_objectives_${userId}`;
      const objs = getLocal<UserObjective[]>(key, []);
      const idx = objs.findIndex((o) => o.id === id);
      const existing = idx >= 0 ? objs[idx] : null;
      const updated: UserObjective = {
        id,
        title: obj.title || '',
        active: obj.active !== undefined ? obj.active : true,
        createdAt: obj.createdAt || now,
        ...existing,
        ...obj,
      };
      if (idx >= 0) {
        objs[idx] = updated;
      } else {
        objs.push(updated);
      }
      setLocal(key, objs);
      triggerLocalUpdate(userId, 'objectives');
      return;
    }

    const docRef = doc(db, 'users', userId, 'objectives', id);
    const data = {
      ...obj,
      id,
      active: obj.active !== undefined ? obj.active : true,
      createdAt: obj.createdAt || now,
    };
    await setDoc(docRef, data, { merge: true });
  }

  static async deleteObjective(userId: string, objId: string): Promise<void> {
    if (isGuestUser(userId)) {
      const key = `meu_norte_objectives_${userId}`;
      const objs = getLocal<UserObjective[]>(key, []);
      setLocal(key, objs.filter((o) => o.id !== objId));
      triggerLocalUpdate(userId, 'objectives');
      return;
    }
    const docRef = doc(db, 'users', userId, 'objectives', objId);
    await deleteDoc(docRef);
  }

  // User Profile
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (isGuestUser(userId)) {
      return getLocal<UserProfile | null>(`meu_norte_profile_${userId}`, {
        uid: userId,
        email: '',
        displayName: 'Convidado',
        onboarded: true,
        createdAt: new Date().toISOString(),
      });
    }

    const docRef = doc(db, 'users', userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  }

  static async saveUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
    const now = new Date().toISOString();
    if (isGuestUser(userId)) {
      const key = `meu_norte_profile_${userId}`;
      const existing = getLocal<UserProfile | null>(key, null) || {
        uid: userId,
        email: '',
        displayName: 'Convidado',
        onboarded: true,
        createdAt: now,
      };
      const updated = { ...existing, ...profile, uid: userId, updatedAt: now };
      setLocal(key, updated);
      triggerLocalUpdate(userId, 'profile');
      return;
    }

    const docRef = doc(db, 'users', userId);
    await setDoc(docRef, { ...profile, uid: userId, updatedAt: now }, { merge: true });
  }

  // Bootstrap initial user data on first sign-up / onboarding
  static async initializeFirstTimeUser(userId: string, email: string, displayName: string): Promise<void> {
    const now = new Date().toISOString();

    if (isGuestUser(userId)) {
      const profile: UserProfile = {
        uid: userId,
        email: email || '',
        displayName: displayName || 'Convidado',
        onboarded: true,
        createdAt: now,
        updatedAt: now,
      };
      setLocal(`meu_norte_profile_${userId}`, profile);
      setLocal(`meu_norte_categories_${userId}`, DEFAULT_CATEGORIES);
      setLocal(
        `meu_norte_routine_${userId}`,
        DEFAULT_INITIAL_ROUTINE.map((r, idx) => ({ ...r, id: `default-routine-${idx}` }))
      );
      triggerLocalUpdate(userId, 'profile');
      triggerLocalUpdate(userId, 'categories');
      triggerLocalUpdate(userId, 'routine');
      return;
    }

    const batch = writeBatch(db);

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
    if (isGuestUser(userId)) {
      return {
        version: 'meu-norte-v1',
        exportedAt: new Date().toISOString(),
        profile: getLocal(`meu_norte_profile_${userId}`, null),
        tasks: getLocal(`meu_norte_tasks_${userId}`, []),
        routine: getLocal(`meu_norte_routine_${userId}`, []),
        dailyLogs: getLocal(`meu_norte_dailyLogs_${userId}`, []),
        journal: getLocal(`meu_norte_journal_${userId}`, []),
        categories: getLocal(`meu_norte_categories_${userId}`, DEFAULT_CATEGORIES),
        objectives: getLocal(`meu_norte_objectives_${userId}`, []),
      };
    }

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

  // Seed sample tasks for initial demonstration
  static async seedSampleData(userId: string): Promise<void> {
    const today = getTodayString();
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

    if (isGuestUser(userId)) {
      for (const t of sampleTasks) {
        await this.saveTask(userId, t);
      }
      await this.saveDailyLog(userId, {
        id: today,
        date: today,
        bedTime: '23:15',
        wakeTime: '06:45',
        sleepHours: 7.5,
        energy: 4,
        mood: 4,
        overload: 2,
      });
      return;
    }

    const batch = writeBatch(db);
    sampleTasks.forEach((t) => {
      const docRef = doc(db, 'users', userId, 'tasks', t.id!);
      batch.set(docRef, { ...t, createdAt: now, updatedAt: now });
    });

    const logDoc = doc(db, 'users', userId, 'dailyLogs', today);
    batch.set(
      logDoc,
      {
        id: today,
        date: today,
        bedTime: '23:15',
        wakeTime: '06:45',
        sleepHours: 7.5,
        energy: 4,
        mood: 4,
        overload: 2,
        updatedAt: now,
      },
      { merge: true }
    );

    await batch.commit();
  }

  // Clear demo/sample data
  static async clearSampleData(userId: string): Promise<void> {
    if (isGuestUser(userId)) {
      const key = `meu_norte_tasks_${userId}`;
      const tasks = getLocal<UserTask[]>(key, []);
      setLocal(
        key,
        tasks.filter((t) => !t.id.startsWith('sample-'))
      );
      triggerLocalUpdate(userId, 'tasks');
      return;
    }

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

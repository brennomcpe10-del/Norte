import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { FirestoreService } from '../services/firestoreService';
import {
  CategoryItem,
  DailyLog,
  FailureReason,
  FixedRoutineItem,
  JournalEntry,
  SyncStatus,
  UserObjective,
  UserTask,
} from '../types';
import { getTodayString, getWeekDays } from '../utils/dateUtils';
import { distributeWeeklyTasks as runDistributionAlgorithm } from '../services/plannerAlgorithm';

export type ScreenTab =
  | 'today'
  | 'week'
  | 'inbox'
  | 'tasks'
  | 'progress'
  | 'journal'
  | 'sleep'
  | 'reports'
  | 'settings';

interface AppContextType {
  activeTab: ScreenTab;
  setActiveTab: (tab: ScreenTab) => void;
  tasks: UserTask[];
  routine: FixedRoutineItem[];
  dailyLogs: DailyLog[];
  journal: JournalEntry[];
  journalEntries: JournalEntry[];
  categories: CategoryItem[];
  objectives: UserObjective[];
  syncStatus: SyncStatus;
  syncMessage: string;
  isOnline: boolean;
  todayDate: string;
  todayLog: DailyLog | undefined;
  
  // Actions
  saveTask: (task: Partial<UserTask>) => Promise<string>;
  completeTask: (task: UserTask) => Promise<void>;
  markTaskIncomplete: (task: UserTask, reason: FailureReason, notes?: string, replanDate?: string | null) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleBadDay: (reason?: string) => Promise<void>;
  saveDailyLog: (log: Partial<DailyLog>) => Promise<void>;
  saveRoutineItem: (item: Partial<FixedRoutineItem>) => Promise<void>;
  deleteRoutineItem: (id: string) => Promise<void>;
  saveJournalEntry: (entry: Partial<JournalEntry>) => Promise<string>;
  deleteJournalEntry: (id: string) => Promise<void>;
  saveCategory: (cat: CategoryItem) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  saveObjective: (obj: Partial<UserObjective>) => Promise<void>;
  deleteObjective: (id: string) => Promise<void>;
  seedSampleData: () => Promise<void>;
  seedDemoData: () => Promise<void>;
  clearSampleData: () => Promise<void>;
  distributeWeek: () => Promise<{ success: boolean; message: string; isOverloaded: boolean }>;

  // Modals & triggers
  taskToReportIncomplete: UserTask | null;
  setTaskToReportIncomplete: (task: UserTask | null) => void;
  quickAddModalOpen: boolean;
  setQuickAddModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ScreenTab>('today');
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [routine, setRoutine] = useState<FixedRoutineItem[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [objectives, setObjectives] = useState<UserObjective[]>([]);
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [syncMessage, setSyncMessage] = useState<string>('Sincronizado');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  const [taskToReportIncomplete, setTaskToReportIncomplete] = useState<UserTask | null>(null);
  const [quickAddModalOpen, setQuickAddModalOpen] = useState<boolean>(false);

  const todayDate = getTodayString();
  const todayLog = (dailyLogs || []).find((l) => l?.date === todayDate);

  const notifySync = useCallback((status: SyncStatus, msg: string) => {
    setSyncStatus(status);
    setSyncMessage(msg);
    if (status === 'synced') {
      const timer = setTimeout(() => {
        setSyncMessage('Sincronizado');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Monitor network online/offline state
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      notifySync('synced', 'Conexão restabelecida');
    };
    const handleOffline = () => {
      setIsOnline(false);
      notifySync('offline', 'Você está offline (modo local)');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [notifySync]);

  // Subscribe to real-time Firestore listeners when user is logged in
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setRoutine([]);
      setDailyLogs([]);
      setJournal([]);
      setCategories([]);
      setObjectives([]);
      return;
    }

    notifySync('syncing', 'Sincronizando...');

    const unsubTasks = FirestoreService.subscribeTasks(
      user.uid,
      (newTasks) => {
        setTasks(newTasks);
        notifySync('synced', 'Salvo');
      },
      (err) => {
        console.error(err);
        notifySync('error', 'Erro de conexão');
      }
    );

    const unsubRoutine = FirestoreService.subscribeRoutine(
      user.uid,
      (newRoutine) => setRoutine(newRoutine),
      console.error
    );

    const unsubLogs = FirestoreService.subscribeDailyLogs(
      user.uid,
      (newLogs) => setDailyLogs(newLogs),
      console.error
    );

    const unsubJournal = FirestoreService.subscribeJournal(
      user.uid,
      (newJournal) => setJournal(newJournal),
      console.error
    );

    const unsubCats = FirestoreService.subscribeCategories(
      user.uid,
      (newCats) => setCategories(newCats),
      console.error
    );

    const unsubObjs = FirestoreService.subscribeObjectives(
      user.uid,
      (newObjs) => setObjectives(newObjs),
      console.error
    );

    return () => {
      unsubTasks();
      unsubRoutine();
      unsubLogs();
      unsubJournal();
      unsubCats();
      unsubObjs();
    };
  }, [user, notifySync]);

  // Action wrappers with automatic sync feedback
  const saveTask = async (task: Partial<UserTask>) => {
    if (!user) throw new Error('Usuário não autenticado');
    notifySync('syncing', 'Salvando tarefa...');
    try {
      const id = await FirestoreService.saveTask(user.uid, task);
      notifySync('synced', 'Tarefa salva');
      return id;
    } catch (err) {
      notifySync('error', 'Erro ao salvar');
      throw err;
    }
  };

  const completeTask = async (task: UserTask) => {
    if (!user) return;
    notifySync('syncing', 'Atualizando...');
    try {
      await FirestoreService.completeTask(user.uid, task);
      notifySync('synced', 'Tarefa concluída');
    } catch (err) {
      notifySync('error', 'Erro ao atualizar');
      throw err;
    }
  };

  const markTaskIncomplete = async (
    task: UserTask,
    reason: FailureReason,
    notes?: string,
    replanDate?: string | null
  ) => {
    if (!user) return;
    notifySync('syncing', 'Registrando replanejamento...');
    try {
      await FirestoreService.registerTaskIncomplete(user.uid, task, reason, notes, replanDate);
      notifySync('synced', replanDate ? 'Replanejada com sucesso' : 'Motivo registrado com calma');
    } catch (err) {
      notifySync('error', 'Erro ao registrar');
      throw err;
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;
    notifySync('syncing', 'Removendo...');
    try {
      await FirestoreService.deleteTask(user.uid, taskId);
      notifySync('synced', 'Tarefa removida');
    } catch (err) {
      notifySync('error', 'Erro ao remover');
      throw err;
    }
  };

  const toggleBadDay = async (reason?: string) => {
    if (!user) return;
    const currentActive = todayLog?.badDayActive || false;
    notifySync('syncing', 'Ajustando dia...');
    try {
      await FirestoreService.saveDailyLog(user.uid, {
        date: todayDate,
        badDayActive: !currentActive,
        badDayReason: reason || (currentActive ? '' : 'Hoje não estou bem'),
      });
      notifySync('synced', !currentActive ? 'Carga ajustada para um dia leve' : 'Modo normal reativado');
    } catch (err) {
      notifySync('error', 'Erro ao atualizar');
      throw err;
    }
  };

  const saveDailyLog = async (log: Partial<DailyLog>) => {
    if (!user) return;
    notifySync('syncing', 'Salvando registro...');
    try {
      await FirestoreService.saveDailyLog(user.uid, {
        date: log.date || todayDate,
        ...log,
      });
      notifySync('synced', 'Registro atualizado');
    } catch (err) {
      notifySync('error', 'Erro ao salvar');
      throw err;
    }
  };

  const saveRoutineItem = async (item: Partial<FixedRoutineItem>) => {
    if (!user) return;
    notifySync('syncing', 'Atualizando rotina...');
    try {
      await FirestoreService.saveRoutineItem(user.uid, item);
      notifySync('synced', 'Rotina atualizada');
    } catch (err) {
      notifySync('error', 'Erro ao salvar');
      throw err;
    }
  };

  const deleteRoutineItem = async (id: string) => {
    if (!user) return;
    notifySync('syncing', 'Removendo...');
    try {
      await FirestoreService.deleteRoutineItem(user.uid, id);
      notifySync('synced', 'Item removido');
    } catch (err) {
      notifySync('error', 'Erro ao remover');
      throw err;
    }
  };

  const saveJournalEntry = async (entry: Partial<JournalEntry>) => {
    if (!user) throw new Error('Usuário não autenticado');
    notifySync('syncing', 'Salvando diário...');
    try {
      const id = await FirestoreService.saveJournalEntry(user.uid, entry);
      notifySync('synced', 'Diário salvo');
      return id;
    } catch (err) {
      notifySync('error', 'Erro ao salvar');
      throw err;
    }
  };

  const deleteJournalEntry = async (id: string) => {
    if (!user) return;
    try {
      await FirestoreService.deleteJournalEntry(user.uid, id);
      notifySync('synced', 'Entrada removida');
    } catch (err) {
      notifySync('error', 'Erro ao remover');
    }
  };

  const saveCategory = async (cat: CategoryItem) => {
    if (!user) return;
    await FirestoreService.saveCategory(user.uid, cat);
    notifySync('synced', 'Categoria salva');
  };

  const deleteCategory = async (id: string) => {
    if (!user) return;
    await FirestoreService.deleteCategory(user.uid, id);
    notifySync('synced', 'Categoria removida');
  };

  const saveObjective = async (obj: Partial<UserObjective>) => {
    if (!user) return;
    await FirestoreService.saveObjective(user.uid, obj);
    notifySync('synced', 'Objetivo salvo');
  };

  const deleteObjective = async (id: string) => {
    if (!user) return;
    await FirestoreService.deleteObjective(user.uid, id);
    notifySync('synced', 'Objetivo removido');
  };

  const seedSampleData = async () => {
    if (!user) return;
    notifySync('syncing', 'Carregando exemplos...');
    try {
      await FirestoreService.seedSampleData(user.uid);
      notifySync('synced', 'Dados de exemplo carregados');
    } catch (err) {
      notifySync('error', 'Erro ao carregar');
    }
  };

  const clearSampleData = async () => {
    if (!user) return;
    notifySync('syncing', 'Limpando exemplos...');
    try {
      await FirestoreService.clearSampleData(user.uid);
      notifySync('synced', 'Exemplos descartados');
    } catch (err) {
      notifySync('error', 'Erro ao limpar');
    }
  };

  // Run weekly planner distribution
  const distributeWeek = async () => {
    if (!user) return { success: false, message: 'Usuário não conectado', isOverloaded: false };

    const weekDays = getWeekDays();
    // Tasks to distribute: inbox tasks + tasks planned for this week that are pending
    const inboxTasks = tasks.filter((t) => t.status === 'inbox');
    const existingWeekPlanned = tasks.filter(
      (t) => t.plannedDate && weekDays.some((w) => w.date === t.plannedDate) && t.status === 'planned'
    );

    const candidates = [...inboxTasks, ...existingWeekPlanned];
    if (candidates.length === 0) {
      return {
        success: false,
        message: 'Nenhuma tarefa na Caixa de Entrada ou pendente nesta semana para distribuir.',
        isOverloaded: false,
      };
    }

    notifySync('syncing', 'Calculando distribuição realista...');
    const result = runDistributionAlgorithm(
      candidates,
      weekDays,
      routine,
      tasks.filter((t) => t.status === 'completed') // completed tasks hold their slots
    );

    if (result.assignments.length > 0) {
      await FirestoreService.batchAssignTaskDates(user.uid, result.assignments);
    }

    notifySync('synced', 'Semana organizada');
    return {
      success: true,
      message: result.explanation,
      isOverloaded: result.isOverloaded,
    };
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        tasks,
        routine,
        dailyLogs,
        journal,
        journalEntries: journal,
        categories,
        objectives,
        syncStatus,
        syncMessage,
        isOnline,
        todayDate,
        todayLog,
        saveTask,
        completeTask,
        markTaskIncomplete,
        deleteTask,
        toggleBadDay,
        saveDailyLog,
        saveRoutineItem,
        deleteRoutineItem,
        saveJournalEntry,
        deleteJournalEntry,
        saveCategory,
        deleteCategory,
        saveObjective,
        deleteObjective,
        seedSampleData,
        seedDemoData: seedSampleData,
        clearSampleData,
        distributeWeek,
        taskToReportIncomplete,
        setTaskToReportIncomplete,
        quickAddModalOpen,
        setQuickAddModalOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

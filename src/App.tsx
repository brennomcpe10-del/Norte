import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider, useApp } from './contexts/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { TodayView } from './components/views/TodayView';
import { WeekView } from './components/views/WeekView';
import { InboxView } from './components/views/InboxView';
import { TasksBankView } from './components/views/TasksBankView';
import { ProgressView } from './components/views/ProgressView';
import { JournalView } from './components/views/JournalView';
import { SleepWellnessView } from './components/views/SleepWellnessView';
import { ReportsView } from './components/views/ReportsView';
import { SettingsView } from './components/views/SettingsView';
import { QuickAddModal } from './components/tasks/QuickAddModal';
import { TaskFailureModal } from './components/tasks/TaskFailureModal';
import { AuthModal } from './components/auth/AuthModal';
import { OnboardingModal } from './components/onboarding/OnboardingModal';

const MainAppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { activeTab } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-600">Carregando Meu Norte...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal isOpen={true} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-800">
      {/* Top Navbar */}
      <Navbar />

      {/* Main layout container */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {activeTab === 'today' && <TodayView />}
          {activeTab === 'week' && <WeekView />}
          {activeTab === 'inbox' && <InboxView />}
          {activeTab === 'tasks' && <TasksBankView />}
          {activeTab === 'progress' && <ProgressView />}
          {activeTab === 'journal' && <JournalView />}
          {activeTab === 'sleep' && <SleepWellnessView />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global Modals */}
      <QuickAddModal />
      <TaskFailureModal />
      <OnboardingModal />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    </AuthProvider>
  );
}

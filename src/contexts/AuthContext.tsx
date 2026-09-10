import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { FirestoreService } from '../services/firestoreService';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        try {
          let userProf = await FirestoreService.getUserProfile(fbUser.uid);
          if (!userProf) {
            await FirestoreService.initializeFirstTimeUser(
              fbUser.uid,
              fbUser.email || '',
              fbUser.displayName || ''
            );
            userProf = await FirestoreService.getUserProfile(fbUser.uid);
          }
          setProfile(userProf);
        } catch (err: any) {
          console.error('Error fetching profile:', err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const fbUser = cred.user;
      let userProf = await FirestoreService.getUserProfile(fbUser.uid);
      if (!userProf) {
        await FirestoreService.initializeFirstTimeUser(
          fbUser.uid,
          fbUser.email || '',
          fbUser.displayName || ''
        );
        userProf = await FirestoreService.getUserProfile(fbUser.uid);
      }
      setProfile(userProf);
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('O login com Google foi cancelado antes da conclusão.');
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError('O pop-up de login foi bloqueado pelo navegador.');
      } else {
        setAuthError('Não foi possível entrar com o Google. Verifique sua conexão e tente novamente.');
      }
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      console.error('Email sign in error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setAuthError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/invalid-email') {
        setAuthError('Formato de e-mail inválido.');
      } else {
        setAuthError('Erro ao realizar login. Tente novamente.');
      }
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    setAuthError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (cred.user) {
        if (name) {
          await updateProfile(cred.user, { displayName: name });
        }
        await FirestoreService.initializeFirstTimeUser(cred.user.uid, email, name);
        const userProf = await FirestoreService.getUserProfile(cred.user.uid);
        setProfile(userProf);
      }
    } catch (err: any) {
      console.error('Sign up error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setAuthError('Este e-mail já está cadastrado.');
      } else if (err.code === 'auth/weak-password') {
        setAuthError('A senha deve ter no mínimo 6 caracteres.');
      } else {
        setAuthError('Erro ao criar conta. Tente novamente.');
      }
      throw err;
    }
  };

  const signOut = async () => {
    await fbSignOut(auth);
    setProfile(null);
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setAuthError('Nenhuma conta encontrada com este e-mail.');
      } else {
        setAuthError('Erro ao enviar e-mail de recuperação.');
      }
      throw err;
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    await FirestoreService.saveUserProfile(user.uid, data);
    setProfile((prev) => (prev ? { ...prev, ...data } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        resetPassword,
        updateUserProfile,
        authError,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

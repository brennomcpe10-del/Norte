import React, { createContext, useContext, useEffect, useState } from 'react';
import {
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
import { AppUser, UserProfile } from '../types';

interface AuthContextType {
  user: AppUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInAsGuest: (name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const appUser: AppUser = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          isGuest: false,
        };
        setUser(appUser);
        localStorage.removeItem('meu_norte_guest_user');
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
        // Check for local guest user session
        const rawGuest = localStorage.getItem('meu_norte_guest_user');
        if (rawGuest) {
          try {
            const guestUser = JSON.parse(rawGuest) as AppUser;
            setUser(guestUser);
            const prof = await FirestoreService.getUserProfile(guestUser.uid);
            setProfile(prof);
          } catch {
            setUser(null);
            setProfile(null);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
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
      const appUser: AppUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        isGuest: false,
      };
      setUser(appUser);
      localStorage.removeItem('meu_norte_guest_user');
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
      } catch (profileErr) {
        console.warn('Profile init warning:', profileErr);
      }
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('O login com Google foi cancelado antes da conclusão.');
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError('O pop-up de login foi bloqueado pelo navegador. Habilite pop-ups para esta página ou use o Modo Convidado.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setAuthError(`O domínio (${window.location.hostname}) não está na lista de domínios autorizados do Firebase Auth. Use o "Modo Convidado" abaixo para usar o app agora!`);
      } else {
        setAuthError(`Não foi possível entrar com o Google (${err.code || err.message || 'Verifique sua conexão'}). Você também pode usar o Modo Convidado.`);
      }
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      if (cred.user) {
        const appUser: AppUser = {
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName,
          isGuest: false,
        };
        setUser(appUser);
        localStorage.removeItem('meu_norte_guest_user');
      }
    } catch (err: any) {
      console.error('Email sign in error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setAuthError('O login por E-mail/Senha não está habilitado no Firebase Console deste projeto (apenas Google está ativo por padrão). Utilize "Continuar com o Google" ou "Modo Convidado".');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setAuthError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/invalid-email') {
        setAuthError('Formato de e-mail inválido.');
      } else {
        setAuthError(`Erro ao realizar login: ${err.message || 'Tente novamente.'}`);
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
          try {
            await updateProfile(cred.user, { displayName: name });
          } catch {}
        }
        const appUser: AppUser = {
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: name || cred.user.displayName,
          isGuest: false,
        };
        setUser(appUser);
        localStorage.removeItem('meu_norte_guest_user');
        try {
          await FirestoreService.initializeFirstTimeUser(cred.user.uid, email, name);
          const userProf = await FirestoreService.getUserProfile(cred.user.uid);
          setProfile(userProf);
        } catch (initErr) {
          console.warn('User bootstrap warning:', initErr);
        }
      }
    } catch (err: any) {
      console.error('Sign up error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setAuthError('O cadastro por E-mail/Senha não está habilitado no Firebase Console deste projeto (apenas Google está ativo por padrão). Utilize "Continuar com o Google" ou "Modo Convidado".');
      } else if (err.code === 'auth/email-already-in-use') {
        setAuthError('Este e-mail já está cadastrado. Clique em "Já tem uma conta? Entrar" acima.');
      } else if (err.code === 'auth/weak-password') {
        setAuthError('A senha deve ter no mínimo 6 caracteres.');
      } else {
        setAuthError(`Erro ao criar conta: ${err.message || 'Tente novamente.'}`);
      }
      throw err;
    }
  };

  const signInAsGuest = async (name?: string) => {
    setAuthError(null);
    const guestId = 'guest-' + Math.random().toString(36).substring(2, 9);
    const guestDisplayName = name?.trim() || 'Convidado';
    const guestUser: AppUser = {
      uid: guestId,
      email: null,
      displayName: guestDisplayName,
      isGuest: true,
    };

    localStorage.setItem('meu_norte_guest_user', JSON.stringify(guestUser));
    await FirestoreService.initializeFirstTimeUser(guestId, '', guestDisplayName);
    const prof = await FirestoreService.getUserProfile(guestId);
    setUser(guestUser);
    setProfile(prof);
  };

  const signOut = async () => {
    localStorage.removeItem('meu_norte_guest_user');
    if (!user?.isGuest) {
      await fbSignOut(auth);
    }
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
        setAuthError(`Erro ao enviar e-mail de recuperação: ${err.message || 'Tente novamente.'}`);
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
        signInAsGuest,
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

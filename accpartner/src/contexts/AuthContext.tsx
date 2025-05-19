import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Auth, 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, query, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { UserProfile, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to update deadline in real-time
  const updateDeadline = async (newDeadline: string) => {
    if (!user || !userProfile) return;
    
    try {
      // Check if deadline was already set today
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const lastDeadlineUpdate = userData.lastDeadlineUpdate;
        
        if (lastDeadlineUpdate) {
          const lastUpdate = lastDeadlineUpdate.toDate();
          const now = new Date();
          
          // Check if the last update was today
          if (lastUpdate.getDate() === now.getDate() &&
              lastUpdate.getMonth() === now.getMonth() &&
              lastUpdate.getFullYear() === now.getFullYear()) {
            throw new Error('Deadline can only be changed once per day');
          }
        }
      }

      // Update local state immediately
      setUserProfile(prev => prev ? { ...prev, deadline: newDeadline } : null);
      
      // Update in Firestore with timestamp
      await updateDoc(userRef, { 
        deadline: newDeadline,
        lastDeadlineUpdate: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating deadline:', error);
      // Revert local state if Firestore update fails
      setUserProfile(prev => prev ? { ...prev, deadline: userProfile.deadline } : null);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserProfile({
            id: user.uid,
            username: data.username,
            email: data.email,
            timezone: data.timezone,
            deadline: data.deadline || '',
            isAvailable: data.isAvailable,
            rating: data.rating || 0,
            totalPairs: data.totalPairs || 0
          });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    // Function to clear pairing data at midnight
    const clearPairingData = async () => {
      try {
        // Get all pairings
        const pairingsQuery = query(collection(db, 'pairings'));
        const pairingsSnapshot = await getDocs(pairingsQuery);
        
        // Get all planned tasks
        const plannedTasksQuery = query(collection(db, 'plannedTasks'));
        const plannedTasksSnapshot = await getDocs(plannedTasksQuery);
        
        // Get all completed tasks
        const completedTasksQuery = query(collection(db, 'completedTasks'));
        const completedTasksSnapshot = await getDocs(completedTasksQuery);

        // Delete all pairings
        const deletePairings = pairingsSnapshot.docs.map(doc => 
          deleteDoc(doc.ref)
        );

        // Delete all planned tasks
        const deletePlannedTasks = plannedTasksSnapshot.docs.map(doc => 
          deleteDoc(doc.ref)
        );

        // Delete all completed tasks
        const deleteCompletedTasks = completedTasksSnapshot.docs.map(doc => 
          deleteDoc(doc.ref)
        );

        // Execute all deletions
        await Promise.all([
          ...deletePairings,
          ...deletePlannedTasks,
          ...deleteCompletedTasks
        ]);
      } catch (error) {
        // Silent fail - don't show error to users
      }
    };

    // Check if it's midnight and clear data if needed
    const checkAndClearData = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        clearPairingData();
      }
    };

    // Check every minute
    const interval = setInterval(checkAndClearData, 60000);
    
    // Initial check
    checkAndClearData();

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, updates);
      
      // Update local state
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, username: string, timezone: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        id: user.uid,
        username,
        email,
        timezone,
        deadline: '',
        isAvailable: true,
        rating: 0,
        totalPairs: 0
      };

      await setDoc(doc(db, 'users', user.uid), {
        ...userProfile,
        createdAt: serverTimestamp()
      });

      setUserProfile(userProfile);
      return user;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Fetch user profile
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserProfile({
          id: user.uid,
          username: data.username,
          email: data.email,
          timezone: data.timezone,
          deadline: data.deadline || '',
          isAvailable: data.isAvailable,
          rating: data.rating || 0,
          totalPairs: data.totalPairs || 0
        });
      }
      
      return user;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    setUserProfile,
    updateUserProfile,
    updateDeadline,
    register,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
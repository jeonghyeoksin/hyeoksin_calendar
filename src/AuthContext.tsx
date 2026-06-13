import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, writeBatch, serverTimestamp, updateDoc } from 'firebase/firestore';

interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  photoURL?: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  appUser: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setAppUser({
              uid: firebaseUser.uid,
              email: data.email,
              displayName: data.displayName,
              phone: data.phone,
              photoURL: data.photoURL,
              role: data.role,
            });
            // Update lastLoginAt
            try {
              await updateDoc(userDocRef, {
                lastLoginAt: serverTimestamp()
              });
            } catch (updateErr) {
              console.warn("Failed to update lastLoginAt", updateErr);
            }
          } else {
            // New user login, let's create the profile
            const batch = writeBatch(db);
            
            let role: 'admin' | 'user' = 'user';
            
            try {
              const sysConfigRef = doc(db, 'system', 'config');
              const sysConfigSnap = await getDoc(sysConfigRef);
              
              if (!sysConfigSnap.exists() || !sysConfigSnap.data().adminClaimed) {
                 // First user gets admin
                 role = 'admin';
                 batch.set(sysConfigRef, { adminClaimed: true }, { merge: true });
              }
            } catch (configError) {
              console.warn("Could not read system/config, defaulting to user role", configError);
            }
            
            const newUserData = {
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Unknown User',
              phone: firebaseUser.phoneNumber || '',
              photoURL: firebaseUser.photoURL || '',
              role: role,
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp()
            };
            
            try {
              batch.set(userDocRef, newUserData);
              await batch.commit();
            } catch (commitErr) {
              console.warn("Could not commit user profile to db", commitErr);
            }
            
            // Still set app user so app functions seamlessly
            setAppUser({
              uid: firebaseUser.uid,
              email: newUserData.email,
              displayName: newUserData.displayName,
              phone: newUserData.phone,
              photoURL: newUserData.photoURL,
              role: newUserData.role,
            });
          }
        } catch (error) {
           console.warn("Error managing user profile data, falling back to local user:", error);
           setAppUser({
             uid: firebaseUser.uid,
             email: firebaseUser.email || '',
             displayName: firebaseUser.displayName || 'Unknown User',
             phone: firebaseUser.phoneNumber || '',
             photoURL: firebaseUser.photoURL || '',
             role: 'user', // Default fallback role
           });
        }
      } else {
        setAppUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, appUser, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

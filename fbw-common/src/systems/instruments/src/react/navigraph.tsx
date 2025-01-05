import { User } from 'navigraph/auth';
import React, { useState, useEffect, useContext, createContext } from 'react';

import { navigraphAuth } from '../navigraph';
import { NXDataStore } from '@flybywiresim/fbw-sdk';

interface NavigraphAuthContext {
  initialized: boolean;
  user: User | null;
  signIn: typeof navigraphAuth.signInWithDeviceFlow;
}

const authContext = createContext<NavigraphAuthContext>({
  initialized: false,
  user: null,
  signIn: () => Promise.reject(new Error('Not initialized')),
});

function useProvideAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = navigraphAuth.onAuthStateChanged((u) => {
      if (!initialized) {
        setInitialized(true);
      }

      if (u) {
        // Compat for some old legacy JS
        NXDataStore.set('NAVIGRAPH_USERNAME', u.preferred_username);
      }

      setUser(u);
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    initialized,
    signIn: navigraphAuth.signInWithDeviceFlow,
  };
}

export function NavigraphAuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useProvideAuth();
  return <authContext.Provider value={auth}>{children}</authContext.Provider>;
}

export const useNavigraphAuth = () => useContext(authContext);

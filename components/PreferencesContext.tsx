import React, { createContext, useContext, useState } from 'react';

// Define the shape of the context
interface PreferencesContextType {
  sound: string;
  setSound: (s: string) => void;
  playSound: boolean;
  setPlaySound: (b: boolean) => void;
  showMotivation: boolean;
  setShowMotivation: (b: boolean) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [sound, setSound] = useState('Bell');
  const [playSound, setPlaySound] = useState(true);
  const [showMotivation, setShowMotivation] = useState(true);

  return (
    <PreferencesContext.Provider value={{ sound, setSound, playSound, setPlaySound, showMotivation, setShowMotivation }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within a PreferencesProvider');
  return ctx;
} 
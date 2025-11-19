import React, { createContext, useContext, useState, useEffect } from "react";

interface FeatureFlags {
  pdfDownload: boolean;
  equationEditor: boolean;
  draggableBullets: boolean;
  themeToggle: boolean;
  adminAccess: boolean;
}

interface FeatureFlagsContextType {
  flags: FeatureFlags;
  updateFlag: (flag: keyof FeatureFlags, value: boolean) => void;
  resetToDefaults: () => void;
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
}

const defaultFlags: FeatureFlags = {
  pdfDownload: true,
  equationEditor: true,
  draggableBullets: true,
  themeToggle: true,
  adminAccess: false,
};

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>(() => {
    const stored = localStorage.getItem('ibdp-feature-flags');
    return stored ? { ...defaultFlags, ...JSON.parse(stored) } : defaultFlags;
  });
  
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('ibdp-admin-mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('ibdp-feature-flags', JSON.stringify(flags));
  }, [flags]);

  useEffect(() => {
    localStorage.setItem('ibdp-admin-mode', isAdmin.toString());
  }, [isAdmin]);

  const updateFlag = (flag: keyof FeatureFlags, value: boolean) => {
    setFlags(prev => ({
      ...prev,
      [flag]: value
    }));
  };

  const resetToDefaults = () => {
    setFlags(defaultFlags);
    localStorage.removeItem('ibdp-feature-flags');
  };

  return (
    <FeatureFlagsContext.Provider value={{
      flags,
      updateFlag,
      resetToDefaults,
      isAdmin,
      setIsAdmin
    }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
}
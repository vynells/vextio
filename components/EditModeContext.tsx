"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type EditModeContextType = {
  isAdmin: boolean;
  token: string | null;
  editMode: boolean;
  toggleEditMode: () => void;
  login: (token: string) => void;
  logout: () => void;
};

const EditModeContext = createContext<EditModeContextType | undefined>(
  undefined
);

const TOKEN_KEY = "vextio-admin-token";
const EDIT_MODE_KEY = "vextio-edit-mode";

export function EditModeProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_KEY);
    const storedEditMode = window.localStorage.getItem(EDIT_MODE_KEY);
    if (storedToken) setToken(storedToken);
    if (storedEditMode === "true") setEditMode(true);
  }, []);

  function login(newToken: string) {
    window.localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
  }

  function logout() {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.setItem(EDIT_MODE_KEY, "false");
    setToken(null);
    setEditMode(false);
  }

  function toggleEditMode() {
    setEditMode((prev) => {
      const next = !prev;
      window.localStorage.setItem(EDIT_MODE_KEY, String(next));
      return next;
    });
  }

  return (
    <EditModeContext.Provider
      value={{
        isAdmin: !!token,
        token,
        editMode: editMode && !!token,
        toggleEditMode,
        login,
        logout,
      }}
    >
      {children}
    </EditModeContext.Provider>
  );
}

export function useEditMode() {
  const ctx = useContext(EditModeContext);
  if (!ctx) throw new Error("useEditMode must be used within EditModeProvider");
  return ctx;
}

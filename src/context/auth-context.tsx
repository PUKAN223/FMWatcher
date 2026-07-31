"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface LineUserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
  channelId?: string;
}

interface AuthContextType {
  user: LineUserProfile | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  authToken: string | null;
  channelId: string;
  channelSecret: string;
  setChannelConfig: (id: string, secret: string) => void;
  loginWithLine: (realProfile?: LineUserProfile, token?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LineUserProfile | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [channelId, setChannelId] = useState<string>("2006123456");
  const [channelSecret, setChannelSecret] = useState<string>("********************************");

  useEffect(() => {
    // Check saved session in localStorage
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("line_user_session");
      const savedToken = localStorage.getItem("line_auth_token");
      const savedChannelId = localStorage.getItem("line_channel_id");
      const savedChannelSecret = localStorage.getItem("line_channel_secret");

      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error("Failed to parse saved LINE user session", e);
        }
      }
      if (savedToken) setAuthToken(savedToken);
      if (savedChannelId) setChannelId(savedChannelId);
      if (savedChannelSecret) setChannelSecret(savedChannelSecret);
    }
  }, []);

  const setChannelConfig = (id: string, secret: string) => {
    setChannelId(id);
    setChannelSecret(secret);
    if (typeof window !== "undefined") {
      localStorage.setItem("line_channel_id", id);
      localStorage.setItem("line_channel_secret", secret);
    }
  };

  const loginWithLine = async (realProfile?: LineUserProfile, token?: string) => {
    setIsAuthenticating(true);

    const profileToSet: LineUserProfile = realProfile || {
      userId: "U" + Math.floor(1000000000 + Math.random() * 9000000000),
      displayName: "FM Watcher Store",
      pictureUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
      statusMessage: "FM Watcher LINE Official Account Active 🟢",
      channelId: channelId || "2006123456",
    };

    setUser(profileToSet);
    if (token) setAuthToken(token);

    if (typeof window !== "undefined") {
      localStorage.setItem("line_user_session", JSON.stringify(profileToSet));
      if (token) localStorage.setItem("line_auth_token", token);
    }
    setIsAuthenticating(false);
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("line_user_session");
      localStorage.removeItem("line_auth_token");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAuthenticating,
        authToken,
        channelId,
        channelSecret,
        setChannelConfig,
        loginWithLine,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

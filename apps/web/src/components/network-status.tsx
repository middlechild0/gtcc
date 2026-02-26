"use client";

import { Alert, AlertDescription, AlertTitle } from "@visyx/ui/alert";
import { AlertCircle, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export function NetworkStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check initial state
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup listeners to prevent memory leaks
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 z-50 animate-in fade-in slide-in-from-bottom-5 sm:left-auto sm:w-[400px]">
      <Alert
        variant="destructive"
        className="border-destructive/50 bg-destructive/10 text-destructive dark:border-destructive dark:bg-destructive/20 shadow-lg backdrop-blur-md"
      >
        <WifiOff className="size-4" />
        <AlertTitle className="flex items-center gap-2 font-semibold">
          You are offline
        </AlertTitle>
        <AlertDescription className="text-destructive/90 text-sm">
          Please check your internet connection. Some features may be
          unavailable until your connection is restored.
        </AlertDescription>
      </Alert>
    </div>
  );
}

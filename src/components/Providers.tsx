"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

export function Providers({ 
  children, 
  session 
}: { 
  children: React.ReactNode; 
  session?: Session | null;
}) {
  return (
    <SessionProvider session={session} refetchOnWindowFocus={true} refetchInterval={0}>
      {children}
    </SessionProvider>
  );
}

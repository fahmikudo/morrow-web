import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { SnapshotSync } from '@/app/SnapshotSync';
import { hasToken, isServerMode, UNAUTHORIZED_EVENT } from '@/services';
import { useUiStore } from '@/stores/ui-store';

export function RequireAuth({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clearAssistantMessages = useUiStore((state) => state.clearAssistantMessages);

  useEffect(() => {
    if (!isServerMode) return;

    const handleUnauthorized = () => {
      queryClient.clear();
      clearAssistantMessages();
      navigate('/login', { replace: true });
    };

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [navigate, queryClient, clearAssistantMessages]);

  if (!isServerMode) return <>{children}</>;
  if (!hasToken()) return <Navigate to="/login" replace />;

  return (
    <>
      <SnapshotSync />
      {children}
    </>
  );
}

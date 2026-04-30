import { useState, useCallback } from 'react';

type ProtectedAction = (...args: any[]) => Promise<void> | void;

export const useSupervisorAuth = () => {
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<ProtectedAction | null>(null);
  const [actionDescription, setActionDescription] = useState('');

  const requireSupervisor = useCallback((description: string, action: ProtectedAction) => {
    setActionDescription(description);
    setPendingAction(() => action);
    setIsPinModalOpen(true);
  }, []);

  const handleSuccess = useCallback((managerId: string) => {
    if (pendingAction) {
      // In a real implementation, you might pass managerId into the action to log who approved it
      pendingAction(managerId);
    }
    setPendingAction(null);
    setIsPinModalOpen(false);
  }, [pendingAction]);

  const handleClose = useCallback(() => {
    setPendingAction(null);
    setIsPinModalOpen(false);
  }, []);

  return {
    isPinModalOpen,
    actionDescription,
    requireSupervisor,
    handleSuccess,
    handleClose
  };
};

import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../utils/appContext';
import { Transaction } from '../utils/appTypes';

export const usePendingTransactions = (selectedKey: string) => {
  const { requestPendingTransactions } = useContext(AppContext);

  const [pendingTransactions, setPending] = useState<Transaction[]>([]);

  useEffect(() => {
    let cleanup = () => {};
    const timeoutId = window.setTimeout(() => {
      if (selectedKey) {
        cleanup =
          requestPendingTransactions(selectedKey, (pending) =>
            setPending(pending),
          ) ?? cleanup;
      }
    }, 0);

    return () => {
      cleanup();
      window.clearTimeout(timeoutId);
    };
  }, [selectedKey, requestPendingTransactions]);

  return pendingTransactions;
};

import { PageShell } from '../components/pageShell';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppContext } from '../utils/appContext';
import DirTree from '../components/dirTree';
import MemoFeed from '../components/memoFeed';
import { IonIcon, useIonModal } from '@ionic/react';
import { terminalOutline, addCircleOutline } from 'ionicons/icons';
import WebsocketConsole from './console';
import Send from './send';
import { indexTransactionsToGraph } from '../utils/indexer';
import { Transaction } from '../utils/appTypes';

const toDisplayPath = (value: string) => {
  const trimmedValue = value.replace(/0+=+$/g, '');
  return trimmedValue || '/';
};

const buildPathSegments = (value: string) => {
  const normalized = toDisplayPath(value);
  if (normalized === '/') {
    return [];
  }

  const parts = normalized.split('/').filter(Boolean);
  let currentPath = '/';

  return parts.map((segment) => {
    currentPath = `${currentPath}${segment}/`;
    return {
      label: segment,
      value: currentPath,
    };
  });
};

const resolveStartHeight = (
  configuredStartHeight: number,
  tipHeight?: number,
) => {
  if (configuredStartHeight > 0) {
    return configuredStartHeight;
  }

  if (tipHeight) {
    return tipHeight + 1;
  }

  return 1;
};

const Explore = () => {
  const {
    graph,
    setGraph,
    tipHeader,
    navigatorPublicKey,
    setNavigatorPublicKey,
    transactionRange,
    requestPkTransactions,
  } =
    useContext(AppContext);

  const [mode, setMode] = useState<'feed' | 'tree'>('feed');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fetchStartHeight, setFetchStartHeight] = useState<number>(0);
  const [canLoadMore, setCanLoadMore] = useState<boolean>(true);
  const [focusTransactionId, setFocusTransactionId] = useState<string | null>(null);
  const [peekGraphKey, setPeekGraphKey] = useState<string>('/');
  const whichKey = useMemo(() => toDisplayPath(peekGraphKey), [peekGraphKey]);
  const clickableSegments = useMemo(() => buildPathSegments(whichKey), [whichKey]);
  const isSpatialContext = whichKey.startsWith('/');

  const [presentSendModal, dismissSend] = useIonModal(Send, {
    onDismiss: (data: string, role: string) => dismissSend(data, role),
    forKey: whichKey,
  });

  const [presentSocketConsole, dismissSocketConsole] = useIonModal(
    WebsocketConsole,
    {
      onDismiss: () => dismissSocketConsole(),
    },
  );

  const fetchTransactions = useCallback((
    startHeight: number,
    endHeight: number,
    replace: boolean,
  ) => {
    if (!navigatorPublicKey) {
      return;
    }

    requestPkTransactions(
      navigatorPublicKey,
      (nextTransactions) => {
        setTransactions((previous) =>
          replace ? nextTransactions : [...previous, ...nextTransactions],
        );
        const minSeries = nextTransactions.reduce((acc, tx) => {
          const value = tx.series ?? Number.MAX_SAFE_INTEGER;
          return Math.min(acc, value);
        }, Number.MAX_SAFE_INTEGER);
        const nextCursor = minSeries === Number.MAX_SAFE_INTEGER ? endHeight : minSeries - 1;
        setFetchStartHeight(nextCursor);
        const floor = transactionRange.endHeight || 1;
        setCanLoadMore(nextTransactions.length >= transactionRange.limit && nextCursor >= floor);
      },
      {
        startHeight,
        endHeight,
        limit: transactionRange.limit,
      },
    );
  }, [
    navigatorPublicKey,
    requestPkTransactions,
    transactionRange.endHeight,
    transactionRange.limit,
  ]);

  useEffect(() => {
    let cleanup = () => {};
      const timeoutId = window.setTimeout(() => {
      if (!navigatorPublicKey) {
        setGraph(null);
        setTransactions([]);
        setCanLoadMore(false);
        return;
      }

      const initialStartHeight = resolveStartHeight(
        transactionRange.startHeight,
        tipHeader?.header.height,
      );
      const initialEndHeight = transactionRange.endHeight;
      setFetchStartHeight(initialStartHeight);
      cleanup =
        requestPkTransactions(
          navigatorPublicKey,
          (transactions) => {
            setTransactions(transactions);
            const minSeries = transactions.reduce((acc, tx) => {
              const value = tx.series ?? Number.MAX_SAFE_INTEGER;
              return Math.min(acc, value);
            }, Number.MAX_SAFE_INTEGER);
            const nextCursor =
              minSeries === Number.MAX_SAFE_INTEGER ? initialEndHeight : minSeries - 1;
            setFetchStartHeight(nextCursor);
            const floor = transactionRange.endHeight || 1;
            setCanLoadMore(
              transactions.length >= transactionRange.limit && nextCursor >= floor,
            );
          },
          {
            startHeight: initialStartHeight,
            endHeight: initialEndHeight,
            limit: transactionRange.limit,
          },
        ) ?? cleanup;
    }, 0);

    return () => {
      cleanup();
      window.clearTimeout(timeoutId);
    };
  }, [
    navigatorPublicKey,
    requestPkTransactions,
    setGraph,
    tipHeader?.header.height,
    transactionRange.endHeight,
    transactionRange.limit,
    transactionRange.startHeight,
  ]);

  useEffect(() => {
    const resultHandler = (data: any) => {
      if (whichKey && data.detail) {
        if (!navigatorPublicKey) {
          return;
        }
        requestPkTransactions(
          navigatorPublicKey,
          (transactions) => {
            setTransactions(transactions);
            const minSeries = transactions.reduce((acc, tx) => {
              const value = tx.series ?? Number.MAX_SAFE_INTEGER;
              return Math.min(acc, value);
            }, Number.MAX_SAFE_INTEGER);
            const nextCursor =
              minSeries === Number.MAX_SAFE_INTEGER ? transactionRange.endHeight : minSeries - 1;
            setFetchStartHeight(nextCursor);
            const floor = transactionRange.endHeight || 1;
            setCanLoadMore(
              transactions.length >= transactionRange.limit && nextCursor >= floor,
            );
          },
          {
            startHeight: resolveStartHeight(
              transactionRange.startHeight,
              tipHeader?.header.height,
            ),
            endHeight: transactionRange.endHeight,
            limit: transactionRange.limit,
          },
        );
      }
    };

    document.addEventListener('inv_block', resultHandler);

    return () => {
      document.removeEventListener('inv_block', resultHandler);
    };
  }, [
    navigatorPublicKey,
    requestPkTransactions,
    tipHeader?.header.height,
    transactionRange.endHeight,
    transactionRange.limit,
    transactionRange.startHeight,
    whichKey,
  ]);

  useEffect(() => {
    if (!navigatorPublicKey) {
      setGraph(null);
      return;
    }

    setGraph(indexTransactionsToGraph(transactions, navigatorPublicKey));
  }, [navigatorPublicKey, setGraph, transactions]);

  const loadMore = useCallback(() => {
    if (!canLoadMore) {
      return;
    }

    const floor = transactionRange.endHeight || 1;
    const nextStartHeight = fetchStartHeight;
    if (nextStartHeight < floor) {
      setCanLoadMore(false);
      return;
    }
    fetchTransactions(nextStartHeight, floor, false);
  }, [canLoadMore, fetchStartHeight, fetchTransactions, transactionRange.endHeight]);

  return (
    <PageShell
      tools={[
        {
          label: 'Send',
          renderIcon: () => <IonIcon
            slot="icon-only"
            icon={addCircleOutline}
          />,
          action: () => presentSendModal(),
        },
        {
          label: 'WebSocket console',
          renderIcon: () => <IonIcon slot="icon-only" icon={terminalOutline} />,
          action: () => presentSocketConsole(),
        },
      ]}
      renderBody={() => (
        <>
          {!!whichKey && (
            <>
              <div
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 20,
                  background: 'var(--ion-background-color)',
                  borderBottom: '1px solid var(--ion-color-step-150)',
                  padding: '8px 0',
                  marginBottom: 8,
                }}
              >
                <div style={{ fontFamily: 'monospace, monospace', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => {
                    setPeekGraphKey('/');
                    if (mode === 'feed') {
                      setMode('tree');
                    }
                  }} style={{ border: 'none', background: 'transparent', color: 'var(--ion-color-primary)', textDecoration: 'underline' }}>
                    ..
                  </button>
                  <code>/</code>
                  {isSpatialContext ? (
                    clickableSegments.map((segment, index) => (
                      <div key={segment.value} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <button type="button" onClick={() => {
                          setPeekGraphKey(segment.value);
                          if (mode === 'feed') {
                            setMode('tree');
                          }
                        }} style={{ border: 'none', background: 'transparent', color: 'var(--ion-color-primary)', textDecoration: 'underline' }}>
                          {segment.label}
                        </button>
                        {index < clickableSegments.length - 1 && <code>/</code>}
                      </div>
                    ))
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (mode === 'feed') {
                          setMode('tree');
                        }
                      }}
                      style={{ border: 'none', background: 'transparent', color: 'var(--ion-color-primary)', textDecoration: 'underline' }}
                    >
                      {whichKey}
                    </button>
                  )}
                </div>
              </div>
              {!!graph && (
                <>
                  {mode === 'tree' && (
                    <DirTree
                      forKey={whichKey}
                      nodes={graph.nodes ?? []}
                      links={graph.links ?? []}
                      transactions={transactions}
                      setForKey={setPeekGraphKey}
                      onLeafOpen={(txId) => {
                        setMode('feed');
                        setFocusTransactionId(txId);
                      }}
                    />
                  )}
                  {mode === 'feed' && (
                    <MemoFeed
                      transactions={transactions}
                      onLoadMore={loadMore}
                      canLoadMore={canLoadMore}
                      focusTransactionId={focusTransactionId}
                      onSwitchNavigator={(nextKey) => {
                        setNavigatorPublicKey(nextKey);
                        setPeekGraphKey(nextKey);
                        setMode('feed');
                      }}
                      onActiveEntryChange={(context) => {
                        setFocusTransactionId(null);
                        if (context.path) {
                          setPeekGraphKey(context.path);
                          return;
                        }
                        if (context.key) {
                          setPeekGraphKey(context.key);
                          return;
                        }
                        if (mode === 'feed') {
                          setPeekGraphKey('/');
                        }
                      }}
                    />
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    />
  );
};

export default Explore;

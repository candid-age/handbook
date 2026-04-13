import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonText,
} from '@ionic/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Transaction } from '../../utils/appTypes';
import { getMemoContent } from '../../utils/memoContent';
import { transactionID } from '../../utils/compat';

type FeedItem = Transaction & {
  txId: string;
};

type FeedEntry = {
  entryId: string;
  tx: FeedItem;
  kind: 'memo' | 'drill_in' | 'drill_out';
  path: string | null;
  targetKey: string | null;
};

export type ActiveFeedEntryContext = {
  kind: FeedEntry['kind'];
  path: string | null;
  key: string | null;
  txId: string;
};

const normalizePath = (value?: string) => {
  if (!value?.startsWith('/')) {
    return null;
  }

  const compact = `${value.replace(/0+=+$/g, '').replace(/\/{2,}/g, '/')}`;
  if (compact === '/') {
    return '/';
  }

  return compact.endsWith('/') ? compact : `${compact}/`;
};

const isSpatialKey = (value?: string) => Boolean(value?.startsWith('/'));

const byNewest = (a: FeedItem, b: FeedItem) => {
  const aSeries = a.series ?? 0;
  const bSeries = b.series ?? 0;

  if (aSeries !== bSeries) {
    return bSeries - aSeries;
  }

  if (a.time !== b.time) {
    return b.time - a.time;
  }

  return a.txId < b.txId ? 1 : -1;
};

const byEntryOrder = (a: FeedEntry, b: FeedEntry) => {
  const txnComparison = byNewest(a.tx, b.tx);
  if (txnComparison !== 0) {
    return txnComparison;
  }

  const rank = {
    memo: 0,
    drill_in: 1,
    drill_out: 2,
  } as const;

  return rank[a.kind] - rank[b.kind];
};

export const normalizeFeedTransactions = (transactions: Transaction[]) => {
  const unique = new Map<string, FeedItem>();

  transactions.forEach((transaction) => {
    const txId = transactionID(transaction);
    unique.set(txId, {
      ...transaction,
      txId,
    });
  });

  return Array.from(unique.values()).sort(byNewest).slice(0, 500);
};

const buildEntries = (transactions: Transaction[]) => {
  const entries: FeedEntry[] = [];

  normalizeFeedTransactions(transactions).forEach((tx) => {
    const destinationPath = normalizePath(tx.to);

    if (destinationPath) {
      entries.push({
        entryId: `${tx.txId}:memo`,
        tx,
        kind: 'memo',
        path: destinationPath,
        targetKey: tx.to,
      });
    } else {
      entries.push({
        entryId: `${tx.txId}:drill-in`,
        tx,
        kind: 'drill_in',
        path: null,
        targetKey: tx.to,
      });
    }

    if (tx.from && !isSpatialKey(tx.from)) {
      entries.push({
        entryId: `${tx.txId}:drill-out`,
        tx,
        kind: 'drill_out',
        path: null,
        targetKey: tx.from,
      });
    }
  });

  return entries.sort(byEntryOrder);
};

const MemoFeed = ({
  transactions,
  canLoadMore,
  onLoadMore,
  focusTransactionId,
  onSwitchNavigator,
  onActiveEntryChange,
}: {
  transactions: Transaction[];
  canLoadMore: boolean;
  onLoadMore: () => void;
  focusTransactionId?: string | null;
  onSwitchNavigator: (publicKey: string) => void;
  onActiveEntryChange: (context: ActiveFeedEntryContext) => void;
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const loadRequestedForLengthRef = useRef<number>(-1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [renderedCount, setRenderedCount] = useState(1);

  const feedEntries = useMemo(() => buildEntries(transactions), [transactions]);

  useEffect(() => {
    setActiveIndex(0);
    setRenderedCount(1);
    loadRequestedForLengthRef.current = -1;
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [transactions]);

  useEffect(() => {
    const activeEntry = feedEntries[activeIndex];
    if (activeEntry) {
      onActiveEntryChange({
        kind: activeEntry.kind,
        path: activeEntry.path,
        key: activeEntry.targetKey,
        txId: activeEntry.tx.txId,
      });
    }
  }, [activeIndex, feedEntries, onActiveEntryChange]);

  useEffect(() => {
    if (!focusTransactionId || !scrollRef.current) {
      return;
    }

    const index = feedEntries.findIndex(
      (entry) => entry.tx.txId === focusTransactionId && entry.kind === 'memo',
    );
    if (index < 0) {
      return;
    }

    setRenderedCount((previous) => Math.max(previous, index + 1));
    const viewportHeight = scrollRef.current.clientHeight;
    scrollRef.current.scrollTo({ top: viewportHeight * index, behavior: 'smooth' });
    setActiveIndex(index);
  }, [feedEntries, focusTransactionId]);

  useEffect(() => {
    if (activeIndex >= renderedCount - 1 && renderedCount < feedEntries.length) {
      setRenderedCount((previous) => Math.min(feedEntries.length, previous + 1));
      return;
    }

    if (
      activeIndex >= feedEntries.length - 1 &&
      canLoadMore &&
      loadRequestedForLengthRef.current !== feedEntries.length
    ) {
      loadRequestedForLengthRef.current = feedEntries.length;
      onLoadMore();
    }
  }, [activeIndex, renderedCount, feedEntries.length, canLoadMore, onLoadMore]);

  const visibleEntries = feedEntries.slice(0, renderedCount);

  return (
    <div
      ref={scrollRef}
      onScroll={(event) => {
        const viewportHeight = event.currentTarget.clientHeight || 1;
        const index = Math.round(event.currentTarget.scrollTop / viewportHeight);
        if (index !== activeIndex) {
          setActiveIndex(index);
        }
      }}
      style={{
        overflowY: 'auto',
        height: 'calc(100vh - 220px)',
        scrollSnapType: 'y mandatory',
      }}
    >
      {visibleEntries.map((entry) => {
        const { tx } = entry;
        const content = getMemoContent(tx.memo);

        return (
          <div
            key={entry.entryId}
            id={`feed-item-${entry.entryId}`}
            style={{ scrollSnapAlign: 'start', minHeight: 'calc(100vh - 220px)' }}
          >
            <IonCard>
              <IonCardHeader>
                <IonCardSubtitle>{tx.txId.slice(0, 14)}…</IonCardSubtitle>
                <IonCardTitle style={{ fontSize: 14 }}>
                  series: {tx.series ?? 'n/a'} · time: {tx.time}
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {entry.kind === 'drill_in' && (
                  <>
                    <IonText>
                      <p style={{ marginTop: 0 }}>
                        Drill-in entry: switch to destination navigator key
                        {' '}
                        <code>{tx.to}</code>
                        .
                      </p>
                    </IonText>
                    <IonButton size="small" fill="outline" onClick={() => onSwitchNavigator(tx.to)}>
                      Drill in
                    </IonButton>
                  </>
                )}

                {entry.kind === 'drill_out' && (
                  <>
                    <IonText>
                      <p style={{ marginTop: 0 }}>
                        Drill-out entry: switch to source navigator key
                        {' '}
                        <code>{tx.from}</code>
                        .
                      </p>
                    </IonText>
                    <IonButton
                      size="small"
                      fill="outline"
                      onClick={() => onSwitchNavigator(tx.from as string)}
                    >
                      Drill out
                    </IonButton>
                  </>
                )}

                {entry.kind === 'memo' && (
                  <>
                    {content.type === 'empty' && (
                      <IonText color="medium">
                        <p style={{ margin: 0, fontSize: 12 }}>{content.text}</p>
                      </IonText>
                    )}

                    {content.type === 'text' && (
                      <IonText>
                        <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{content.text}</p>
                      </IonText>
                    )}

                    {content.type === 'url' && (
                      <iframe
                        title="Memo web content"
                        src={content.url}
                        style={{ width: '100%', height: '65vh', border: 'none', borderRadius: 8 }}
                        referrerPolicy="strict-origin-when-cross-origin"
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                      />
                    )}

                    {content.type === 'youtube' && (
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          paddingBottom: '177.78%',
                        }}
                      >
                        <iframe
                          title="Memo YouTube short"
                          src={`https://www.youtube.com/embed/${content.videoId}?autoplay=1&mute=1&playsinline=1`}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            border: 'none',
                          }}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </>
                )}
              </IonCardContent>
            </IonCard>
          </div>
        );
      })}
    </div>
  );
};

export default MemoFeed;

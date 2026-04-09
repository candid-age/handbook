import { useMemo, useState } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonCardHeader,
  IonCardSubtitle,
  IonButtons,
  IonHeader,
  IonItem,
  IonList,
  IonModal,
  IonToolbar,
  IonPage,
  IonText,
  IonTitle,
  IonIcon,
} from '@ionic/react';
import { documentTextOutline, linkOutline, logoYoutube } from 'ionicons/icons';
import { Transaction } from '../../utils/appTypes';

const MAX_TREE_DEPTH = 8;

interface TreeNode {
  pubkey: string;
  memo?: string;
  children: TreeNode[];
}

type MemoContent =
  | { type: 'youtube'; videoId: string }
  | { type: 'url'; url: string }
  | { type: 'text'; text: string };

const trimPubkeyDisplay = (value: string) => {
  const trimmedValue = value.replace(/0+=+$/g, '');
  return trimmedValue.length > 0 ? trimmedValue : value;
};

const pathLeafName = (value: string) => {
  if (!value.includes('/')) {
    return value;
  }

  const parts = value.split('/').filter(Boolean);
  return parts.at(-1) ?? value;
};

const getYouTubeVideoId = (value?: string) => {
  if (!value?.trim()) {
    return null;
  }

  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, '');

    if (host === 'youtu.be') {
      const shortId = url.pathname.split('/').filter(Boolean)[0];
      return shortId && /^[\w-]{11}$/.test(shortId) ? shortId : null;
    }

    if (!host.endsWith('youtube.com')) {
      return null;
    }

    const segments = url.pathname.split('/').filter(Boolean);
    if (segments[0] === 'shorts' || segments[0] === 'embed') {
      const embeddedId = segments[1];
      return embeddedId && /^[\w-]{11}$/.test(embeddedId) ? embeddedId : null;
    }

    const watchId = url.searchParams.get('v');
    return watchId && /^[\w-]{11}$/.test(watchId) ? watchId : null;
  } catch {
    return null;
  }
};

const getMemoContent = (memo?: string): MemoContent | null => {
  const trimmedMemo = memo?.trim();
  if (!trimmedMemo) {
    return null;
  }

  const youtubeVideoId = getYouTubeVideoId(trimmedMemo);
  if (youtubeVideoId) {
    return {
      type: 'youtube',
      videoId: youtubeVideoId,
    };
  }

  try {
    const parsedUrl = new URL(trimmedMemo);
    if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
      return {
        type: 'url',
        url: parsedUrl.toString(),
      };
    }
  } catch {
    // fall back to plain text rendering
  }

  return {
    type: 'text',
    text: trimmedMemo,
  };
};

const getMemoIcon = (memoContent: MemoContent | null) => {
  if (!memoContent) {
    return null;
  }

  if (memoContent.type === 'youtube') {
    return logoYoutube;
  }

  if (memoContent.type === 'url') {
    return linkOutline;
  }

  return documentTextOutline;
};

const MemoModal = ({
  onDismiss,
  content,
}: {
  onDismiss: () => void;
  content: MemoContent;
}) => {
  const renderMemoContent = () => {
    if (content.type === 'youtube') {
      return (
        <div style={{ position: 'relative', width: '100%', paddingBottom: '177.78%' }}>
          <iframe
            title="Memo YouTube short"
            src={`https://www.youtube.com/embed/${content.videoId}?autoplay=1&playsinline=1`}
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
      );
    }

    if (content.type === 'url') {
      return (
        <iframe
          title="Memo web content"
          src={content.url}
          style={{ width: '100%', height: '75vh', border: 'none', borderRadius: 8 }}
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      );
    }

    return (
      <IonText>
        <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{content.text}</p>
      </IonText>
    );
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton color="medium" onClick={() => onDismiss()}>
              Close
            </IonButton>
          </IonButtons>
          <IonTitle>Memo</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardContent>{renderMemoContent()}</IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

function DirTree({
  forKey,
  setForKey,
  transactions,
}: {
  forKey: string;
  setForKey: (pk: string) => void;
  transactions: Transaction[];
}) {
  const rootTree = useMemo(() => {
    if (!forKey) {
      return null;
    }

    const outgoingMap = new Map<string, { to: string; memo?: string }[]>();

    transactions.forEach((transaction) => {
      if (!transaction.from || !transaction.to) {
        return;
      }

      outgoingMap.set(transaction.from, [
        ...(outgoingMap.get(transaction.from) ?? []),
        { to: transaction.to, memo: transaction.memo },
      ]);
    });

    const buildTree = (currentKey: string, depth: number, path: Set<string>): TreeNode => {
      if (depth >= MAX_TREE_DEPTH) {
        return { pubkey: currentKey, children: [] };
      }

      let outgoing = outgoingMap.get(currentKey) ?? [];

      if (!outgoing.length && depth === 0) {
        outgoing = transactions
          .filter((transaction) => transaction.to === currentKey && transaction.from)
          .map((transaction) => ({ to: transaction.from as string, memo: transaction.memo }));
      }

      const uniqueChildren = new Map<string, { memo?: string }>();
      outgoing.forEach(({ to, memo }) => {
        if (!uniqueChildren.has(to)) {
          uniqueChildren.set(to, { memo });
        }
      });

      const children = [...uniqueChildren.entries()]
        .filter(([to]) => !path.has(to))
        .map(([to, payload]) => {
          const nextPath = new Set(path);
          nextPath.add(to);
          const child = buildTree(to, depth + 1, nextPath);
          return {
            ...child,
            memo: payload.memo,
          };
        });

      return {
        pubkey: currentKey,
        children,
      };
    };

    return buildTree(forKey, 0, new Set([forKey]));
  }, [forKey, transactions]);

  return (
    <IonCard>
      <IonCardHeader className="ion-padding-horizontal">
        <IonCardSubtitle
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
              fontFamily: 'monospace, monospace',
              minHeight: '30px',
            }}
          >
            <span>Public key:</span>
            <code>{trimPubkeyDisplay(forKey)}</code>
          </div>
        </IonCardSubtitle>
      </IonCardHeader>
      <IonCardContent>
        {!rootTree && <p>Set a public key to load transactions.</p>}
        {rootTree && rootTree.children.length === 0 && <p>No entries available for this key.</p>}
        {rootTree && rootTree.children.length > 0 && (
          <TreeBranch
            branch={rootTree}
            isRoot={true}
            onNodeClick={(pubkey) => setForKey(pubkey)}
            currentKey={forKey}
          />
        )}
      </IonCardContent>
    </IonCard>
  );
}

const TreeBranch = ({
  branch,
  onNodeClick,
  currentKey,
  isRoot = false,
}: {
  branch: TreeNode;
  onNodeClick: (pubkey: string) => void;
  currentKey: string;
  isRoot?: boolean;
}) => {
  const trimmedPubkey = trimPubkeyDisplay(branch.pubkey);
  const isCurrentNode = branch.pubkey === currentKey;
  const [activeMemo, setActiveMemo] = useState<MemoContent | null>(null);
  const memoContent = getMemoContent(branch.memo);
  const memoIcon = getMemoIcon(memoContent);

  return (
    <div
      style={{
        borderLeft: isRoot ? 'none' : '1px solid var(--ion-color-medium)',
        marginLeft: isRoot ? 0 : 8,
        paddingLeft: isRoot ? 0 : 12,
        marginBottom: 8,
      }}
    >
      <IonList inset={true}>
        <IonItem
          button={true}
          detail={true}
          color={isCurrentNode ? 'primary' : undefined}
          onClick={() => {
            if (isCurrentNode && memoContent) {
              setActiveMemo(memoContent);
              return;
            }
            onNodeClick(branch.pubkey);
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              overflow: 'hidden',
            }}
          >
            <code style={{ opacity: 0.75 }}>{pathLeafName(trimmedPubkey)}</code>
          </div>
          {isCurrentNode && memoIcon && (
            <IonIcon
              slot="end"
              icon={memoIcon}
              aria-label={`Memo ${memoContent?.type ?? 'content'} icon`}
            />
          )}
        </IonItem>
      </IonList>

      {branch.children.length > 0 && (
        <div style={{ marginTop: 4 }}>
          {branch.children.map((child) => (
            <TreeBranch
              key={`${branch.pubkey}-${child.pubkey}`}
              branch={child}
              onNodeClick={onNodeClick}
              currentKey={currentKey}
            />
          ))}
        </div>
      )}

      <IonModal isOpen={Boolean(activeMemo)} onDidDismiss={() => setActiveMemo(null)}>
        {activeMemo && <MemoModal onDismiss={() => setActiveMemo(null)} content={activeMemo} />}
      </IonModal>
    </div>
  );
};

export default DirTree;

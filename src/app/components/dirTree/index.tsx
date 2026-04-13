import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
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
import { GraphLink, GraphNode, Transaction } from '../../utils/appTypes';
import { getMemoContent, MemoContent } from '../../utils/memoContent';
import { transactionID } from '../../utils/compat';

const MAX_TREE_DEPTH = 8;

interface TreeNode {
  node: GraphNode;
  incoming: GraphLink[];
  outgoing: GraphLink[];
  children: TreeNode[];
}

const isValidAbsolutePath = (value?: string) => {
  if (!value || !value.startsWith('/')) {
    return false;
  }

  if (value === '/') {
    return true;
  }

  return !value.includes('\0') && !value.includes('//');
};

const pathLeafName = (value: string) => {
  if (value === '/') {
    return '/';
  }

  const parts = value.split('/').filter(Boolean);
  return parts.at(-1) ?? value;
};

const trimPubkeyDisplay = (value: string) => {
  const trimmedValue = value.replace(/0+=+$/g, '');
  return trimmedValue.length > 0 ? trimmedValue : value;
};

const toDisplayPath = (value: string) => {
  const trimmed = trimPubkeyDisplay(value);
  return trimmed || '/';
};

const getMemoIcon = (memoContent: MemoContent) => {
  if (memoContent.type === 'empty') {
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

    if (content.type === 'empty') {
      return (
        <IonText color="medium">
          <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{content.text}</p>
        </IonText>
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
  nodes,
  links,
  transactions,
  onLeafOpen,
}: {
  forKey: string;
  setForKey: (pk: string) => void;
  nodes: GraphNode[];
  links: GraphLink[];
  transactions: Transaction[];
  onLeafOpen?: (txId: string) => void;
}) {
  const [selectedLeaf, setSelectedLeaf] = useState<string | null>(null);

  useEffect(() => {
    setSelectedLeaf(null);
  }, [forKey]);

  const handleNodeFocus = useCallback(
    (node: GraphNode | null | undefined) => {
      if (node?.pubkey) {
        setForKey(toDisplayPath(node.pubkey));
      }
    },
    [setForKey],
  );

  const initialNode = useMemo(() => {
    const displayKey = toDisplayPath(forKey);
    const node = nodes.find((n) => toDisplayPath(n.pubkey) === displayKey);
    return node && isValidAbsolutePath(toDisplayPath(node.pubkey)) ? node : null;
  }, [nodes, forKey]);

  useEffect(() => {
    handleNodeFocus(initialNode);
  }, [initialNode, handleNodeFocus]);

  const [visibleData, setVisibleData] = useState<{
    nodes: GraphNode[];
    links: GraphLink[];
  }>({
    nodes: [],
    links: [],
  });

  const buildTree = useCallback(
    (
      currentNode: GraphNode,
      depth: number,
      path: Set<number>,
      sourceMap: Map<number, GraphLink[]>,
      targetMap: Map<number, GraphLink[]>,
      nodeMap: Map<number, GraphNode>,
    ): TreeNode => {
      const outgoing = sourceMap.get(currentNode.id) ?? [];
      const incoming = targetMap.get(currentNode.id) ?? [];

      if (depth >= MAX_TREE_DEPTH) {
        return {
          node: currentNode,
          outgoing,
          incoming,
          children: [],
        };
      }

      const children = outgoing
        .map((link) => nodeMap.get(link.target))
        .filter((candidate): candidate is GraphNode => {
          return Boolean(candidate && !path.has(candidate.id));
        })
        .map((candidate) => {
          const nextPath = new Set(path);
          nextPath.add(candidate.id);
          return buildTree(
            candidate,
            depth + 1,
            nextPath,
            sourceMap,
            targetMap,
            nodeMap,
          );
        });

      return {
        node: currentNode,
        outgoing,
        incoming,
        children,
      };
    },
    [],
  );

  const rootTree = useMemo(() => {
    if (!initialNode) {
      return null;
    }

    const sourceMap = new Map<number, GraphLink[]>();
    const targetMap = new Map<number, GraphLink[]>();
    const nodeMap = new Map<number, GraphNode>(nodes.map((node) => [node.id, node]));

    for (const link of visibleData.links) {
      sourceMap.set(link.source, [...(sourceMap.get(link.source) ?? []), link]);
      targetMap.set(link.target, [...(targetMap.get(link.target) ?? []), link]);
    }

    return buildTree(
      initialNode,
      0,
      new Set<number>([initialNode.id]),
      sourceMap,
      targetMap,
      nodeMap,
    );
  }, [buildTree, initialNode, nodes, visibleData.links]);

  useEffect(() => {
    if (!initialNode) {
      setVisibleData({ nodes: [], links: [] });
      return;
    }

    const applicableLinks = links.filter((link) => {
      const targetNode = nodes.find((candidate) => candidate.id === link.target);
      return isValidAbsolutePath(targetNode?.pubkey);
    });

    const applicableNodeIds = new Set<number>([
      initialNode.id,
      ...applicableLinks.map((link) => link.source),
      ...applicableLinks.map((link) => link.target),
    ]);

    const applicableNodes = nodes.filter((node) => applicableNodeIds.has(node.id));

    setVisibleData({
      nodes: applicableNodes,
      links: applicableLinks,
    });
  }, [initialNode, links, nodes]);

  return (
    <IonCard>
      <IonCardContent>
        {!rootTree && <p>No entries available for this key.</p>}
        {rootTree && (
          <TreeBranch
            branch={rootTree}
            isRoot={true}
            onNodeClick={(node) => handleNodeFocus(node)}
            currentKey={forKey}
            onLeafSelect={(pubkey) => setSelectedLeaf(pubkey)}
            onLeafOpen={onLeafOpen}
          />
        )}
        {!!selectedLeaf && (
          <LeafMemoFeed
            leafKey={selectedLeaf}
            transactions={transactions}
            onOpen={(txId) => {
              if (onLeafOpen) {
                onLeafOpen(txId);
              }
            }}
            onClose={() => setSelectedLeaf(null)}
          />
        )}
      </IonCardContent>
    </IonCard>
  );
}

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

const trimPubkeyForMatch = (value?: string) => `${value ?? ''}`.replace(/0+=+$/g, '');

const LeafMemoFeed = ({
  leafKey,
  transactions,
  onOpen,
  onClose,
}: {
  leafKey: string;
  transactions: Transaction[];
  onOpen: (txId: string) => void;
  onClose: () => void;
}) => {
  const normalizedLeafPath = normalizePath(leafKey) ?? trimPubkeyForMatch(leafKey);
  const entries = useMemo(() => {
    return transactions
      .filter((tx) => {
        const pathMatch = normalizePath(tx.to);
        if (pathMatch) {
          return pathMatch === normalizedLeafPath;
        }
        return trimPubkeyForMatch(tx.to) === normalizedLeafPath;
      })
      .sort((a, b) => {
        const aSeries = a.series ?? 0;
        const bSeries = b.series ?? 0;
        if (aSeries !== bSeries) {
          return bSeries - aSeries;
        }
        return b.time - a.time;
      });
  }, [normalizedLeafPath, transactions]);

  if (!entries.length) {
    return null;
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <strong>Leaf sub-feed</strong>
        <IonButton size="small" fill="clear" onClick={() => onClose()}>
          Close
        </IonButton>
      </div>
      <IonList inset={true}>
        {entries.map((tx, index) => {
          const memoContent = getMemoContent(tx.memo);
          const memoIcon = getMemoIcon(memoContent);
          return (
            <IonItem
              key={`${tx.time}-${tx.series ?? 0}-${index}`}
              button={true}
              detail={true}
              onClick={() => onOpen(transactionID(tx))}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
                <code>{`series ${tx.series ?? 'n/a'} · time ${tx.time}`}</code>
                <small style={{ opacity: 0.75, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {memoContent.type === 'text' || memoContent.type === 'empty'
                    ? memoContent.text
                    : memoContent.type}
                </small>
              </div>
              {memoIcon && <IonIcon slot="end" icon={memoIcon} />}
            </IonItem>
          );
        })}
      </IonList>
    </div>
  );
};

const TreeBranch = ({
  branch,
  onNodeClick,
  currentKey,
  isRoot = false,
  depth = 0,
  maxVisibleDepth = 1,
  onLeafSelect,
  onLeafOpen,
}: {
  branch: TreeNode;
  onNodeClick: (node: GraphNode) => void;
  currentKey: string;
  isRoot?: boolean;
  depth?: number;
  maxVisibleDepth?: number;
  onLeafSelect?: (pubkey: string) => void;
  onLeafOpen?: (txId: string) => void;
}) => {

  const trimmedPubkey = toDisplayPath(branch.node.pubkey);
  const isCurrentNode = toDisplayPath(branch.node.pubkey) === toDisplayPath(currentKey);
  const [activeMemo, setActiveMemo] = useState<MemoContent | null>(null);
  const memoContent = getMemoContent(branch.node.memo);
  const memoIcon = getMemoIcon(memoContent);
  const isCurrentNodeWithoutMemo = isCurrentNode && memoContent.type === 'empty';
  const isNodeButtonEnabled = !isCurrentNodeWithoutMemo;
  const isLeaf = branch.children.length === 0;

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
          button={isNodeButtonEnabled}
          detail={true}
          disabled={!isNodeButtonEnabled}
          color={isCurrentNode ? 'primary' : undefined}
          onClick={() => {
            if (!isNodeButtonEnabled) {
              return;
            }
            if (isCurrentNode && isLeaf) {
              if (onLeafSelect) {
                onLeafSelect(branch.node.pubkey);
                return;
              }
            }
            if (isCurrentNode && memoContent) {
              if (onLeafOpen && branch.node.memoTransactionId) {
                onLeafOpen(branch.node.memoTransactionId);
                return;
              }
              setActiveMemo(memoContent);
              return;
            }
            onNodeClick(branch.node);
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

      {branch.children.length > 0 && depth < maxVisibleDepth && (
        <div style={{ marginTop: 4 }}>
          {branch.children.map((child) => (
            <TreeBranch
              key={`${branch.node.id}-${child.node.id}`}
              branch={child}
              onNodeClick={onNodeClick}
              currentKey={currentKey}
              depth={depth + 1}
              maxVisibleDepth={maxVisibleDepth}
              onLeafSelect={onLeafSelect}
              onLeafOpen={onLeafOpen}
            />
          ))}
        </div>
      )}

      <IonModal isOpen={Boolean(activeMemo)} onDidDismiss={() => setActiveMemo(null)}>
        {activeMemo && (
          <MemoModal
            onDismiss={() => setActiveMemo(null)}
            content={activeMemo}
          />
        )}
      </IonModal>
    </div>
  );
};

export default DirTree;

import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonRange,
  useIonModal,
} from '@ionic/react';
import { useKeyDetails } from '../keyChip';
import {
  optionsOutline,
  timerOutline,
  addCircleOutline,
  discOutline,
  sunnyOutline,
  chevronExpandOutline,
  arrowRedoOutline,
} from 'ionicons/icons';
import { AppContext } from '../../utils/appContext';
import { shortenB64 } from '../../utils/compat';
import { GraphLink, GraphNode } from '../../utils/appTypes';
import Sequence from '../../modals/sequence';
import Assert from '../../modals/assert';

const MAX_TREE_DEPTH = 8;

interface TreeNode {
  node: GraphNode;
  incoming: GraphLink[];
  outgoing: GraphLink[];
  children: TreeNode[];
}

function FlowMap({
  forKey,
  setForKey,
  nodes,
  links,
  rankingFilter,
}: {
  forKey: string;
  setForKey: (pk: string) => void;
  nodes: GraphNode[];
  links: GraphLink[];
  rankingFilter: number;
  colorScheme: 'light' | 'dark';
}) {
  const [presentKV] = useKeyDetails(forKey);

  const [presentBlockModal, dismissBlock] = useIonModal(Sequence, {
    onDismiss: (data: string, role: string) => dismissBlock(data, role),
  });

  const [presentPointModal, dismissPoint] = useIonModal(Assert, {
    onDismiss: (data: string, role: string) => dismissPoint(data, role),
    forKey,
  });

  const handleNodeFocus = useCallback(
    (node: GraphNode | null | undefined, clicked: boolean = false) => {
      if (node?.pubkey === forKey && clicked) {
        presentKV({
          initialBreakpoint: 0.75,
          breakpoints: [0, 0.75, 1],
        });
      } else {
        if (node?.id === -1) {
          presentPointModal();
        } else if (node?.pubkey) {
          setForKey(node.pubkey);
        }
      }
    },
    [forKey, setForKey, presentKV, presentPointModal],
  );

  const initialNode = useMemo(
    () => nodes.find((n) => n.pubkey === forKey),
    [nodes, forKey],
  );

  useEffect(() => {
    handleNodeFocus(initialNode);
  }, [initialNode, handleNodeFocus]);

  const [present, dismiss] = useIonModal(Filters, {
    onDismiss: () => dismiss(),
    value: rankingFilter,
  });

  const handleSearch = (ev: Event) => {
    const target = ev.target as HTMLIonSearchbarElement;
    if (!target) return;

    const value = target.value!;

    if (!value) {
      return;
    }

    if (new RegExp('[A-Za-z0-9/+]{43}=').test(value)) {
      setForKey(value);
    } else {
      //remove non Base64 characters eg: @&!; etc and pad with 00000
      const query = `${value.replace(/[^A-Za-z0-9/+]/gi, '').padEnd(43, '0')}=`;
      setForKey(query);
    }
  };

  const [collapsedToImmediate, setCollapsedToImmediate] = useState(false);

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

    if (collapsedToImmediate) {
      const immediateLinks = links.filter(
        (link) => link.source === initialNode.id || link.target === initialNode.id,
      );

      const immediateNodeIds = new Set<number>([
        initialNode.id,
        ...immediateLinks.map((link) => link.source),
        ...immediateLinks.map((link) => link.target),
      ]);

      setVisibleData({
        nodes: nodes.filter((node) => immediateNodeIds.has(node.id)),
        links: immediateLinks,
      });
      return;
    }

    setVisibleData({
      nodes,
      links,
    });
  }, [collapsedToImmediate, initialNode, links, nodes]);

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
          <IonInput
            style={{ fontFamily: 'monospace, monospace', minHeight: '30px' }}
            aria-label="for-key"
            type="url"
            enterkeyhint="go"
            fill="outline"
            clearOnEdit={true}
            debounce={1000}
            value={forKey}
            onIonChange={(ev) => handleSearch(ev)}
          />
        </IonCardSubtitle>
        <IonCardSubtitle className="ion-no-padding">
          <IonButton
            className="ion-no-padding"
            fill="clear"
            onClick={(e) => {
              e.stopPropagation();
              present({
                initialBreakpoint: 0.75,
                breakpoints: [0, 0.75, 1],
              });
            }}
          >
            <IonIcon color="primary" slot="icon-only" icon={optionsOutline} />
            <IonBadge
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                opacity: 0.9,
              }}
              className="ion-no-padding"
              color="danger"
            ></IonBadge>
          </IonButton>
          <IonButton onClick={() => presentBlockModal()} fill="clear">
            <IonIcon
              className="ion-no-padding"
              color="primary"
              slot="icon-only"
              icon={timerOutline}
            />
          </IonButton>
          <IonButton onClick={() => presentPointModal()} fill="clear">
            <IonIcon
              className="ion-no-padding"
              color="primary"
              slot="icon-only"
              icon={addCircleOutline}
            />
          </IonButton>
          <IonButton onClick={() => setCollapsedToImmediate(true)} fill="clear">
            <IonIcon
              className="ion-no-padding"
              color="primary"
              slot="icon-only"
              icon={discOutline}
            />
          </IonButton>
          <IonButton onClick={() => setCollapsedToImmediate(false)} fill="clear">
            <IonIcon
              className="ion-no-padding"
              color="primary"
              slot="icon-only"
              icon={sunnyOutline}
            />
          </IonButton>
        </IonCardSubtitle>
      </IonCardHeader>
      <IonCardContent>
        {!rootTree && <p>No graph data available for this key.</p>}
        {rootTree && (
          <TreeBranch
            branch={rootTree}
            isRoot={true}
            onNodeClick={(node) => handleNodeFocus(node, true)}
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
  onNodeClick: (node: GraphNode) => void;
  currentKey: string;
  isRoot?: boolean;
}) => {
  const [expanded, setExpanded] = useState(true);

  const isCurrent = branch.node.pubkey === currentKey;

  return (
    <div
      style={{
        borderLeft: isRoot ? 'none' : '1px solid var(--ion-color-medium)',
        marginLeft: isRoot ? 0 : 8,
        paddingLeft: isRoot ? 0 : 12,
        marginBottom: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <IonButton size="small" fill={isCurrent ? 'solid' : 'outline'} onClick={() => onNodeClick(branch.node)}>
          <IonIcon icon={isCurrent ? chevronExpandOutline : arrowRedoOutline} slot="start" />
          <code>{branch.node.label || shortenB64(branch.node.pubkey)}</code>
        </IonButton>
        <IonBadge color="tertiary">incoming: {branch.incoming.length}</IonBadge>
        <IonBadge color="secondary">outgoing: {branch.outgoing.length}</IonBadge>
        {branch.children.length > 0 && (
          <IonButton size="small" fill="clear" onClick={() => setExpanded((state) => !state)}>
            {expanded ? 'Collapse' : 'Expand'} {branch.children.length}
          </IonButton>
        )}
      </div>

      {expanded && branch.outgoing.length > 0 && (
        <IonList inset={true}>
          {branch.outgoing.map((edge, edgeIndex) => (
            <IonItem key={`${branch.node.id}-${edge.target}-${edge.height}-${edgeIndex}`} lines="none">
              <IonBadge color="medium">to #{edge.target}</IonBadge>
              <IonBadge color="light">weight: {edge.value}</IonBadge>
              <IonBadge color="light">height: {edge.height}</IonBadge>
              <IonBadge color="light">time: {edge.time}</IonBadge>
            </IonItem>
          ))}
        </IonList>
      )}

      {expanded && branch.children.length > 0 && (
        <div style={{ marginTop: 4 }}>
          {branch.children.map((child) => (
            <TreeBranch
              key={`${branch.node.id}-${child.node.id}`}
              branch={child}
              onNodeClick={onNodeClick}
              currentKey={currentKey}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FlowMap;

export const Filters = ({
  onDismiss,
  value,
}: {
  onDismiss: () => void;
  value: number;
}) => {
  const { rankingFilter, setRankingFilter } = useContext(AppContext);

  return (
    <div className="ion-padding">
      <IonList>
        <IonItem>
          <IonRange
            aria-label="Attention filter"
            labelPlacement="start"
            label={`Filter < ${value}%`}
            pin={true}
            pinFormatter={(value: number) => `${value}%`}
            onIonChange={({ detail }) => setRankingFilter(Number(detail.value))}
            value={rankingFilter}
          />
        </IonItem>
      </IonList>
      <IonButton expand="block" onClick={onDismiss}>
        Done
      </IonButton>
    </div>
  );
};

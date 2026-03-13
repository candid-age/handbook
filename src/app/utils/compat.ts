import { Graph } from 'ngraph.graph';
import fromDot from 'ngraph.fromdot';
import { sha3_256 } from 'js-sha3';
import { GraphLink, GraphNode, Transaction } from './appTypes';

export const parseGraphDOT = (
  dotString: string,
  forKey: string,
  rankingFilter: number,
) => {
  const graph: Graph = fromDot(dotString || 'digraph{}');


  const nodes: GraphNode[] = [];

  graph.forEachNode((node: any) => {
    const pubkey = node.data.pubkey as string;
    const locale = node.data.locale as string;
    const label = node.data.label as string;
    const ranking = Number(node.data.ranking);
    const imbalance = Number(node.data.imbalance);

    if (forKey !== pubkey && rankingFilter / 100 > ranking) return;


    nodes.push({
      id: node.id,
      group: 1,
      label,
      pubkey,
      ranking,
      locale,
      imbalance,
    });
  });

  // nodes.push({
  //   id: -1,
  //   group: -1,
  //   label: '+',
  //   pubkey: '',
  //   ranking: 0,
  //   locale: '',
  //   imbalance: 0,
  // });

  const links: GraphLink[] = [];
  graph.forEachLink((link: any) => {
    const source = link.fromId;
    const target = link.toId;

    if (!nodes.map((n) => n.id).includes(source)) return;
    if (!nodes.map((n) => n.id).includes(target)) return;

    links.push({
      source,
      target,
      value: Number(link.data.weight),
      height: Number(link.data.height),
      time: Number(link.data.time),
    });
  });

  // links.push({
  //   source: -1,
  //   target: forNodeId,
  //   value: -1,
  //   height: -1, //9999999999,
  //   time: -1, //9999999999,
  // });

  return { nodes, links };
};

export const shortenHex = (value: string) => {
  return `${value.substring(0, 5)}...${value.substring(60)}`;
};

export const shortenB64 = (value: string = '') => {
  if (value.startsWith('0000000000000000000000000000000000000000000')) {
    return value.substring(0, 1);
  }

  return value.replace(/0+=?$/g, '').substring(0, 25);

  //return isValid ? value.replace(/0+=?$/g, '') : `${value.substring(0, 15)}`; //...${value.substring(40)}`;
};

export const isObserverKey = (value: string) => {
  return !value.endsWith('00=');
};

export const transactionID = (transaction: Transaction) => {
  const obj = {
    //IMPORTANT: The order here must be preserved when stringified for generating consistent hashes
    time: transaction.time,
    nonce: transaction.nonce,
    from: transaction.from,
    to: transaction.to,
    memo: transaction.memo,
    series: transaction.series,
  };

  const rep_hash = sha3_256(JSON.stringify(obj));

  return rep_hash;
};

export const getEmbeddedReference = ({ memo }: Transaction) => {
  //"Example reference in memo looks like this: //xxxxhexadecimalxxxxxx//";

  const regex = /\/\/([a-fA-F0-9]+)\/\//g;

  let match;
  const hexNumbers = [];

  while ((match = regex.exec(memo)) !== null) {
    hexNumbers.push(match[1]); // match[1] contains the hexadecimal part
  }

  return hexNumbers[0] ?? '';
};

export const socketEventListener = <T>(
  event_type: string,
  handler: (data: T) => void,
): (() => void) => {
  const resultHandler = (event: Event) => {
    const customEvent = event as CustomEvent<T>;
    handler(customEvent.detail);
  };

  document.addEventListener(event_type, resultHandler);

  return () => {
    document.removeEventListener(event_type, resultHandler);
  };
};

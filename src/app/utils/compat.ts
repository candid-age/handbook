import { sha3_256 } from 'js-sha3';
import { Transaction } from './appTypes';

export const shortenHex = (value: string) => {
  return `${value.substring(0, 5)}...${value.substring(60)}`;
};

export const shortenB64 = (value: string = '') => {
  if (value.startsWith('0000000000000000000000000000000000000000000')) {
    return value.substring(0, 1);
  }

  return value.replace(/0+=?$/g, '').substring(0, 25);
};

export const transactionID = (transaction: Transaction) => {
  const obj = {
    //IMPORTANT: The order here must be preserved when stringified for generating consistent hashes
    time: transaction.time,
    nonce: transaction.nonce,
    from: transaction.from,
    to: transaction.to,
    amount: transaction.amount,
    fee: transaction.fee,
    memo: transaction.memo,
    series: transaction.series,
  };

  const rep_hash = sha3_256(JSON.stringify(obj));

  return rep_hash;
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

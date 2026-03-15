import { transactionID } from './compat';
import { Transaction } from './appTypes';

describe('transactionID', () => {
  const baseTx: Transaction = {
    time: 1700000000,
    nonce: 123,
    from: 'fromKey',
    to: 'toKey',
    amount: 1,
    fee: 1,
    memo: 'memo',
    series: 1,
  };

  it('changes when amount changes', () => {
    const txA = { ...baseTx, amount: 1 };
    const txB = { ...baseTx, amount: 2 };

    expect(transactionID(txA)).not.toEqual(transactionID(txB));
  });

  it('changes when fee changes', () => {
    const txA = { ...baseTx, fee: 1 };
    const txB = { ...baseTx, fee: 2 };

    expect(transactionID(txA)).not.toEqual(transactionID(txB));
  });
});

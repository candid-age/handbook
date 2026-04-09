import { PageShell } from '../components/pageShell';
import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../utils/appContext';
import DirTree from '../components/dirTree';
import { IonIcon, useIonModal } from '@ionic/react';
import { terminalOutline, timerOutline, addCircleOutline } from 'ionicons/icons';
import WebsocketConsole from './websocketConsole';
import Sequence from './sequence';
import Assert from './assert';
import { usePubKeyTransactions } from '../useCases/usePubKeyTxs';

const Explore = () => {
  const { selectedKeyIndex, publicKeys } = useContext(AppContext);

  const defaultPublicKey = publicKeys[selectedKeyIndex[0]]?.[selectedKeyIndex[1]] ?? '';
  const [peekGraphKey, setPeekGraphKey] = useState<string>(defaultPublicKey);

  useEffect(() => {
    if (!peekGraphKey && defaultPublicKey) {
      setPeekGraphKey(defaultPublicKey);
    }
  }, [defaultPublicKey, peekGraphKey]);

  const transactions = usePubKeyTransactions(peekGraphKey);

  const [presentBlockModal, dismissBlock] = useIonModal(Sequence, {
    onDismiss: (data: string, role: string) => dismissBlock(data, role),
  });

  const [presentPointModal, dismissPoint] = useIonModal(Assert, {
    onDismiss: (data: string, role: string) => dismissPoint(data, role),
    forKey: peekGraphKey,
  });

  const [presentSocketConsole, dismissSocketConsole] = useIonModal(
    WebsocketConsole,
    {
      onDismiss: () => dismissSocketConsole(),
    },
  );

  return (
    <PageShell
      selectedPublicKey={peekGraphKey}
      onPublicKeyChange={setPeekGraphKey}
      tools={[
        {
          label: 'Sequence',
          renderIcon: () => <IonIcon slot="icon-only" icon={timerOutline} />,
          action: () => presentBlockModal(),
        },
        {
          label: 'Assert',
          renderIcon: () => <IonIcon slot="icon-only" icon={addCircleOutline} />,
          action: () => presentPointModal(),
        },
        {
          label: 'WebSocket console',
          renderIcon: () => <IonIcon slot="icon-only" icon={terminalOutline} />,
          action: () => presentSocketConsole(),
        },
      ]}
      renderBody={() => (
        <DirTree
          forKey={peekGraphKey}
          transactions={transactions}
          setForKey={setPeekGraphKey}
        />
      )}
    />
  );
};

export default Explore;

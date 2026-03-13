import {
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonCard,
  IonCardContent,
  IonCardHeader,
  useIonModal,
  IonText,
  IonNote,
  IonContent,
  IonPage,
  IonButton,
  IonToolbar,
  IonHeader,
  IonButtons,
  IonCardSubtitle,
  IonIcon,
  useIonActionSheet,
  IonChip,
} from '@ionic/react';
import timeago from 'epoch-timeago';
import { Transaction } from '../../utils/appTypes';
import KeyChip from '../keyChip';
import { useClipboard } from '../../useCases/useClipboard';
import { ellipsisVertical, arrowForward } from 'ionicons/icons';
import {
  transactionID,
  shortenB64,
} from '../../utils/compat';
import { OverlayEventDetail } from '@ionic/core/components';
import { KeyAbbrev } from '../keyChip';

export const TransactionItem: React.FC<Transaction> = (transaction) => {
  const [present, dismiss] = useIonModal(TransactionDetail, {
    onDismiss: () => dismiss(),
    transaction,
  });

  const { time } = transaction;

  const timeMS = time * 1000;

  return (
    <IonItem lines="none" onClick={transaction.memo ? () => present() : () => {}}>
      <IonLabel className="ion-text-wrap">
        <IonText color="tertiary">
          <sub>
            <time dateTime={new Date(timeMS).toISOString()}>
              <p>{timeago(timeMS)}</p>
            </time>
          </sub>
        </IonText>
        <div>
          <IonChip outline={true}>
            <KeyAbbrev
              value={
                transaction.from ?? '0000000000000000000000000000000000000000000='
              }
            />
          </IonChip>

          <IonIcon icon={arrowForward} />
          <IonChip outline={true}>
            <KeyAbbrev value={transaction.to} />
          </IonChip>
        </div>
      </IonLabel>
    </IonItem>
  );
};

export default TransactionItem;

interface TransactionListProps {
  heading?: string;
  transactions: Transaction[];
}

export const TransactionList = ({ transactions, heading }: TransactionListProps) => {
  return (
    <IonList>
      {heading && (
        <IonListHeader>
          <IonLabel>{heading}</IonLabel>
        </IonListHeader>
      )}
      {!transactions.length && (
        <IonItem>
          <IonLabel>No Activity</IonLabel>
        </IonItem>
      )}
      {transactions.map((tx, index) => (
        <TransactionItem
          key={index}
          from={tx.from}
          to={tx.to}
          amount={tx.amount}
          fee={tx.fee}
          memo={tx.memo}
          time={tx.time}
          nonce={tx.nonce}
          series={tx.series}
        />
      ))}
    </IonList>
  );
};

export const TransactionDetail = ({
  onDismiss,
  transaction,
}: {
  onDismiss: () => void;
  transaction: Transaction;
}) => {
  const { copyToClipboard } = useClipboard();

  const [presentActionSheet] = useIonActionSheet();

  const handleActionSheet = ({ data }: OverlayEventDetail) => {
    if (data?.['action'] === 'copy') {
      copyToClipboard(`//${transactionID(transaction)}//`);
    }
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
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonCard>
          <IonCardHeader>
            <IonCardSubtitle
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                Asserted by:{' '}
                <KeyChip
                  value={
                    transaction.from ??
                    '0000000000000000000000000000000000000000000='
                  }
                />
              </div>
              <IonButton
                className="ion-no-padding"
                fill="clear"
                onClick={() => {
                  presentActionSheet({
                    onDidDismiss: ({ detail }) => handleActionSheet(detail),
                    header: `${shortenB64(
                      transaction.from ?? '0000000',
                    )} => ${shortenB64(transaction.to)}`,
                    buttons: [
                      {
                        text: 'Copy reference',
                        data: {
                          action: 'copy',
                        },
                      },
                    ],
                  });
                }}
              >
                <IonIcon
                  color="primary"
                  slot="icon-only"
                  icon={ellipsisVertical}
                ></IonIcon>
              </IonButton>
            </IonCardSubtitle>
            <IonLabel>
              <IonNote>
                {new Date(transaction.time * 1000).toDateString()}
              </IonNote>
            </IonLabel>
          </IonCardHeader>
          <IonCardContent>
            <KeyChip value={transaction.to} />
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

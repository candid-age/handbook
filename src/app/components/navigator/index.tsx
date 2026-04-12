import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonPage,
  IonItem,
  IonLabel,
  IonList,
  IonToolbar,
} from '@ionic/react';
import { sunnyOutline } from 'ionicons/icons';
import { useContext, useMemo, useState } from 'react';
import { AppContext } from '../../utils/appContext';

const Navigator = ({
  onDismiss,
}: {
  onDismiss: (role?: string) => void;
}) => {
  const {
    navigatorPublicKey,
    setNavigatorPublicKey,
    transactionRange,
    setTransactionRange,
  } = useContext(AppContext);

  const [publicKey, setPublicKey] = useState(navigatorPublicKey);
  const [startHeight, setStartHeight] = useState(`${transactionRange.startHeight}`);
  const [endHeight, setEndHeight] = useState(`${transactionRange.endHeight}`);
  const [limit, setLimit] = useState(`${transactionRange.limit}`);

  const canSave = useMemo(() => publicKey.trim().length > 0, [publicKey]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton color="medium" onClick={() => onDismiss('cancel')}>
              Close
            </IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton
              strong
              disabled={!canSave}
              onClick={() => {
                setNavigatorPublicKey(publicKey.trim());
                setTransactionRange({
                  startHeight: Number(startHeight || 0),
                  endHeight: Number(endHeight || 0),
                  limit: Number(limit || 500),
                });
                onDismiss('confirm');
              }}
            >
              Apply
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <div
                style={{
                  marginTop: '20px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <IonIcon
                  className="ion-no-padding"
                  size="large"
                  icon={sunnyOutline}
                  color="primary"
                />
                Candid Handbook
              </div>
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList inset>
              <IonItem>
                <IonLabel position="stacked">Public key</IonLabel>
                <IonInput
                  value={publicKey}
                  placeholder="Enter a public key"
                  onIonInput={(event) => setPublicKey(`${event.detail.value ?? ''}`)}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Start height</IonLabel>
                <IonInput
                  type="number"
                  min={0}
                  value={startHeight}
                  onIonInput={(event) => setStartHeight(`${event.detail.value ?? 0}`)}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">End height</IonLabel>
                <IonInput
                  type="number"
                  min={0}
                  value={endHeight}
                  onIonInput={(event) => setEndHeight(`${event.detail.value ?? 0}`)}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Limit</IonLabel>
                <IonInput
                  type="number"
                  min={1}
                  value={limit}
                  onIonInput={(event) => setLimit(`${event.detail.value ?? 500}`)}
                />
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Navigator;

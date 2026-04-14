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
  IonRange,
  IonToolbar,
} from '@ionic/react';
import { logoYoutube, sunnyOutline } from 'ionicons/icons';
import { useContext, useMemo, useState } from 'react';
import { AppContext } from '../../utils/appContext';

const CANDID_REEL_PUBLIC_KEY = 'GFyHkcnYf0+Og/DuhzXAFN0J5aOH+0k9RaJ58lOy5Mg=';
const CANDID_LOG_PUBLIC_KEY = '13N00JsrSlMKF6T74CpNC65k4ETENYBuh2yM7r645VQ=';
const DEFAULT_WINDOW_SIZE = 20_000;

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
    tipHeader,
  } = useContext(AppContext);

  const maxHeight = tipHeader?.header.height ?? 0;
  const defaultEndHeight = Math.max(maxHeight - DEFAULT_WINDOW_SIZE, 0);
  const [publicKey, setPublicKey] = useState(navigatorPublicKey);
  const [startHeight, setStartHeight] = useState(
    `${Math.min(Math.max(transactionRange.startHeight, 0), maxHeight)}`,
  );
  const [endHeight, setEndHeight] = useState(
    `${Math.min(Math.max(transactionRange.endHeight, 0), maxHeight)}`,
  );
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
                const normalizedStart = Math.min(Math.max(Number(startHeight || 0), 0), maxHeight);
                const normalizedEnd = Math.min(Math.max(Number(endHeight || 0), 0), maxHeight);
                setTransactionRange({
                  startHeight: Math.max(normalizedStart, normalizedEnd),
                  endHeight: Math.min(normalizedStart, normalizedEnd),
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
                Memos
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
                <IonButton
                  slot="end"
                  fill="clear"
                  size="small"
                  onClick={() => setPublicKey(CANDID_REEL_PUBLIC_KEY)}
                >
                  <IonIcon slot="start" icon={logoYoutube} />
                  Candid-Reel
                </IonButton>
                <IonButton
                  slot="end"
                  fill="clear"
                  size="small"
                  onClick={() => setPublicKey(CANDID_LOG_PUBLIC_KEY)}
                >
                  <IonIcon slot="start" icon={logoYoutube} />
                  Candid-Log
                </IonButton>
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Start height</IonLabel>
                <IonInput
                  type="number"
                  min={0}
                  value={startHeight}
                  onIonInput={(event) => setStartHeight(`${event.detail.value ?? 0}`)}
                />
                <IonButton
                  slot="end"
                  fill="clear"
                  size="small"
                  onClick={() => setStartHeight(`${maxHeight}`)}
                >
                  Tip
                </IonButton>
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">End height</IonLabel>
                <IonInput
                  type="number"
                  min={0}
                  value={endHeight}
                  onIonInput={(event) => setEndHeight(`${event.detail.value ?? 0}`)}
                />
                <IonButton
                  slot="end"
                  fill="clear"
                  size="small"
                  onClick={() => setEndHeight(`${defaultEndHeight}`)}
                >
                  -20k
                </IonButton>
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">
                  Height window ({endHeight} - {startHeight})
                </IonLabel>
                <IonRange
                  dualKnobs
                  min={0}
                  max={maxHeight}
                  step={1}
                  value={{
                    lower: Number(endHeight || 0),
                    upper: Number(startHeight || 0),
                  }}
                  onIonChange={(event) => {
                    const value = event.detail.value;
                    if (typeof value === 'object' && value !== null) {
                      setEndHeight(`${value.lower ?? 0}`);
                      setStartHeight(`${value.upper ?? 0}`);
                    }
                  }}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Limit</IonLabel>
                <IonInput
                  type="number"
                  min={1}
                  value={limit}
                  onIonInput={(event) => setLimit(`${event.detail.value ?? 500}`)}
                  placeholder="500"
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

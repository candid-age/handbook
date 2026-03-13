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
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonRange,
  IonText,
  IonToolbar,
} from '@ionic/react';
import { chevronDownOutline, chevronForwardOutline, logoYoutube, sunnyOutline } from 'ionicons/icons';
import { useContext, useMemo, useState } from 'react';
import { AppContext } from '../../utils/appContext';

const CANDID_REEL_PUBLIC_KEY = 'GFyHkcnYf0+Og/DuhzXAFN0J5aOH+0k9RaJ58lOy5Mg=';
const DEFAULT_WINDOW_SIZE = 20_000;
const DEFAULT_LIMIT = 500;

const YOUTUBE_CHANNELS = [
  {
    label: 'Candid-Reel',
    publicKey: CANDID_REEL_PUBLIC_KEY,
  },
];

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
  const [showAdvanced, setShowAdvanced] = useState(false);

  const canSave = useMemo(() => publicKey.trim().length > 0, [publicKey]);

  const applyDefaultWindow = (nextPublicKey: string) => {
    setPublicKey(nextPublicKey);
    setStartHeight(`${maxHeight}`);
    setEndHeight(`${defaultEndHeight}`);
    setLimit(`${DEFAULT_LIMIT}`);
  };

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
                  limit: Number(limit || DEFAULT_LIMIT),
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
                Candidspaces
              </div>
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList inset>
              <IonItem>
                {YOUTUBE_CHANNELS.map((channel) => (
                  <IonButton
                    key={channel.publicKey}
                    slot="end"
                    fill={publicKey === channel.publicKey ? 'solid' : 'clear'}
                    size="small"
                    onClick={() => applyDefaultWindow(channel.publicKey)}
                  >
                    <IonIcon slot="start" icon={logoYoutube} />
                    {channel.label}
                  </IonButton>
                ))}
              </IonItem>
              <IonItem button detail={false} onClick={() => setShowAdvanced((value) => !value)}>
                <IonIcon
                  slot="start"
                  icon={showAdvanced ? chevronDownOutline : chevronForwardOutline}
                />
                <IonLabel>Advanced settings</IonLabel>
              </IonItem>
              {showAdvanced && (
                <>
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
                      onIonInput={(event) => setLimit(`${event.detail.value ?? DEFAULT_LIMIT}`)}
                      placeholder={`${DEFAULT_LIMIT}`}
                    />
                  </IonItem>
                </>
              )}
            </IonList>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Navigator;

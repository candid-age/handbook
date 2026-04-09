import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonToolbar,
} from '@ionic/react';
import { sunnyOutline } from 'ionicons/icons';
import { useMemo, useState } from 'react';

const Navigator = ({
  onDismiss,
  selectedPublicKey,
}: {
  onDismiss: (data?: string | null | undefined, role?: string) => void;
  selectedPublicKey?: string;
}) => {
  const [publicKey, setPublicKey] = useState(selectedPublicKey ?? '');

  const trimmedPublicKey = useMemo(() => publicKey.trim(), [publicKey]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton color="medium" onClick={() => onDismiss(null, 'cancel')}>
              Close
            </IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton
              strong={true}
              disabled={!trimmedPublicKey}
              onClick={() => onDismiss(trimmedPublicKey, 'confirm')}
            >
              Set key
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
            <IonCardSubtitle>Set the public key used to load the tree view.</IonCardSubtitle>
            <IonItem className="ion-margin-top">
              <IonLabel position="stacked">Public key</IonLabel>
              <IonInput
                value={publicKey}
                placeholder="Enter public key"
                onIonInput={(event) => setPublicKey(event.detail.value ?? '')}
              />
            </IonItem>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Navigator;

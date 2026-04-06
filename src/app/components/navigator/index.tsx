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
  IonPage,
  IonToolbar,
} from '@ionic/react';
import { sunnyOutline } from 'ionicons/icons';

const Navigator = ({
  onDismiss,
}: {
  onDismiss: (data?: string | null | undefined, role?: string) => void;
}) => {

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton
              color="medium"
              onClick={() => onDismiss(null, 'cancel')}
            >
              Close
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
            <IonCardSubtitle>
              Arise, shine, for your light has come...
            </IonCardSubtitle>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Navigator;

import {
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonPage,
  IonToolbar,
  useIonModal,
} from '@ionic/react';
import { sunnyOutline } from 'ionicons/icons';
import Navigator from '../navigator';
import { useCallback, useContext, useEffect } from 'react';
import { AppContext } from '../../utils/appContext';

interface ToolBarButton {
  label: string;
  renderIcon?: () => JSX.Element;
  action: () => void;
}

interface Props {
  onDismissModal?: () => void;
  renderBody: () => JSX.Element;
  tools?: ToolBarButton[];
}

export const PageShell = ({ onDismissModal, renderBody, tools }: Props) => {
  const { navigatorPublicKey } = useContext(AppContext);

  const [present, dismiss] = useIonModal(Navigator, {
    onDismiss: (role: string) => dismiss(undefined, role),
  });

  const openModal = useCallback(() => {
    present();
  }, [present]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!navigatorPublicKey) {
        openModal();
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [navigatorPublicKey, openModal]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            {onDismissModal ? (
              <IonButton color="medium" onClick={() => onDismissModal()}>
                Close
              </IonButton>
            ) : (
              <IonChip onClick={openModal}>
                <IonIcon icon={sunnyOutline} color="primary" />
                <IonLabel>Candidspaces</IonLabel>
              </IonChip>
            )}
          </IonButtons>

          {!!tools?.length && (
            <IonButtons slot="end">
              {tools.map((tool) => (
                <IonButton key={tool.label} onClick={tool.action}>
                  {tool.renderIcon ? tool.renderIcon() : tool.label}
                </IonButton>
              ))}
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>{renderBody()}</IonContent>
    </IonPage>
  );
};

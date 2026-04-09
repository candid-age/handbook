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
import { OverlayEventDetail } from '@ionic/core/components';
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
  selectedPublicKey?: string;
  onPublicKeyChange?: (publicKey: string) => void;
}

export const PageShell = ({
  onDismissModal,
  renderBody,
  tools,
  selectedPublicKey,
  onPublicKeyChange,
}: Props) => {
  const { selectedNode, setSelectedNode } = useContext(AppContext);

  const [present, dismiss] = useIonModal(Navigator, {
    onDismiss: (data: string, role: string) => dismiss(data, role),
    selectedPublicKey,
  });

  const openModal = useCallback(() => {
    present({
      onWillDismiss: (ev: CustomEvent<OverlayEventDetail>) => {
        if (ev.detail.role !== 'confirm') {
          return;
        }

        const value = `${ev.detail.data ?? ''}`;
        if (!value) {
          return;
        }

        if (onPublicKeyChange) {
          onPublicKeyChange(value);
          return;
        }

        setSelectedNode(value);
      },
    });
  }, [onPublicKeyChange, present, setSelectedNode]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!selectedNode && !selectedPublicKey) {
        openModal();
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [selectedNode, selectedPublicKey, openModal]);

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
                <IonLabel>Candid Handbook</IonLabel>
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

import { IonChip, IonIcon } from '@ionic/react';
import { receiptOutline } from 'ionicons/icons';
import { shortenB64 } from '../../utils/compat';


export const KeyAbbrev = ({ value }: { value: string }) => {
  const abbrevKey = shortenB64(value);

  return <code>{abbrevKey}</code>;
};

interface KeyChipProps {
  value: string;
  label?: string;
  readonly?: boolean;
}

const KeyChip: React.FC<KeyChipProps> = ({ value, label, readonly }) => {

  return value ? (
    <IonChip
    >
      {!readonly && <IonIcon icon={receiptOutline} color="primary"></IonIcon>}
      {label ? <code>{label}</code> : <KeyAbbrev value={value} />}
    </IonChip>
  ) : null;
};

export default KeyChip;

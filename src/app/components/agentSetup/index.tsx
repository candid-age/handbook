import {
  IonInput,
  IonButton,
  IonText,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
} from '@ionic/react';
import { usePasswordValidationProps } from '../../useCases/usePwdStrength';

const EnterPassPhrase = ({
  applyPassPhrase,
}: {
  applyPassPhrase: (phrase: string) => void;
}) => {
  const {
    value: passPhrase,
    onBlur: onBlurPassPhrase,
    isValid: isPassPhraseValid,
    isTouched: isPassPhraseTouched,
    onInputChange: setPassPhrase,
    result: pwdStrength,
  } = usePasswordValidationProps(
    (passPhrase: string, strength) => (strength?.score ?? 0) > 2,
  );

  return (
    <>
      <section className="ion-padding">
        <IonInput
          className={`${isPassPhraseValid && 'ion-valid'} ${
            isPassPhraseValid === false && 'ion-invalid'
          } ${isPassPhraseTouched && 'ion-touched'}`}
          label="Passphrase"
          placeholder="What is your agent's objective?"
          labelPlacement="stacked"
          type="password"
          value={passPhrase}
          onIonBlur={onBlurPassPhrase}
          errorText={pwdStrength?.feedback.warning ?? ''}
          onIonInput={(event) =>
            setPassPhrase(event.target.value?.toString() ?? '')
          }
        />
      </section>

      <IonButton
        disabled={!isPassPhraseValid}
        expand="block"
        onClick={() => applyPassPhrase(passPhrase)}
        className="ion-padding ion-no-margin"
      >
        Apply
      </IonButton>
    </>
  );
};

export const SetupAgent = ({
  importKeys,
}: {
  importKeys: (passPhrase: string) => void;
}) => {
  return (
    <IonCard>
      <IonCardHeader>
        <IonCardSubtitle>Setup agent to continue</IonCardSubtitle>
      </IonCardHeader>
      <IonCardContent>
        <IonText class="ion-text-center" color="danger">
          <p>A passphrase is required to setup an agent.</p>
          <p>Enter a passphrase that is meaningful.</p>
          <p>The agent will be lost if you forget it.</p>
        </IonText>
        <EnterPassPhrase
          applyPassPhrase={(passPhrase) => importKeys(passPhrase)}
        />
      </IonCardContent>
    </IonCard>
  );
};

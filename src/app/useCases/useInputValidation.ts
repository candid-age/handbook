import { useCallback, useState } from 'react';

export const useInputValidationProps = (
  validate: (value: string) => boolean,
  initialValue: string = '',
) => {
  const [value, setValue] = useState<string>(initialValue);
  const [isValid, setIsValid] = useState<boolean>();
  const [isTouched, setIsTouchedState] = useState(false);

  const onBlur = useCallback(() => {
    setIsTouchedState(true);
  }, [setIsTouchedState]);

  const onInputChange = useCallback(
    (value: string) => {
      setIsValid(undefined);

      setValue(value);

      if (value === '') return;

      setIsValid(validate(value));
    },
    [validate],
  );

  return {
    value,
    onBlur,
    isValid,
    isTouched,
    onInputChange,
  };
};

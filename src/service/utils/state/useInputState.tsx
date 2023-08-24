import { useState, ChangeEvent, Dispatch, SetStateAction } from 'react';
import { ErrorStateType } from '../../../components/SignIn/SignIn.types';

function generateNewErrorState(
  errors: ErrorStateType,
  id: string,
  additionalErrorStateProperties: string
) {
  let newErrorState = {
    ...errors,
    [id]: '',
  };

  if (additionalErrorStateProperties) {
    newErrorState = {
      ...newErrorState,
      [additionalErrorStateProperties]: '',
    };
  }

  return newErrorState;
}

export default function useInputState(
  errors: ErrorStateType,
  setErrors: Dispatch<SetStateAction<ErrorStateType>>,
  initialValue = '',
  additionalErrorStateProperties = ''
) {
  const [values, setValues] = useState<string>(initialValue);

  // Please Ensure the Input Field ID is the same with the error state
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { id, value } = event.target;
    setValues(value);

    const newErrorState = generateNewErrorState(
      errors,
      id,
      additionalErrorStateProperties
    );
    setErrors(newErrorState);
  }

  return {
    value: values,
    onchange: handleChange,
  };
}

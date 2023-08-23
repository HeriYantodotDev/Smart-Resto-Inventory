import { useState, ChangeEvent } from 'react';

export default function useInputState(initialValue = '') {
  const [values, setValues] = useState<string>(initialValue);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { value } = event.target;
    setValues(value);
  }

  return {
    value: values,
    onchange: handleChange,
  };
}

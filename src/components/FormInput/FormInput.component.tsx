import { useTranslation } from 'react-i18next';
import { FormInputProps } from './FormInput.types';
import ErrorFormText from '../ErrorFormText/ErrorFormText.component';

export default function FormInput({
  labelName,
  htmlFor,
  onChange,
  value,
  id,
  type,
  error,
}: FormInputProps) {
  const { t } = useTranslation();
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className={`
          mt-2 block
          text-left
          text-white
        `}
      >
        {labelName}
      </label>
      <input
        onChange={onChange}
        value={value}
        id={id}
        type={type || 'text'}
        className={`
          my-2 w-full
          rounded-md border-2  border-gray-300
          bg-transparent text-white
          ${error ? 'border-red-500' : 'border-gray-300'}
          px-2
          py-1 text-left focus:bg-white focus:bg-opacity-5 
        `}
        style={{
          // This inline style targets the autofill background color
          WebkitBoxShadow: '0 0 0 1000px transparent inset',
          boxShadow: '0 0 0 1000px transparent inset',
        }}
      />
      {error && <ErrorFormText>{t(error)}</ErrorFormText>}
    </div>
  );
}

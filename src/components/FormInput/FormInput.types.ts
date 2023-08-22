export interface FormInputProps {
  labelName: string;
  htmlFor: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  value: string;
  id: string;
  type?: string;
  error?: string;
}

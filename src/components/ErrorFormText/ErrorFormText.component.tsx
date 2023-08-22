import { ErrorFormTextType } from './ErrorFormText.types';

export default function ErrorFormText({ children }: ErrorFormTextType) {
  return <span className="text-sm text-red-500">{children}</span>;
}

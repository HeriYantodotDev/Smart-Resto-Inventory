import { ButtonProps } from './Button.types';
import './Button.css';

export default function Button({
  onClick,
  disabled,
  buttonLabel,
  children,
}: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="
      mx-auto
      mt-4
      w-24
      rounded-md 
      border-b-4
      border-green-900 
      bg-green-500 px-4
      py-2 font-semibold
      text-black shadow-lg
      shadow-green-500/70
      hover:bg-green-600
      hover:text-white
      hover:shadow-green-600/70
      "
    >
      {children || buttonLabel}
    </button>
  );
}

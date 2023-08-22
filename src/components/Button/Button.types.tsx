import { ReactNode } from 'react';

export interface ButtonProps {
  buttonLabel?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  children?: ReactNode;
}

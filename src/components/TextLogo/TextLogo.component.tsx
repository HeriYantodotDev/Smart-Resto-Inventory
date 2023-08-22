import { TextLogoProps } from './TextLogo.types';

export default function TextLogo({ children }: TextLogoProps) {
  return (
    <div
      className="flex h-10 w-24 items-center justify-center bg-green-500 text-center font-extrabold  text-white shadow-lg shadow-green-500/70"
      style={{
        boxShadow: '0px 0px 20px 5px rgba(0,300,0,0.5)', // Adjust the values as needed
      }}
      data-testid="textLogo"
    >
      {children}
    </div>
  );
}

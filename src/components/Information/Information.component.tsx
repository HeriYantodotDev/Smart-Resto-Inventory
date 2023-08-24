import { InformationProps } from './Information.types';

export default function Information({ children }: InformationProps) {
  return (
    <div
      className="mt-2
        w-auto rounded-b border-t-4  
        border-blue-500 bg-blue-100 px-4
        py-3 font-extrabold text-black shadow-lg shadow-blue-500/70"
    >
      {children}
    </div>
  );
}

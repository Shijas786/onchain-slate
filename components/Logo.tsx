import React from 'react';
import Image from 'next/image';

export const Logo = ({ className = "w-8 h-8", ...props }: { className?: string } & React.HTMLAttributes<HTMLDivElement>) => {
  // Extract width/height from className if possible, or default to a square aspect ratio
  // Since className usually contains tailwind classes like w-8 h-8, we'll rely on the parent container or explicit sizing
  // But Next.js Image needs width/height. 

  return (
    <div className={`relative ${className}`} {...props}>
      <Image
        src="/logo.png"
        alt="Onchain Slate Logo"
        fill
        className="object-contain rounded-lg"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
};


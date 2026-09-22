import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';

interface PartImageProps {
  src?: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
}

/**
 * Renders the component image if presented locally/uploaded.
 * Avoids any 3rd party services like Unsplash.
 * Shows a clean hardware blueprint/package placeholder if no photo is provided.
 */
export const PartImage: React.FC<PartImageProps> = ({
  src,
  alt = 'Component item',
  className = 'h-full w-full object-cover',
  containerClassName = '',
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const isBlockedThirdParty = typeof src === 'string' && (
    src.includes('unsplash.com') ||
    src.includes('placeholder') ||
    src.includes('picsum') ||
    src.includes('pravatar')
  );

  const isValidPhoto = Boolean(
    src &&
    typeof src === 'string' &&
    src.trim() !== '' &&
    !isBlockedThirdParty &&
    !hasError
  );

  if (isValidPhoto) {
    return (
      <img
        src={src!}
        alt={alt}
        onError={() => setHasError(true)}
        className={className}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 select-none ${className} ${containerClassName}`}
    >
      <Package className="h-8 w-8 stroke-[1.5] text-slate-400 dark:text-slate-500 mb-1 opacity-70" />
      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
        No Photo
      </span>
    </div>
  );
};

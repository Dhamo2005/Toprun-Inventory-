import React, { useState, useEffect } from 'react';

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  id?: string;
}

/**
 * Renders the user's current photo if presented.
 * If no photo is provided, or if an external 3rd-party URL (e.g. Unsplash) was stored,
 * renders an empty DP silhouette styled like WhatsApp and Instagram.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
  id,
}) => {
  const [imageError, setImageError] = useState(false);

  // Reset error if src changes
  useEffect(() => {
    setImageError(false);
  }, [src]);

  // Only allow valid local/uploaded photos; block 3rd-party services like Unsplash
  const isBlockedThirdParty = typeof src === 'string' && (
    src.includes('unsplash.com') ||
    src.includes('placeholder') ||
    src.includes('picsum') ||
    src.includes('pravatar')
  );

  const hasValidPhoto = Boolean(
    src &&
    typeof src === 'string' &&
    src.trim() !== '' &&
    !isBlockedThirdParty &&
    !imageError
  );

  const sizeClasses = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
    '2xl': 'h-24 w-24',
  };

  const dim = sizeClasses[size] || sizeClasses.md;

  if (hasValidPhoto) {
    return (
      <img
        id={id}
        src={src!}
        alt={name || 'User photo'}
        onError={() => setImageError(true)}
        className={`rounded-full object-cover shrink-0 select-none ${dim} ${className}`}
      />
    );
  }

  // Empty DP: WhatsApp / Instagram style minimalist profile silhouette
  return (
    <div
      id={id}
      aria-label={name ? `${name} (Default avatar)` : 'Default avatar'}
      className={`relative flex items-center justify-center rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700/90 shrink-0 select-none border border-slate-300/40 dark:border-slate-600/40 ${dim} ${className}`}
    >
      <svg
        className="w-[62%] h-[62%] text-slate-400 dark:text-slate-300 translate-y-[6%]"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    </div>
  );
};

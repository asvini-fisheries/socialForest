import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  priority?: boolean;
}

const SIZES = {
  sm: { width: 140, height: 93, icon: 40 },
  md: { width: 200, height: 133, icon: 48 },
  lg: { width: 280, height: 187, icon: 56 },
  xl: { width: 360, height: 240, icon: 72 },
} as const;

export function Logo({ variant = 'full', size = 'md', className, priority = false }: LogoProps) {
  const dims = SIZES[size];

  if (variant === 'icon') {
    return (
      <Image
        src="/socialforest-icon.png"
        alt="SocialForest"
        width={dims.icon}
        height={dims.icon}
        className={cn('object-contain', className)}
        priority={priority}
      />
    );
  }

  return (
    <Image
      src="/socialforest-logo.png"
      alt="SocialForest — Plant Today, Inspire Tomorrow"
      width={dims.width}
      height={dims.height}
      className={cn('object-contain', className)}
      priority={priority}
    />
  );
}

import { cn } from '@/lib/utils';
import { PropsWithChildren } from 'react';

interface Props {
  className?: string;
}

export function TextSmall(props: PropsWithChildren<Props>) {
  return (
    <small className={cn('text-sm font-medium leading-none', props.className)}>
      {props.children}
    </small>
  );
}

export function TextLarge(props: PropsWithChildren<Props>) {
  return (
    <div className={cn('text-lg font-semibold', props.className)}>
      {props.children}
    </div>
  );
}

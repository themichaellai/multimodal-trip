import { PropsWithChildren } from 'react';

export function TextSmall(props: PropsWithChildren) {
  return (
    <small className="text-sm font-medium leading-none">{props.children}</small>
  );
}

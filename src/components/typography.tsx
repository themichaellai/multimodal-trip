import { PropsWithChildren } from 'react';

export function TextSmall(props: PropsWithChildren) {
  return (
    <small className="text-sm font-medium leading-none">{props.children}</small>
  );
}

export function TextLarge(props: PropsWithChildren) {
  return <div className="text-lg font-semibold">{props.children}</div>;
}

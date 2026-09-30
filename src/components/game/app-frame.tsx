import type { ReactNode } from "react";

export function AppFrame({
  children,
  footer,
  className = "",
}: {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`app-frame ${className}`.trim()}>
      <div className="app-scroll">{children}</div>
      {footer}
    </div>
  );
}

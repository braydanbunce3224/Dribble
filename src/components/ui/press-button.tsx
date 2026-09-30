import type { ReactNode } from "react";
import { bindTap } from "@/lib/tap";

export function PressButton({
  onPress,
  className,
  children,
  disabled,
}: {
  onPress: () => void;
  className?: string;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button type="button" disabled={disabled} className={className} {...(disabled ? {} : bindTap(onPress))}>
      {children}
    </button>
  );
}

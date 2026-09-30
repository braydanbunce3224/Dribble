import { useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Web stand-in for React Native's Pressable.
 * onPressIn = finger down (visual). onPress = successful lift.
 * Parent scroll / drag cancels via pointercancel.
 */
export function Pressable({
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  className,
  children,
  style,
}: {
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  disabled?: boolean;
  className?: string | ((s: { pressed: boolean }) => string);
  children: ReactNode | ((s: { pressed: boolean }) => ReactNode);
  style?: CSSProperties;
}) {
  const [pressed, setPressed] = useState(false);
  const last = useRef(0);
  const live = useRef(false);

  const fire = () => {
    const now = performance.now();
    if (now - last.current < 80) return;
    last.current = now;
    onPress?.();
  };

  const down = () => {
    if (disabled) return;
    live.current = true;
    setPressed(true);
    onPressIn?.();
  };

  const cancel = () => {
    if (!live.current) return;
    live.current = false;
    setPressed(false);
    onPressOut?.();
  };

  const up = (e: { preventDefault: () => void }) => {
    if (disabled || !live.current) return;
    live.current = false;
    setPressed(false);
    onPressOut?.();
    e.preventDefault();
    fire();
  };

  const cls = typeof className === "function" ? className({ pressed }) : className;

  return (
    <button
      type="button"
      disabled={disabled}
      className={`${cls ?? ""} ${pressed ? "is-pressed" : ""}`}
      style={style}
      onPointerDown={down}
      onTouchStart={down}
      onPointerUp={(e) => up(e)}
      onTouchEnd={(e) => up(e)}
      onPointerCancel={cancel}
      onTouchCancel={cancel}
      onClick={(e) => {
        e.stopPropagation();
        if (disabled) return;
        fire();
      }}
    >
      {typeof children === "function" ? children({ pressed }) : children}
    </button>
  );
}

import { Component, type ErrorInfo, type ReactNode } from "react";
import { bindTap } from "@/lib/tap";
import { noteError } from "@/game/diag";

interface Props {
  children: ReactNode;
  onReset: () => void;
}

interface State {
  err: Error | null;
}

export class ViewError extends Component<Props, State> {
  state: State = { err: null };

  static getDerivedStateFromError(err: Error): State {
    return { err };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    noteError(err);
    console.error(err, info.componentStack);
  }

  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="app-frame">
        <div className="app-scroll flex flex-col items-start justify-center gap-3 px-5 py-10">
        <p className="text-xs tracking-[0.18em] text-muted uppercase">This save</p>
        <h1 className="font-display text-3xl">Something on this screen is missing</h1>
        <p className="max-w-md text-sm text-muted">
          A screen asked for data that isn't there. The save is still on the device. Go back to the office and keep playing, or load another save.
        </p>
        <button
          type="button"
          className="min-h-12 rounded-lg bg-accent px-5 font-semibold text-accent-fg"
          {...bindTap(() => {
            this.setState({ err: null });
            this.props.onReset();
          })}
        >
          Back to the office
        </button>
        </div>
      </div>
    );
  }
}

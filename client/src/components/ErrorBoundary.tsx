import React from "react";
import { Button } from "@/components/ui/button";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || "Unexpected UI error" };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("Client UI crashed:", error, info);
  }

  private reload = (): void => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
          <div className="max-w-xl w-full border border-red-500/30 bg-red-500/5 rounded-xl p-6 space-y-3">
            <h1 className="text-xl font-bold">An error has occurred</h1>
            <p className="text-sm text-muted-foreground">{this.state.message}</p>
            <Button onClick={this.reload}>Reload</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

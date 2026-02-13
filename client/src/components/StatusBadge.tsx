import { clsx } from "clsx";

interface StatusBadgeProps {
  status: string;
}

const statusLabels: Record<string, string> = {
  pending: "Pending",
  analyzed: "Ready",
  analyzing: "Analyzing",
  generating: "Generating",
  ready_to_render: "Assembling",
  rendering: "Rendering",
  completed: "Completed",
  failed: "Failed",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusColor = (s: string) => {
    switch (s) {
      case "completed":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "generating":
      case "rendering":
      case "analyzing":
      case "ready_to_render":
        return "bg-primary/10 text-primary border-primary/20 animate-pulse";
      case "failed":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <span
      data-testid={`badge-status-${status}`}
      className={clsx(
        "px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider border font-semibold",
        getStatusColor(status)
      )}
    >
      {statusLabels[status] || status}
    </span>
  );
}

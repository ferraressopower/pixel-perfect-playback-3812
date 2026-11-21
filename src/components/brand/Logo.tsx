import mark from "@/assets/panteron-mark.jpg.asset.json";
import { cn } from "@/lib/utils";

export function PantherMark({ className }: { className?: string }) {
  return (
    <img src={mark.url} alt="Panteron" width={256} height={256}
      className={cn("rounded-md object-cover ring-1 ring-border", className)} />
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <PantherMark className="size-8" />
      {!compact && <span className="wordmark text-sm text-foreground">PANTERON</span>}
    </div>
  );
}

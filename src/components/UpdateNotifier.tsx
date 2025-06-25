import { useServiceWorker } from "@/hooks/useServiceWorker";
import { Toaster, toast } from "sonner";

export function UpdateNotifier() {
  const { updateAvailable, updateSW } = useServiceWorker();

  if (updateAvailable) {
    toast.info("A new version of the site is available.", {
      action: {
        label: "Reload",
        onClick: () => updateSW(),
      },
      duration: Infinity,
    });
  }

  return <Toaster />;
}
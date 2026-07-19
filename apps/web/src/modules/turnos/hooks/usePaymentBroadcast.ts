import { useEffect } from "react";

export function usePaymentBroadcast(onPaymentCompleted: () => void): void {
  useEffect(() => {
    const channel = new BroadcastChannel("kinescius-payment");
    channel.onmessage = (event: MessageEvent<{ type: string }>) => {
      if (event.data?.type === "payment-completed") {
        onPaymentCompleted();
      }
    };
    return () => channel.close();
  }, [onPaymentCompleted]);
}

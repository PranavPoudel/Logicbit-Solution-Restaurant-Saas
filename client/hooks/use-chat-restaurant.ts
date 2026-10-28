import { useEffect } from "react";
import { useChatContextStore, type ChatRestaurant } from "@/store/chat-context-store";

export function useChatRestaurant(restaurant: ChatRestaurant | null) {
  const setRestaurant = useChatContextStore((s) => s.setRestaurant);
  const clearRestaurant = useChatContextStore((s) => s.clearRestaurant);
  const signature = restaurant ? JSON.stringify(restaurant) : "";

  useEffect(() => {
    if (signature) setRestaurant(JSON.parse(signature) as ChatRestaurant);
    return clearRestaurant;
  }, [signature, setRestaurant, clearRestaurant]);
}

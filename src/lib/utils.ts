import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Generate a unique chat session ID for the home-page chatting session */
export function generateChatSessionId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Truncate text to maxLength characters with ellipsis */
export function truncateText(text: string, maxLength = 40): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}


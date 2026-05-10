import type { ReactNode } from "react";

export interface ModeCard {
  title: string;
  icon: ReactNode;
  description: string;
  duration: string;
  color: string;
  href: string;
}

export interface TrainingRecord {
  id: string;
  title: string;
  accuracy: number;
  date: string;
}


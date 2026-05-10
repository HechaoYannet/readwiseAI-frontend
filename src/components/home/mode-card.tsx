import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ModeCard } from "@/types/home";

interface ModeCardItemProps {
  item: ModeCard;
}

export default function ModeCardItem({ item }: ModeCardItemProps) {
  return (
    <Link href={item.href} className="group block" aria-label={`进入${item.title}`}>
      <Card className={`h-full border-slate-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${item.color}`}>
        <CardHeader>
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/90 text-slate-700">
            {item.icon}
          </div>
          <CardTitle>{item.title}</CardTitle>
          <CardDescription>{item.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium text-slate-700">{item.duration}</p>
        </CardContent>
      </Card>
    </Link>
  );
}


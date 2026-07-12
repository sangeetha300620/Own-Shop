import {
  Briefcase,
  Building2,
  Dumbbell,
  ShoppingCart,
  Sparkles,
  Stethoscope,
  Store,
  UtensilsCrossed,
  Warehouse,
  type LucideProps,
} from "lucide-react";
import { categoryIconName } from "@/lib/format";

const ICONS: Record<string, React.ComponentType<LucideProps>> = {
  UtensilsCrossed,
  Briefcase,
  Warehouse,
  Store,
  Sparkles,
  Stethoscope,
  ShoppingCart,
  Dumbbell,
  Building2,
};

export default function CategoryIcon({
  categoryName,
  ...props
}: { categoryName: string } & LucideProps) {
  const Icon = ICONS[categoryIconName(categoryName)] ?? Building2;
  return <Icon {...props} />;
}

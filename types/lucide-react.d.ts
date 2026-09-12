declare module "lucide-react" {
  import type { ComponentType, SVGProps } from "react";
  export type LucideProps = SVGProps<SVGSVGElement> & { size?: number | string };
  export type LucideIcon = ComponentType<LucideProps>;
  export const Home: LucideIcon;
  export const PlusCircle: LucideIcon;
  export const MapPin: LucideIcon;
  export const Bell: LucideIcon;
  export const BookOpen: LucideIcon;
  export const User: LucideIcon;
  export const Truck: LucideIcon;
  export const LayoutDashboard: LucideIcon;
  export const QrCode: LucideIcon;
  const _: Record<string, LucideIcon>;
  export default _;
}

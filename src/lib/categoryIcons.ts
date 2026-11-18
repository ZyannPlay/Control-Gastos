import {
  Baby, Bike, BookOpen, Briefcase, Bus, Car, Coffee, Dog, Dumbbell, Fuel, Gift, GraduationCap, HeartPulse,
  House, Laptop, Lightbulb, Package, PiggyBank, Pill, Plane, Receipt, Shirt, ShoppingBag, ShoppingCart,
  Smartphone, Tag, Ticket, TrendingUp, Utensils, Wallet, Wifi, Wrench, type LucideIcon,
} from 'lucide-react'

/** Íconos disponibles para categorías. La clave es lo que se guarda en categories.icon. */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  utensils: Utensils, 'shopping-cart': ShoppingCart, bus: Bus, house: House, lightbulb: Lightbulb, pill: Pill,
  ticket: Ticket, shirt: Shirt, 'graduation-cap': GraduationCap, package: Package, briefcase: Briefcase,
  laptop: Laptop, wallet: Wallet, car: Car, fuel: Fuel, plane: Plane, gift: Gift, dog: Dog, 'heart-pulse': HeartPulse,
  smartphone: Smartphone, wifi: Wifi, baby: Baby, dumbbell: Dumbbell, coffee: Coffee, receipt: Receipt,
  'book-open': BookOpen, 'shopping-bag': ShoppingBag, 'piggy-bank': PiggyBank, 'trending-up': TrendingUp,
  bike: Bike, wrench: Wrench, tag: Tag,
}

/** Compatibilidad: categorías viejas guardadas con emoji. */
const EMOJI_TO_ICON: Record<string, string> = {
  '🍔': 'utensils', '🛒': 'shopping-cart', '🚌': 'bus', '🏠': 'house', '💡': 'lightbulb', '💊': 'pill',
  '🎉': 'ticket', '👕': 'shirt', '📚': 'graduation-cap', '📦': 'package', '💼': 'briefcase', '💻': 'laptop', '💰': 'wallet',
}

export function categoryIcon(icon: string | null | undefined): LucideIcon {
  if (!icon) return Tag
  return CATEGORY_ICONS[icon] ?? CATEGORY_ICONS[EMOJI_TO_ICON[icon] ?? ''] ?? Tag
}

/** Colores de categoría: se usan SOLO como punto chico o serie de gráfico, nunca como fondo grande. */
export const CATEGORY_COLORS = ['#e5484d', '#f76b15', '#d6a000', '#30a46c', '#12a594', '#0090ff', '#6e56cf', '#d6409f', '#8d8d8d']

import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export const MAKI_ICON_MAP: Record<string, IconName> = {
  cafe: 'cafe',
  coffee: 'cafe',
  restaurant: 'restaurant',
  'fast-food': 'fast-food',
  bar: 'wine',
  pub: 'beer',
  park: 'leaf',
  garden: 'leaf',
  'art-gallery': 'color-palette',
  museum: 'business',
  cinema: 'film',
  theatre: 'film',
  parking: 'car',
  fuel: 'car',
  hospital: 'medkit',
  pharmacy: 'medical',
  bank: 'cash',
  atm: 'cash',
  shop: 'bag',
  'clothing-store': 'shirt',
  grocery: 'cart',
  bakery: 'restaurant',
  gym: 'barbell',
  swimming: 'water',
  library: 'book',
  school: 'school',
  college: 'school',
  airport: 'airplane',
  bus: 'bus',
  rail: 'train',
  ferry: 'boat',
  bicycle: 'bicycle',
  hotel: 'bed',
  lodging: 'bed',
  campsite: 'bonfire',
};

export function iconForMaki(maki?: string | null): IconName {
  if (maki && MAKI_ICON_MAP[maki]) return MAKI_ICON_MAP[maki];
  return 'location';
}

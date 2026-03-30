import { PlaceCategory } from "../models/types";

export const CATEGORY_COLORS: Record<PlaceCategory, string> = {
  food: "#E8834A",
  coffee: "#8B6347",
  nature: "#4A7C59",
  art: "#9C6ADE",
  sports: "#3D9BE9",
};

export const CATEGORIES: PlaceCategory[] = [
  "food",
  "nature",
  "art",
  "sports",
  "coffee",
];

export const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  food: "Food",
  nature: "Nature",
  art: "Art",
  sports: "Sports",
  coffee: "Coffee",
};

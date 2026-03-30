import { PlaceCategory } from "../../models/types";

export { CATEGORY_COLORS, CATEGORY_LABELS } from "../../shared/constants";

export const ALL_CATEGORIES: Array<PlaceCategory | "all"> = [
  "all",
  "food",
  "nature",
  "art",
  "sports",
  "coffee",
];

export const ALL_CATEGORY_LABELS: Record<PlaceCategory | "all", string> = {
  all: "All",
  food: "Food",
  nature: "Nature",
  art: "Art",
  sports: "Sports",
  coffee: "Coffee",
};

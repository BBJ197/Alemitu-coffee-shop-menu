export interface MenuCategory {
  id: string;
  nameEn: string;
  nameAm: string | null;
  sortOrder: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  nameEn: string;
  nameAm: string | null;
  descriptionEn: string | null;
  descriptionAm: string | null;
  priceEtb: number;
  imagePath: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  /** "HH:MM:SS" or null */
  availableFrom: string | null;
  availableTo: string | null;
  tagIds: string[];
}

export interface MenuTag {
  id: string;
  slug: string;
  group: "fasting" | "diet" | "temperature";
  nameEn: string;
  nameAm: string | null;
}

export interface Menu {
  categories: MenuCategory[];
  items: MenuItem[];
  tags: MenuTag[];
}

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`Menu request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
  }
}

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:3001" : "");

export async function fetchMenu(signal?: AbortSignal): Promise<Menu> {
  const res = await fetch(`${API_BASE}/api/menu`, { signal });
  if (!res.ok) throw new ApiError(res.status);
  return (await res.json()) as Menu;
}

export interface PerformanceItem {
  _id: string;
  title?: string | null;
  description?: string | null;
  url: string;
}

export const performances: PerformanceItem[] = [];

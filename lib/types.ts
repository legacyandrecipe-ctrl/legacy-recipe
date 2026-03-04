export type Occasion = "wedding" | "holiday" | "remembrance" | "family" | "kids";

export type Cookbook = {
  id: string;
  owner_id: string;
  title: string;
  subtitle: string | null;
  occasion: Occasion;
  theme_id: string | null;
  status: "draft" | "ready" | "purchased" | "archived";
};

export type Theme = {
  id: string;
  name: string;
  type: Occasion;
  preview_url?: string | null;
};

export type RecipeLite = {
  id: string;
  title: string;
  source_name: string | null;
  source_side: string | null;
};

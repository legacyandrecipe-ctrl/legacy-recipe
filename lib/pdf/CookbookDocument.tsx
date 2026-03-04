import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

type Recipe = {
  id: string;
  title: string;
  category?: string | null;
  source_name?: string | null;
  source_side?: string | null;
  photo_url?: string | null;
  ingredients?: { item: string }[] | null;
  instructions?: { step: string }[] | null;
};

type Cookbook = {
  id: string;
  title: string;
  subtitle?: string | null;
  occasion: string;
  status: string;
  cover_image_url?: string | null;
};

type Theme = {
  id: string;
  name: string;
  type: string;
};

function themeStyles(themeName?: string) {
  const name = (themeName ?? "").toLowerCase();

  if (name.includes("elegant")) {
    return { accent: "#111827", coverOverlay: 0.25, headerCase: "uppercase" as const };
  }
  if (name.includes("cozy")) {
    return { accent: "#7c2d12", coverOverlay: 0.20, headerCase: "none" as const };
  }
  if (name.includes("memory")) {
    return { accent: "#0f172a", coverOverlay: 0.35, headerCase: "none" as const };
  }
  if (name.includes("kids")) {
    return { accent: "#1d4ed8", coverOverlay: 0.15, headerCase: "none" as const };
  }
  return { accent: "#111827", coverOverlay: 0.20, headerCase: "none" as const };
}

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: "Helvetica", color: "#0f172a" },

  cover: { padding: 0 },
  coverImage: { width: "100%", height: "100%" },
  coverOverlay: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0 },
  coverContent: { position: "absolute", left: 48, right: 48, bottom: 80 },
  coverTitle: { fontSize: 34, fontWeight: 700, color: "white" },
  coverSubtitle: { fontSize: 14, marginTop: 10, color: "white", opacity: 0.95 },

  headerRow: { marginBottom: 18 },
  h1: { fontSize: 20, fontWeight: 700 },
  meta: { marginTop: 6, fontSize: 10, color: "#475569" },

  tocSectionTitle: { marginTop: 14, marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#0f172a" },
  tocItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tocLeft: { flexDirection: "row", gap: 8, maxWidth: "85%" },
  tocNum: { width: 18, color: "#64748b" },
  tocTitle: { fontSize: 11 },

  dividerPage: { padding: 0 },
  dividerBg: { width: "100%", height: "100%" },
  dividerOverlay: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0 },
  dividerContent: { position: "absolute", left: 48, right: 48, top: 220 },
  dividerTitle: { fontSize: 30, fontWeight: 700, color: "white" },
  dividerSub: { marginTop: 10, fontSize: 12, color: "white", opacity: 0.95 },

  recipeTitle: { fontSize: 18, fontWeight: 700, marginBottom: 6 },
  recipeSource: { fontSize: 10, color: "#475569", marginBottom: 12 },
  recipePhoto: { width: "100%", height: 220, objectFit: "cover", borderRadius: 10, marginBottom: 16 },

  sectionTitle: { fontSize: 12, fontWeight: 700, marginTop: 8, marginBottom: 8 },
  bullet: { flexDirection: "row", gap: 8, marginBottom: 4 },
  bulletDot: { width: 10, color: "#334155" },
  bulletText: { flex: 1 },

  footer: {
    position: "absolute",
    left: 48,
    right: 48,
    bottom: 24,
    fontSize: 9,
    color: "#94a3b8",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

function groupByCategory(recipes: Recipe[]) {
  const groups = new Map<string, Recipe[]>();

  for (const r of recipes) {
    const key = (r.category ?? "").trim() || "Uncategorized";
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }

  // Sort categories with a friendly order if present
  const preferred = [
    "Appetizers",
    "Breakfast",
    "Soups & Salads",
    "Main Dishes",
    "Side Dishes",
    "Desserts",
    "Drinks",
    "Sauces & Seasonings",
    "Holiday Favorites",
    "Kids",
    "Other",
    "Uncategorized",
  ];

  const keys = Array.from(groups.keys()).sort((a, b) => {
    const ia = preferred.indexOf(a);
    const ib = preferred.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });

  return keys.map((k) => ({ category: k, recipes: groups.get(k)! }));
}

export default function CookbookDocument({
  cookbook,
  theme,
  orderedRecipes,
}: {
  cookbook: Cookbook;
  theme?: Theme | null;
  orderedRecipes: Recipe[];
}) {
  const t = themeStyles(theme?.name);

  const grouped = groupByCategory(orderedRecipes);

  const headerCase = t.headerCase;
  function formatTitle(str: string) {
    return headerCase === "uppercase" ? str.toUpperCase() : str;
  }

  return (
    <Document>
      {/* COVER */}
      <Page size="LETTER" style={[styles.page, styles.cover]}>
        {cookbook.cover_image_url ? (
          <Image src={cookbook.cover_image_url} style={styles.coverImage} />
        ) : (
          <View style={[styles.coverImage, { backgroundColor: t.accent }]} />
        )}

        <View style={[styles.coverOverlay, { backgroundColor: "black", opacity: t.coverOverlay }]} />

        <View style={styles.coverContent}>
          <Text style={styles.coverTitle}>{formatTitle(cookbook.title)}</Text>
          {cookbook.subtitle ? <Text style={styles.coverSubtitle}>{cookbook.subtitle}</Text> : null}
          <Text style={[styles.coverSubtitle, { marginTop: 14, fontSize: 11, opacity: 0.9 }]}>
            {theme?.name ? `Theme: ${theme.name}` : cookbook.occasion}
          </Text>
        </View>
      </Page>

      {/* TABLE OF CONTENTS */}
      <Page size="LETTER" style={styles.page}>
        <View style={styles.headerRow}>
          <Text style={styles.h1}>Table of Contents</Text>
          <Text style={styles.meta}>{orderedRecipes.length} recipes</Text>
        </View>

        {grouped.map((g) => (
          <View key={g.category} wrap={false}>
            <Text style={styles.tocSectionTitle}>{g.category}</Text>

            {g.recipes.map((r, idx) => (
              <View key={r.id} style={styles.tocItem}>
                <View style={styles.tocLeft}>
                  <Text style={styles.tocNum}>{idx + 1}.</Text>
                  <Text style={styles.tocTitle}>{r.title}</Text>
                </View>
                {/* Page numbers are tricky in MVP; we’ll add real page references later */}
                <Text style={{ color: "#94a3b8" }}>—</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text>{cookbook.title}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>

      {/* CATEGORY DIVIDERS + RECIPE PAGES */}
      {grouped.map((g) => (
        <React.Fragment key={g.category}>
          {/* Divider page per category */}
          <Page size="LETTER" style={[styles.page, styles.dividerPage]}>
            <View style={[styles.dividerBg, { backgroundColor: t.accent }]} />
            <View style={[styles.dividerOverlay, { backgroundColor: "black", opacity: 0.25 }]} />
            <View style={styles.dividerContent}>
              <Text style={styles.dividerTitle}>{g.category}</Text>
              <Text style={styles.dividerSub}>
                {g.recipes.length} {g.recipes.length === 1 ? "recipe" : "recipes"}
              </Text>
            </View>
          </Page>

          {/* Recipes in category */}
          {g.recipes.map((r) => (
            <Page key={r.id} size="LETTER" style={styles.page}>
              <View style={styles.headerRow}>
                <Text style={styles.recipeTitle}>{r.title}</Text>
                <Text style={styles.recipeSource}>
                  {r.source_name ? `From ${r.source_name}` : ""}
                  {r.source_side ? (r.source_name ? ` • ${r.source_side}` : r.source_side) : ""}
                </Text>
              </View>

              {r.photo_url ? <Image src={r.photo_url} style={styles.recipePhoto} /> : null}

              <Text style={styles.sectionTitle}>Ingredients</Text>
              {(r.ingredients ?? []).length ? (
                (r.ingredients ?? []).map((ing, i) => (
                  <View key={i} style={styles.bullet}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{ing.item}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: "#64748b" }}>—</Text>
              )}

              <Text style={[styles.sectionTitle, { marginTop: 14 }]}>Instructions</Text>
              {(r.instructions ?? []).length ? (
                (r.instructions ?? []).map((step, i) => (
                  <View key={i} style={styles.bullet}>
                    <Text style={[styles.bulletDot, { width: 18 }]}>{i + 1}.</Text>
                    <Text style={styles.bulletText}>{step.step}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: "#64748b" }}>—</Text>
              )}

              <View style={styles.footer} fixed>
                <Text>{cookbook.title}</Text>
                <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
              </View>
            </Page>
          ))}
        </React.Fragment>
      ))}
    </Document>
  );
}
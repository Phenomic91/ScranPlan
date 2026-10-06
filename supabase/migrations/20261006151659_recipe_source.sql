-- Where an imported recipe came from: { url, siteName, author, importedAt, inferred }.
-- Null for recipes typed into the app. The shape is recipeSourceSchema in
-- src/domain/recipes/recipe.ts.
alter table public.recipes add column source jsonb;

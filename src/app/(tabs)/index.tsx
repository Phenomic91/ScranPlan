import { router } from 'expo-router';
import { useState } from 'react';

import type { Recipe } from '@/domain/recipes/recipe';
import { RecipeCard } from '@/features/recipes/recipe-card';
import { useRecipes } from '@/features/recipes/recipes-store';
import { Button } from '@/ui/button';
import { Chip, ChipRow } from '@/ui/chip';
import { Screen } from '@/ui/screen';
import { Text } from '@/ui/text';

export default function RecipesScreen() {
  const { mine, starters } = useRecipes();
  const [veggieOnly, setVeggieOnly] = useState(false);
  const shown = (list: readonly Recipe[]) =>
    veggieOnly ? list.filter((recipe) => recipe.vegetarian) : list;

  return (
    <Screen title="Recipes">
      <Button label="New recipe" onPress={() => router.push('/recipe/new')} />
      <ChipRow>
        <Chip
          label="Veggie only"
          selected={veggieOnly}
          onPress={() => setVeggieOnly((on) => !on)}
        />
      </ChipRow>

      <RecipeSection title="Your recipes" recipes={shown(mine)} />
      <RecipeSection title="Starter recipes" recipes={shown(starters)} />
    </Screen>
  );
}

function RecipeSection({ title, recipes }: { title: string; recipes: readonly Recipe[] }) {
  if (recipes.length === 0) return null;
  return (
    <>
      <Text variant="heading">{title}</Text>
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </>
  );
}

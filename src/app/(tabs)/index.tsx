import { router } from 'expo-router';

import { RecipeCard } from '@/features/recipes/recipe-card';
import { useRecipes } from '@/features/recipes/recipes-store';
import { Button } from '@/ui/button';
import { Screen } from '@/ui/screen';
import { Text } from '@/ui/text';

export default function RecipesScreen() {
  const { mine, starters } = useRecipes();

  return (
    <Screen title="Recipes">
      <Button label="New recipe" onPress={() => router.push('/recipe/new')} />

      {mine.length > 0 ? (
        <>
          <Text variant="heading">Your recipes</Text>
          {mine.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </>
      ) : null}

      <Text variant="heading">Starter recipes</Text>
      {starters.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </Screen>
  );
}

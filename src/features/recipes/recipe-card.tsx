import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import type { Recipe } from '@/domain/recipes/recipe';
import { Card } from '@/ui/card';
import { Text } from '@/ui/text';

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link href={{ pathname: '/recipe/[id]', params: { id: recipe.id } }} asChild>
      <Pressable style={({ pressed }) => pressed && styles.pressed}>
        <Card>
          <Text variant="heading">{recipe.name}</Text>
          <Text variant="caption" muted>
            {recipeSummary(recipe)}
          </Text>
          {recipe.blurb ? <Text muted>{recipe.blurb}</Text> : null}
        </Card>
      </Pressable>
    </Link>
  );
}

/** "25 min · serves 2 · vegetarian" */
export function recipeSummary(recipe: Recipe): string {
  return [
    `${recipe.minutes} min`,
    `serves ${recipe.serves}`,
    recipe.vegetarian ? 'vegetarian' : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
});

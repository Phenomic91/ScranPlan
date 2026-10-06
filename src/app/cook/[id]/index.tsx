import { useLocalSearchParams } from 'expo-router';

import { CookView } from '@/features/cook/cook-view';
import { useRecipe } from '@/features/recipes/recipes-store';
import { MessageScreen } from '@/ui/message-screen';

export default function CookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipe = useRecipe(id);
  return recipe ? <CookView recipe={recipe} /> : <MessageScreen title="Recipe not found" />;
}

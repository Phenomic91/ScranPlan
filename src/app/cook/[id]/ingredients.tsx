import { useLocalSearchParams } from 'expo-router';

import { CookChecklist } from '@/features/cook/cook-checklist';
import { useRecipe } from '@/features/recipes/recipes-store';
import { MessageScreen } from '@/ui/message-screen';

export default function CookChecklistSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipe = useRecipe(id);
  return recipe ? <CookChecklist recipe={recipe} /> : <MessageScreen title="Recipe not found" />;
}

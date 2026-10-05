import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { recipeFromForm, type RecipeForm } from '@/features/recipes/recipe-from-text';
import { addRecipe } from '@/features/recipes/recipes-store';
import { Button } from '@/ui/button';
import { Screen } from '@/ui/screen';
import { Text } from '@/ui/text';
import { TextField } from '@/ui/text-field';

const EMPTY_FORM: RecipeForm = {
  name: '',
  serves: '2',
  minutes: '30',
  ingredients: '',
  method: '',
};

export default function NewRecipeScreen() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const update = (field: keyof RecipeForm) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const id = await addRecipe(await recipeFromForm(form));
      router.replace({ pathname: '/recipe/[id]', params: { id } });
    } catch (error) {
      Alert.alert("Couldn't save the recipe", error instanceof Error ? error.message : undefined);
      setSaving(false);
    }
  };

  return (
    <Screen>
      <TextField label="Name" value={form.name} onChangeText={update('name')} autoFocus />
      <TextField
        label="Serves"
        value={form.serves}
        onChangeText={update('serves')}
        keyboardType="number-pad"
      />
      <TextField
        label="Minutes"
        value={form.minutes}
        onChangeText={update('minutes')}
        keyboardType="number-pad"
      />
      <TextField
        label="Ingredients, one per line"
        value={form.ingredients}
        onChangeText={update('ingredients')}
        placeholder={'300 g chicken breast\n2 tbsp soy sauce'}
        multiline
      />
      <TextField
        label="Method, one step per line"
        value={form.method}
        onChangeText={update('method')}
        multiline
      />
      <Text variant="caption" muted>
        AI reads the ingredient amounts so the recipe can scale. Without AI they are saved as
        written.
      </Text>
      <Button label="Save" onPress={save} busy={saving} disabled={!form.name.trim()} />
    </Screen>
  );
}

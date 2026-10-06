import { router } from 'expo-router';
import { useState } from 'react';

import { ImportError } from '@/features/import/import-error';
import { ImportForm, type ImportKind } from '@/features/import/import-form';
import { importFromLink, importFromText } from '@/features/import/import-recipe';
import { RecipePreview } from '@/features/import/recipe-preview';
import { addRecipe, type RecipeDraft } from '@/features/recipes/recipes-store';
import { Button } from '@/ui/button';
import { Screen } from '@/ui/screen';
import { Text } from '@/ui/text';
import { useColors } from '@/ui/theme';

export default function ImportScreen() {
  const colors = useColors();
  const [busy, setBusy] = useState<ImportKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<RecipeDraft | null>(null);
  const [saving, setSaving] = useState(false);

  const read = async (kind: ImportKind, input: string) => {
    setBusy(kind);
    setError(null);
    try {
      setDraft(await (kind === 'link' ? importFromLink(input) : importFromText(input)));
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const id = await addRecipe({ ...draft, name: draft.name.trim() });
      router.replace({ pathname: '/recipe/[id]', params: { id } });
    } catch (caught) {
      setError(errorMessage(caught));
      setSaving(false);
    }
  };

  const errorText = error ? <Text style={{ color: colors.danger }}>{error}</Text> : null;

  if (!draft) {
    return (
      <Screen>
        <ImportForm busy={busy} onRead={read} />
        {errorText}
      </Screen>
    );
  }

  return (
    <Screen>
      <RecipePreview draft={draft} onRename={(name) => setDraft({ ...draft, name })} />
      {errorText}
      <Button label="Save recipe" onPress={save} busy={saving} disabled={!draft.name.trim()} />
      <Button label="Start again" variant="secondary" onPress={() => setDraft(null)} />
    </Screen>
  );
}

function errorMessage(error: unknown): string {
  if (error instanceof ImportError) return error.message;
  const detail = error instanceof Error ? ` (${error.message})` : '';
  return `Something went wrong reading the recipe${detail}. Try again.`;
}

import { router, Stack } from 'expo-router';
import { useRef, useState } from 'react';
import { Keyboard, type ScrollView } from 'react-native';

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
  const [readError, setReadError] = useState<{ kind: ImportKind; message: string } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draft, setDraft] = useState<RecipeDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const screen = useRef<ScrollView>(null);

  // iOS only scrolls the top of a tall text box above the keyboard, which leaves
  // the caret and the Read button hidden. The box is last, so scroll to the end.
  const showTextBox = () => {
    const scrollToEnd = () => screen.current?.scrollToEnd({ animated: true });
    if (Keyboard.isVisible()) return scrollToEnd();
    const shown = Keyboard.addListener('keyboardDidShow', () => {
      shown.remove();
      scrollToEnd();
    });
  };

  const read = async (kind: ImportKind, input: string) => {
    setBusy(kind);
    setReadError(null);
    try {
      setDraft(await (kind === 'link' ? importFromLink(input) : importFromText(input)));
    } catch (caught) {
      setReadError({ kind, message: errorMessage(caught) });
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
      setSaveError(errorMessage(caught));
      setSaving(false);
    }
  };

  const cancel = (
    <Stack.Screen
      options={{
        headerLeft: () => (
          <Text style={{ color: colors.accent }} onPress={() => router.back()}>
            Cancel
          </Text>
        ),
      }}
    />
  );

  if (!draft) {
    return (
      <Screen ref={screen}>
        {cancel}
        <ImportForm busy={busy} error={readError} onRead={read} onTextFocus={showTextBox} />
      </Screen>
    );
  }

  return (
    <Screen>
      {cancel}
      <RecipePreview draft={draft} onRename={(name) => setDraft({ ...draft, name })} />
      {saveError ? <Text style={{ color: colors.danger }}>{saveError}</Text> : null}
      <Button label="Save recipe" onPress={save} busy={saving} disabled={!draft.name.trim()} />
      <Button label="Start again" variant="secondary" onPress={() => setDraft(null)} />
    </Screen>
  );
}

function errorMessage(error: unknown): string {
  if (error instanceof ImportError) return error.message;
  const detail = error instanceof Error ? ` (${error.message})` : '';
  return `Something went wrong${detail}. Try again.`;
}

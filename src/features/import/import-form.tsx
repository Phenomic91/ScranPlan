import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Keyboard, StyleSheet } from 'react-native';

import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Text } from '@/ui/text';
import { TextField } from '@/ui/text-field';
import { useColors } from '@/ui/theme';

export type ImportKind = 'link' | 'text';

type ImportFormProps = {
  /** Which import is running, if any. */
  busy: ImportKind | null;
  /** The last failed import, shown in the card it came from. */
  error: { kind: ImportKind; message: string } | null;
  onRead: (kind: ImportKind, input: string) => void;
  /** Called when the recipe text box gains focus; it is the last thing on the page. */
  onTextFocus: () => void;
};

/** The two ways in: paste a link, or paste the recipe's text. */
export function ImportForm({ busy, error, onRead, onTextFocus }: ImportFormProps) {
  const colors = useColors();
  const [link, setLink] = useState('');
  const [text, setText] = useState('');

  // The keyboard would otherwise hide the progress and any error.
  const read = (kind: ImportKind, input: string) => {
    Keyboard.dismiss();
    onRead(kind, input);
  };

  const status = (kind: ImportKind) => {
    if (busy === kind) return <Text muted>Reading the recipe. This can take up to a minute.</Text>;
    if (error?.kind === kind) return <Text style={{ color: colors.danger }}>{error.message}</Text>;
    return null;
  };

  return (
    <>
      <Card>
        <Text variant="heading">Paste a link</Text>
        <Text muted>Copy the recipe&apos;s web address in Safari, then paste it here.</Text>
        {Clipboard.isPasteButtonAvailable ? (
          // Apple's own paste button reads the clipboard without asking for permission.
          <Clipboard.ClipboardPasteButton
            acceptedContentTypes={['url', 'plain-text']}
            backgroundColor={colors.accent}
            foregroundColor={colors.onAccent}
            cornerStyle="large"
            style={styles.pasteButton}
            onPress={(data) => {
              if (data.type !== 'text' || busy) return;
              setLink(data.text);
              read('link', data.text);
            }}
          />
        ) : null}
        <TextField
          label="Or type the link"
          value={link}
          onChangeText={setLink}
          placeholder="https://www.bbcgoodfood.com/recipes/…"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          onSubmitEditing={() => link.trim() && read('link', link)}
        />
        <Button
          label="Read link"
          variant="secondary"
          busy={busy === 'link'}
          disabled={!link.trim() || busy !== null}
          onPress={() => read('link', link)}
        />
        {status('link')}
      </Card>

      <Card>
        <Text variant="heading">Paste text</Text>
        <Text muted>
          For Apple Notes, video descriptions or anything without a link. AI tidies it into a
          recipe.
        </Text>
        <TextField
          label="Recipe text"
          value={text}
          onChangeText={setText}
          placeholder="Paste the ingredients and method here"
          onFocus={onTextFocus}
          multiline
        />
        <Button
          label="Read recipe"
          variant="secondary"
          busy={busy === 'text'}
          disabled={!text.trim() || busy !== null}
          onPress={() => read('text', text)}
        />
        {status('text')}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  pasteButton: { height: 48, width: 140 },
});

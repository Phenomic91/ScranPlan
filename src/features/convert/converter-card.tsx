import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { ConversionRow } from '@/domain/convert/format';
import { convertMeasure, VOLUME_UNITS, WEIGHT_UNITS } from '@/domain/convert/measures';
import { convertOven, OVEN_SCALES, type OvenScale } from '@/domain/convert/oven';
import { Card } from '@/ui/card';
import { Chip, ChipRow } from '@/ui/chip';
import { Text } from '@/ui/text';
import { TextField } from '@/ui/text-field';
import { spacing, useColors } from '@/ui/theme';

export type ConverterKind = 'weight' | 'volume' | 'oven';

const KINDS: {
  id: ConverterKind;
  label: string;
  units: readonly { id: string; label: string }[];
}[] = [
  { id: 'weight', label: 'Weight', units: WEIGHT_UNITS },
  { id: 'volume', label: 'Volume', units: VOLUME_UNITS },
  { id: 'oven', label: 'Oven', units: OVEN_SCALES },
];

type Entry = { amount: string; unit: string };

type ConverterCardProps = {
  kind: ConverterKind;
  onKindChange: (kind: ConverterKind) => void;
};

/** Pick weight, volume or oven, type an amount, and see it in every other unit. */
export function ConverterCard({ kind, onKindChange }: ConverterCardProps) {
  // Each kind keeps its own entry, so switching back and forth loses nothing.
  const [entries, setEntries] = useState<Record<ConverterKind, Entry>>({
    weight: { amount: '250', unit: 'g' },
    volume: { amount: '200', unit: 'ml' },
    oven: { amount: '200', unit: 'celsius' },
  });
  const entry = entries[kind];
  const setEntry = (change: Partial<Entry>) =>
    setEntries((current) => ({ ...current, [kind]: { ...current[kind], ...change } }));
  const units = KINDS.find((item) => item.id === kind)!.units;

  return (
    <>
      <ChipRow>
        {KINDS.map((item) => (
          <Chip
            key={item.id}
            label={item.label}
            selected={item.id === kind}
            onPress={() => onKindChange(item.id)}
          />
        ))}
      </ChipRow>

      <Card>
        <TextField
          label="Amount"
          value={entry.amount}
          onChangeText={(amount) => setEntry({ amount })}
          keyboardType="decimal-pad"
          returnKeyType="done"
        />
        <Text variant="caption" muted>
          From
        </Text>
        <ChipRow>
          {units.map((unit) => (
            <Chip
              key={unit.id}
              label={unit.label}
              selected={unit.id === entry.unit}
              onPress={() => setEntry({ unit: unit.id })}
            />
          ))}
        </ChipRow>
      </Card>

      <Results rows={convert(kind, entry)} />
    </>
  );
}

function convert(kind: ConverterKind, entry: Entry): ConversionRow[] | null {
  // Accept "1,5" as well as "1.5".
  const value = Number.parseFloat(entry.amount.replace(',', '.'));
  if (!Number.isFinite(value)) return null;
  if (kind === 'oven') return convertOven(value, entry.unit as OvenScale);
  return convertMeasure(value, entry.unit, kind === 'weight' ? WEIGHT_UNITS : VOLUME_UNITS);
}

function Results({ rows }: { rows: ConversionRow[] | null }) {
  const colors = useColors();
  return (
    <Card>
      {rows === null ? (
        <Text muted>Enter a number to convert.</Text>
      ) : (
        rows.map((row, index) => (
          <View
            key={row.label}
            style={[styles.row, index > 0 && { borderTopColor: colors.border, ...styles.divided }]}
          >
            <Text muted>{row.label}</Text>
            <Text style={styles.value}>{row.value}</Text>
          </View>
        ))
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  divided: { borderTopWidth: StyleSheet.hairlineWidth },
  value: { fontSize: 26, lineHeight: 30, fontWeight: '500', fontVariant: ['tabular-nums'] },
});

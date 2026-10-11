import { StyleSheet, View } from 'react-native';

import { FAN_OFFSET, formatGasMark, GAS_MARKS } from '@/domain/convert/oven';
import { SWAPS } from '@/domain/convert/swaps';
import { Card } from '@/ui/card';
import { Text } from '@/ui/text';
import { spacing, useColors } from '@/ui/theme';

export function GasMarkTable() {
  const colors = useColors();
  return (
    <Card>
      <Text variant="heading">Gas marks</Text>
      <TableRow cells={['Gas', '°C', 'Fan', '°F']} header />
      {GAS_MARKS.map((row) => (
        <View key={row.mark} style={[styles.divided, { borderTopColor: colors.border }]}>
          <TableRow
            cells={[
              formatGasMark(row.mark),
              String(row.celsius),
              String(row.celsius - FAN_OFFSET),
              String(row.fahrenheit),
            ]}
          />
        </View>
      ))}
    </Card>
  );
}

function TableRow({ cells, header = false }: { cells: string[]; header?: boolean }) {
  return (
    <View style={styles.tableRow}>
      {cells.map((cell, index) => (
        <Text key={index} variant={header ? 'caption' : 'body'} muted={header} style={styles.cell}>
          {cell}
        </Text>
      ))}
    </View>
  );
}

export function SwapsCard() {
  return (
    <Card>
      <Text variant="heading">Swaps that work</Text>
      {SWAPS.map((swap) => (
        <View key={swap.name} style={styles.swap}>
          <Text style={styles.swapName}>{swap.name}</Text>
          <Text muted>{swap.detail}</Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  tableRow: { flexDirection: 'row', paddingVertical: spacing.xs },
  cell: { flex: 1, fontVariant: ['tabular-nums'] },
  divided: { borderTopWidth: StyleSheet.hairlineWidth },
  swap: { gap: 2, marginTop: spacing.xs },
  swapName: { fontWeight: '600' },
});

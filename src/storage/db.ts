import Dexie, { type Table } from 'dexie';
import type { Preset, Roll } from '../dice/types';

class DiceDB extends Dexie {
  rolls!: Table<Roll, string>;
  presets!: Table<Preset, string>;

  constructor() {
    super('dice-roller');
    this.version(1).stores({
      rolls: 'id, timestamp',
      presets: 'id, createdAt',
    });
  }
}

export const db = new DiceDB();

export async function addRoll(roll: Roll): Promise<void> {
  await db.rolls.add(roll);
}

export async function getHistory(limit = 100, offset = 0): Promise<Roll[]> {
  return db.rolls.orderBy('timestamp').reverse().offset(offset).limit(limit).toArray();
}

export async function deleteRoll(id: string): Promise<void> {
  await db.rolls.delete(id);
}

export async function clearHistory(): Promise<void> {
  await db.rolls.clear();
}

export async function exportHistory(): Promise<Blob> {
  const rolls = await db.rolls.orderBy('timestamp').toArray();
  return new Blob([JSON.stringify(rolls, null, 2)], { type: 'application/json' });
}

export async function getPresets(): Promise<Preset[]> {
  return db.presets.orderBy('createdAt').toArray();
}

export async function savePreset(p: Preset): Promise<void> {
  await db.presets.put(p);
}

export async function deletePreset(id: string): Promise<void> {
  await db.presets.delete(id);
}

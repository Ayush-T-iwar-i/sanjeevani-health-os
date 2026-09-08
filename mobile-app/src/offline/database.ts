// TEMPORARY: WatermelonDB's SQLiteAdapter needs custom native code that isn't
// available inside Expo Go (same limitation as react-native-webrtc). This
// in-memory mock lets you test the UI in Expo Go without crashing. Swap back
// to the real SQLiteAdapter once you build a custom dev client
// (`npx expo prebuild` + `eas build --profile development`).

type MockRecord = { id: string; [key: string]: any };

class MockCollection {
  private rows: MockRecord[] = [];

  async create(builder: (record: MockRecord) => void): Promise<MockRecord> {
    const record: MockRecord = { id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
    builder(record);
    this.rows.push(record);
    return record;
  }

  query(..._args: any[]) {
    return {
      fetch: async () => this.rows.filter((r) => r.attempted !== true),
    };
  }
}

class MockDatabase {
  private collections = new Map<string, MockCollection>();

  get(tableName: string): MockCollection {
    if (!this.collections.has(tableName)) {
      this.collections.set(tableName, new MockCollection());
    }
    return this.collections.get(tableName)!;
  }

  async write<T>(fn: () => Promise<T>): Promise<T> {
    return fn();
  }
}

export const database = new MockDatabase() as any;
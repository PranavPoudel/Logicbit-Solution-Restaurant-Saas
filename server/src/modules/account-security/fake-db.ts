// Test-only: a tiny in-memory stand-in for the parts of Prisma that the account-security code uses.
type Row = Record<string, any>;

function matches(row: Row, where: Row): boolean {
  return Object.entries(where).every(([key, want]) => {
    const have = row[key];
    if (want === null) return have == null; // a column that was never set reads as null, like in the database
    if (want && typeof want === 'object' && !(want instanceof Date)) {
      if ('equals' in want) return typeof have === 'string' && have.toLowerCase() === String(want.equals).toLowerCase();
      if ('gte' in want && !(have >= want.gte)) return false;
      if ('gt' in want && !(have > want.gt)) return false;
      if ('lt' in want && !(have < want.lt)) return false;
      if ('lte' in want && !(have <= want.lte)) return false;
      return true;
    }
    return have === want;
  });
}

function apply(row: Row, data: Row) {
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && !(value instanceof Date) && 'increment' in value) row[key] = (row[key] ?? 0) + value.increment;
    else row[key] = value;
  }
}

export function fakeTable(rows: Row[], defaults: Row = {}) {
  let counter = 0;
  const table = {
    rows,
    findFirst: async ({ where, orderBy }: any = {}) => {
      let found = rows.filter((r) => matches(r, where ?? {}));
      if (orderBy?.createdAt === 'desc') found = [...found].sort((a, b) => b.createdAt - a.createdAt);
      return found[0] ?? null;
    },
    findUnique: async ({ where }: any) => rows.find((r) => matches(r, where)) ?? null,
    findMany: async ({ where, orderBy }: any = {}) => {
      let found = rows.filter((r) => matches(r, where ?? {}));
      if (orderBy?.createdAt === 'desc') found = [...found].sort((a, b) => b.createdAt - a.createdAt);
      return found;
    },
    create: async ({ data }: any) => {
      const row = { id: `row-${++counter}`, createdAt: new Date(), ...defaults, ...data };
      rows.push(row);
      return row;
    },
    update: async ({ where, data }: any) => {
      const row = rows.find((r) => matches(r, where));
      if (!row) throw new Error('row not found');
      apply(row, data);
      return row;
    },
    updateMany: async ({ where, data }: any) => {
      const found = rows.filter((r) => matches(r, where));
      found.forEach((r) => apply(r, data));
      return { count: found.length };
    },
  };
  return table;
}

/** `$transaction([...])` just awaits each already-started operation. */
export const fakeTransaction = async (ops: Promise<unknown>[]) => Promise.all(ops);

import 'dotenv/config';
import Database from 'better-sqlite3';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const dbPath = process.env.DATABASE_URL ?? './user_management.db';
const targetCount = Number(process.env.SEED_COUNT ?? '60');
const forceSeed = process.env.SEED_FORCE === '1';

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name', { length: 120 }).notNull(),
  birthday: text('birthday').notNull(),
  gender: text('gender', { enum: ['male', 'female', 'other'] }).notNull(),
  country: text('country', { length: 120 }).notNull(),
});

const existing = db.select({ count: sql`count(*)` }).from(users).get();
const existingCount = Number(existing?.count ?? 0);

if (!forceSeed && existingCount >= targetCount) {
  console.log(`Seed skipped: ${existingCount} users already exist.`);
  process.exit(0);
}

if (forceSeed && existingCount > 0) {
  db.delete(users).run();
}

const toCreate = forceSeed ? targetCount : Math.max(0, targetCount - existingCount);
if (toCreate === 0) {
  console.log('Seed skipped: nothing to insert.');
  process.exit(0);
}

const rng = mulberry32(42);
const seedUsers = generateUsers(toCreate, rng);

db.insert(users).values(seedUsers).run();
console.log(`Seeded ${seedUsers.length} users into ${dbPath}.`);

function generateUsers(count, random) {
  const firstNames = [
    'Alex', 'Maya', 'Daniel', 'Sofia', 'Leo', 'Nora', 'Owen', 'Lena', 'Ethan',
    'Ivy', 'Mateo', 'Zara', 'Noah', 'Mila', 'Lucas', 'Chloe', 'Eli', 'Ava',
    'Gabriel', 'Aria',
  ];
  const lastNames = [
    'Martin', 'Ivanov', 'Khan', 'Garcia', 'Smith', 'Novak', 'Petrova', 'Kim',
    'Rossi', 'Walker', 'Santos', 'Wang', 'Silva', 'Hansen', 'Brown', 'Lee',
    'Muller', 'Nowak', 'Nguyen', 'Patel',
  ];
  const countries = [
    'United States', 'Canada', 'Germany', 'France', 'Spain', 'Italy', 'Brazil',
    'Mexico', 'United Kingdom', 'Norway', 'Sweden', 'Poland', 'Ukraine',
    'Japan', 'South Korea', 'Australia', 'India', 'Netherlands', 'Portugal',
    'South Africa',
  ];
  const genders = ['male', 'female', 'other'];

  const list = [];
  for (let i = 0; i < count; i += 1) {
    const name = `${pick(firstNames, random)} ${pick(lastNames, random)}`;
    const birthday = randomDate(random, 1975, 2004);
    const gender = pick(genders, random);
    const country = pick(countries, random);
    list.push({ name, birthday, gender, country });
  }

  return list;
}

function pick(items, random) {
  return items[Math.floor(random() * items.length)];
}

function randomDate(random, yearStart, yearEnd) {
  const year = randInt(random, yearStart, yearEnd);
  const month = randInt(random, 1, 12);
  const day = randInt(random, 1, 28);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function randInt(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function mulberry32(seed) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

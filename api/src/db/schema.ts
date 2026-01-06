import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name', { length: 120 }).notNull(),
  birthday: text('birthday').notNull(),
  gender: text('gender', { enum: ['male', 'female', 'other'] }).notNull(),
  country: text('country', { length: 120 }).notNull(),
});

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;

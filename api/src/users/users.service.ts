import { Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import type { User } from '@shared';
import { DatabaseService } from '../db/db.service';
import { users } from '../db/schema';

type CreateUserInput = Omit<User, 'id'>;
type UpdateUserInput = Omit<User, 'id'>;

@Injectable()
export class UsersService {
  constructor(private readonly database: DatabaseService) {}

  findAll() {
    return this.database.db.select().from(users).orderBy(asc(users.id)).all();
  }

  findById(id: number) {
    return this.database.db.select().from(users).where(eq(users.id, id)).get();
  }

  create(input: CreateUserInput) {
    const result = this.database.db.insert(users).values(input).run();
    const id = Number(result.lastInsertRowid);
    return this.findById(id);
  }

  update(id: number, input: UpdateUserInput) {
    const result = this.database.db.update(users).set(input).where(eq(users.id, id)).run();
    if (result.changes === 0) {
      return null;
    }
    return this.findById(id);
  }

  remove(id: number) {
    const result = this.database.db.delete(users).where(eq(users.id, id)).run();
    return result.changes > 0;
  }
}

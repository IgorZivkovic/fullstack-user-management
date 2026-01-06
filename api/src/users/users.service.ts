import { Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DatabaseService } from '../db/db.service';
import { users } from '../db/schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly database: DatabaseService) {}

  findAll() {
    return this.database.db.select().from(users).orderBy(asc(users.id)).all();
  }

  findById(id: number) {
    return this.database.db.select().from(users).where(eq(users.id, id)).get();
  }

  create(input: CreateUserDto) {
    const result = this.database.db.insert(users).values(input).run();
    const id = Number(result.lastInsertRowid);
    return this.findById(id);
  }

  update(id: number, input: UpdateUserDto) {
    const updatePayload = this.cleanUpdatePayload(input);
    if (Object.keys(updatePayload).length === 0) {
      return this.findById(id);
    }
    const result = this.database.db.update(users).set(updatePayload).where(eq(users.id, id)).run();
    if (result.changes === 0) {
      return null;
    }
    return this.findById(id);
  }

  remove(id: number) {
    const result = this.database.db.delete(users).where(eq(users.id, id)).run();
    return result.changes > 0;
  }

  private cleanUpdatePayload(input: UpdateUserDto) {
    const payload: Partial<UpdateUserDto> = {};
    if (input.name !== undefined) {
      payload.name = input.name;
    }
    if (input.birthday !== undefined) {
      payload.birthday = input.birthday;
    }
    if (input.gender !== undefined) {
      payload.gender = input.gender;
    }
    if (input.country !== undefined) {
      payload.country = input.country;
    }
    return payload;
  }
}

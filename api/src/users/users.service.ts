import { Injectable } from '@nestjs/common';
import { and, asc, eq, or, sql } from 'drizzle-orm';
import { DatabaseService } from '../db/db.service';
import { users } from '../db/schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersQueryDto } from './dto/users-query.dto';

@Injectable()
export class UsersService {
  constructor(private readonly database: DatabaseService) {}

  findAll(query: UsersQueryDto = {}) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 10));
    const search = query.search?.trim();
    const gender = query.gender;

    const filters = [];
    if (search) {
      const term = `%${this.escapeLike(search)}%`;
      filters.push(
        or(
          sql`${users.name} like ${term} escape '\\'`,
          sql`${users.country} like ${term} escape '\\'`,
        ),
      );
    }
    if (gender) {
      filters.push(eq(users.gender, gender));
    }

    const whereClause =
      filters.length === 0 ? undefined : filters.length === 1 ? filters[0] : and(...filters);

    const baseQuery = this.database.db.select().from(users);
    const dataQuery = whereClause ? baseQuery.where(whereClause) : baseQuery;
    const data = dataQuery
      .orderBy(asc(users.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .all();

    const countQuery = this.database.db.select({ count: sql<number>`count(*)` }).from(users);
    const countRow = (whereClause ? countQuery.where(whereClause) : countQuery).get();
    const total = Number(countRow?.count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
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

  private escapeLike(value: string) {
    return value.replace(/[\\%_]/g, (character) => `\\${character}`);
  }
}

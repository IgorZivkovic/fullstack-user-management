import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly sqlite: Database.Database;
  readonly db: BetterSQLite3Database<typeof schema>;

  constructor(private readonly config: ConfigService) {
    const dbPath = this.config.get('DATABASE_URL', './user_management.db');
    this.sqlite = new Database(dbPath);
    this.db = drizzle(this.sqlite, { schema });
  }

  onModuleDestroy() {
    this.sqlite.close();
  }
}

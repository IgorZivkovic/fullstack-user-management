import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import type { User } from '@shared';
import { UsersService } from './users.service';

type CreateUserInput = Omit<User, 'id'>;
type UpdateUserInput = Omit<User, 'id'>;

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number) {
    const user = this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  @Post()
  create(@Body() body: CreateUserInput) {
    return this.usersService.create(body);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateUserInput) {
    const user = this.usersService.update(id, body);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    const removed = this.usersService.remove(id);
    if (!removed) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return { deleted: true };
  }
}

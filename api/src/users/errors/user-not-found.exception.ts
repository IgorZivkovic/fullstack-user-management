import { NotFoundException } from '@nestjs/common';

export class UserNotFoundException extends NotFoundException {
  constructor(id: number) {
    super({
      message: `User ${id} not found`,
      errorCode: 'USER_NOT_FOUND',
    });
  }
}

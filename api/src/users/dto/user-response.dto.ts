import { ApiProperty } from '@nestjs/swagger';

const genderValues = ['male', 'female', 'other'] as const;

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Noah Rossi' })
  name!: string;

  @ApiProperty({ example: '2000-09-05' })
  birthday!: string;

  @ApiProperty({ enum: genderValues, example: 'female' })
  gender!: (typeof genderValues)[number];

  @ApiProperty({ example: 'Italy' })
  country!: string;
}

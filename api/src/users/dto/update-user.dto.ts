import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const genderValues = ['male', 'female', 'other'] as const;

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Noah Rossi' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: '2000-09-05', description: 'YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  birthday?: string;

  @ApiPropertyOptional({ enum: genderValues, example: 'female' })
  @IsOptional()
  @IsIn(genderValues)
  gender?: (typeof genderValues)[number];

  @ApiPropertyOptional({ example: 'Italy' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  country?: string;
}

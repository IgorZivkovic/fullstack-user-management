import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: 'VALIDATION_ERROR' })
  errorCode!: string;

  @ApiProperty({ example: '2026-01-07T09:15:22.123Z' })
  timestamp!: string;

  @ApiProperty({ example: '/api/v1/users' })
  path!: string;

  @ApiProperty({
    example: 'Validation failed',
    description: 'Message or array of messages for validation errors.',
  })
  message!: string | string[];

  @ApiProperty({
    required: false,
    type: [String],
    example: ['name should not be empty'],
  })
  details?: string[];
}

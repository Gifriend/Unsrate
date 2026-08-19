import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({
    description: 'The content of the message',
    example: 'Hello there!',
    maxLength: 2000,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  content: string;
}

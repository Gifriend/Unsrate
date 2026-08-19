import { ApiProperty } from '@nestjs/swagger';

export class InterestDto {
  @ApiProperty({
    example: 'clxmg8o14000008l3b2yag6g7',
    description: 'The unique identifier of the interest',
  })
  id: string;

  @ApiProperty({
    example: 'Coding',
    description: 'The name of the interest',
  })
  name: string;
}

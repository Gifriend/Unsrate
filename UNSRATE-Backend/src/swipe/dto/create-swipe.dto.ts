import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { SwipeAction } from '@prisma/client';

export class CreateSwipeDto {
  @IsString()
  @IsNotEmpty()
  swipedUserId: string;

  @IsEnum(SwipeAction)
  @IsNotEmpty()
  action: SwipeAction;
}

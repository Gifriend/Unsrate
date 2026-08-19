import { Gender, UserRole } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  fullname: string;

  @IsNotEmpty()
  @IsString()
  nim: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  gender: Gender;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  age: number;

  role?: UserRole;
}

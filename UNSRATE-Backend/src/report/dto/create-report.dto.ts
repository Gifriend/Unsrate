import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateReportDto {
  @ApiProperty({
    description: 'Alasan laporan',
    example: 'Pengguna ini menggunakan foto profil palsu dan bionya tidak sesuai.',
    maxLength: 500, // Example max length
  })
  @IsNotEmpty({ message: 'Alasan laporan tidak boleh kosong.' })
  @IsString({ message: 'Alasan laporan harus berupa teks.' })
  @MaxLength(500, { message: 'Alasan laporan tidak boleh lebih dari 500 karakter.' })
  reason: string;
}

import { Controller, Get, Param } from '@nestjs/common';
import { PddiktiService } from './pddikti.service';
import { MahasiswaData } from './api';

@Controller('pddikti')
export class PddiktiController {
  constructor(private readonly pddiktiService: PddiktiService) {}

  @Get('mahasiswa/:nim')
  async getMahasiswa(@Param('nim') nim: string): Promise<MahasiswaData | null> {
    return this.pddiktiService.getMahasiswaByNim(nim);
  }
}

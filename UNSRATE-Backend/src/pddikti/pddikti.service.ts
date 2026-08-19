import { Injectable } from '@nestjs/common';
import { PddiktiApi, MahasiswaData } from './api';

@Injectable()
export class PddiktiService {
  constructor(private readonly pddiktiApi: PddiktiApi) {}

  async getMahasiswaByNim(nim: string): Promise<MahasiswaData | null> {
    return this.pddiktiApi.searchMahasiswa(nim);
  }
}

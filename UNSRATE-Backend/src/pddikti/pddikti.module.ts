import { Module } from '@nestjs/common';
import { PddiktiApi } from './api';
import { PddiktiController } from './pddikti.controller';
import { PddiktiService } from './pddikti.service';

@Module({
  providers: [PddiktiApi, PddiktiService],
  controllers: [PddiktiController],
  exports: [PddiktiApi, PddiktiService],
})
export class PddiktiModule {}

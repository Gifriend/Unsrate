import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InterestDto } from './dto/interest.dto';

@Injectable()
export class InterestService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<InterestDto[]> {
    const interests = await this.prisma.interest.findMany({
      orderBy: {
        name: 'asc', // Optionally order by name
      },
    });
    return interests.map((interest) => ({
      id: interest.id,
      name: interest.name,
    }));
  }
}

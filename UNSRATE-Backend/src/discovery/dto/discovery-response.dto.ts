import { Gender } from '@prisma/client';

export class InterestDto {
  id: string;
  name: string;
}

export class DiscoveryProfileDto {
  id: string;
  fullname: string;
  age: number;
  gender: Gender;
  fakultas?: string;
  prodi?: string;
  bio?: string;
  profilePicture?: string;
  Photos?: string[];
  interests: InterestDto[];
  matchScore: number;
}

export class DiscoveryResponseDto {
  statusCode: number;
  message: string;
  profiles: DiscoveryProfileDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

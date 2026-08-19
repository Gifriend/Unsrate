import { Gender } from '@prisma/client';

// Basic user profile data needed for recommendations
export interface UserProfile {
  id: string;
  fullname: string;
  age: number;
  gender?: Gender;
  fakultas?: string;
  prodi?: string;
  bio?: string;
  profilePicture?: string;
  Photos?: string[];
  interests: {
    id: string;
    name: string;
  }[];
}

// Options for the discovery algorithm
export interface DiscoveryOptions {
  gender?: Gender;
  minAge?: number;
  maxAge?: number;
  fakultas?: string;
  prodi?: string;
  limit?: number;
  page?: number;
  sharedInterestsOnly?: boolean;
}

// Result of the recommendation algorithm with matching score
export interface ScoredProfile extends UserProfile {
  matchScore: number;
}

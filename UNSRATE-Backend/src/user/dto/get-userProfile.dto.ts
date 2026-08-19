export class InterestDto {
  id: string;
  name: string;
}

export class UserProfileDto {
  id: string;
  fullname: string;
  nim: string;
  email: string;
  profilePicture: string | null;
  Photos?: string[];
  bio: string | null;
  fakultas: string;
  prodi: string;
  age: number | null;
  gender: string | null;
  alamat: string | null;
  verified: boolean;
  interests?: InterestDto[];
  profileCompletion?: number;
  missingFields?: string[];
  interestedInGender?: string | null;
  minAgePreference?: number | null;
  maxAgePreference?: number | null;
}

export class GetUserProfileResponseDto {
  statusCode: number;
  message: string;
  data: UserProfileDto;
}

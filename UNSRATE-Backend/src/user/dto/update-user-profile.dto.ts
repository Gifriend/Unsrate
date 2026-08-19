import { Gender, UserInterest } from '@prisma/client';
import {
  FullnameProperty,
  ProfilePictureProperty,
  PhotosArrayProperty,
  BioProperty,
  DateOfBirthProperty,
  GenderProperty,
  AddressProperty,
  GenderPreferenceProperty,
  MinAgePreferenceProperty,
  MaxAgePreferenceProperty,
} from '../../decorators/user/user-property.decorators';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserProfileDto {
  @FullnameProperty()
  @IsString()
  @IsOptional()
  fullname?: string;

  @ProfilePictureProperty()
  @IsString()
  @IsOptional()
  profilePicture?: string;

  @PhotosArrayProperty()
  @IsOptional()
  Photos?: string[];

  @BioProperty()
  @IsString()
  @IsOptional()
  bio?: string;

  @DateOfBirthProperty()
  @IsOptional()
  dateOfBirth?: string;

  @GenderProperty()
  @IsOptional()
  gender?: Gender;

  @IsOptional()
  addInterests?: string[];

  @IsOptional()
  removeInterests?: string[];

  @IsOptional()
  setInterests?: string[];

  @IsString()
  @IsOptional()
  fakultas?: string;

  @IsString()
  @IsOptional()
  prodi?: string;

  @IsOptional()
  age?: number;

  @IsOptional()
  @AddressProperty()
  alamat?: string;

  @IsOptional()
  @GenderPreferenceProperty()
  interestedInGender?: Gender;

  @IsOptional()
  @MinAgePreferenceProperty()
  minAgePreference?: number;

  @IsOptional()
  @MaxAgePreferenceProperty()
  maxAgePreference?: number;
}

import { IsArray, IsOptional, IsString, IsUrl } from 'class-validator';
import {
  ProfilePictureProperty,
  RemovePhotosProperty,
} from '../../decorators/user/user-property.decorators';

export class ManageUserPhotosDto {
  @RemovePhotosProperty()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removePhotos?: string[];

  @ProfilePictureProperty()
  @IsOptional()
  @IsUrl()
  profilePicture?: string;
}

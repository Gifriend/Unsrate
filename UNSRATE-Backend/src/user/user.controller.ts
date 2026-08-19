import {
  Controller,
  Patch,
  Body,
  UseGuards,
  Get,
  Req,
  Delete,
  Post,
} from '@nestjs/common';
import { UsersService } from './user.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { ManageUserPhotosDto } from './dto/manage-user-photos.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../decorators/user.decorator';
import { ApiTags, ApiConsumes } from '@nestjs/swagger';
import {
  ApiUpdateUserProfile,
  ApiManageUserPhotos,
} from '../decorators/user/user-swagger.decorators';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getUserProfile(@User('id') userid: string) {
    return this.usersService.getUserProfile(userid);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiUpdateUserProfile()
  async updateProfile(
    @User('id') userId: string,
    @Body() updateProfileDto: UpdateUserProfileDto,
  ) {
    return this.usersService.updateUserProfile(userId, updateProfileDto);
  }

  @Patch('photos')
  @UseGuards(JwtAuthGuard)
  @ApiManageUserPhotos()
  @ApiConsumes('multipart/form-data')
  async managePhotos(
    @User('id') userId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const collectedFiles: any[] = [];
    const photosDto = new ManageUserPhotosDto();

    // Ambil file dari body.files jika attachFieldsToBody: true
    if (body && body.files) {
      if (Array.isArray(body.files)) {
        collectedFiles.push(...body.files);
      } else {
        collectedFiles.push(body.files);
      }
    } else if (req.files && typeof req.files === 'function') {
      for await (const part of req.files()) {
        if (part && part.file) collectedFiles.push(part);
        else if (part && part.fieldname === 'removePhotos') {
          if (!photosDto.removePhotos) photosDto.removePhotos = [];
          photosDto.removePhotos.push(part.value);
        } else if (part && part.fieldname === 'profilePicture') {
          photosDto.profilePicture = part.value;
        }
      }
    }

    // Jika pakai attachFieldsToBody, ambil field removePhotos & profilePicture dari body
    if (body && body.removePhotos) {
      if (!photosDto.removePhotos) photosDto.removePhotos = [];
      if (Array.isArray(body.removePhotos)) {
        photosDto.removePhotos.push(...body.removePhotos);
      } else {
        photosDto.removePhotos.push(body.removePhotos);
      }
    }
    if (body && body.profilePicture) {
      photosDto.profilePicture = body.profilePicture;
    }

    return this.usersService.manageUserPhotos(
      userId,
      photosDto,
      collectedFiles,
    );
  }

  @Delete('photos')
  @UseGuards(JwtAuthGuard)
  async deletePhoto(
    @Body('photoUrl') photoUrl: string,
    @User('id') userId: string,
  ) {
    return this.usersService.deleteUserPhoto(userId, photoUrl);
  }

  @Post('profile-picture')
  @UseGuards(JwtAuthGuard)
  async setProfilePicture(
    @User('id') userId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    // body: { photoUrl?: string, remove?: boolean }
    // Jika photoUrl ada, set dari Photos, jika ada file upload, upload baru, jika remove true, hapus profilePicture
    return this.usersService.setUserProfilePicture(userId, body, req);
  }
}

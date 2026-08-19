import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { ManageUserPhotosDto } from './dto/manage-user-photos.dto';
import {
  GetUserProfileResponseDto,
  UserProfileDto,
} from './dto/get-userProfile.dto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

// Helper function to generate a unique file name
function generateUniqueFileName(originalFilename?: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);

  // Handle cases where originalFilename might be undefined, null, or empty
  const nameToProcess =
    originalFilename && originalFilename.trim() !== ''
      ? originalFilename
      : `unknownfile-${timestamp}`;

  const parts = nameToProcess.split('.');
  let extension = 'jpg'; // Default extension

  if (parts.length > 1) {
    const lastPart = parts.pop();
    // Ensure extension is a valid string and not excessively long (simple check)
    if (lastPart && lastPart.trim() !== '' && lastPart.length < 10) {
      extension = lastPart;
    }
  }

  return `${timestamp}-${randomString}.${extension}`;
}

@Injectable()
export class UsersService {
  private supabase: SupabaseClient;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Initialize Supabase client
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Supabase URL and Key must be provided in environment variables',
      );
    }
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // Method to save file to Supabase Storage and get URL
  private async saveFileToSupabaseAndGetUrl(file: any): Promise<string> {
    if (!file.filename) {
      throw new BadRequestException('Invalid file data: missing filename.');
    }
    if (!file.mimetype) {
      throw new BadRequestException('Invalid file data: missing mimetype.');
    }
    if (typeof file.toBuffer !== 'function') {
      throw new BadRequestException(
        'Invalid file data: missing toBuffer method.',
      );
    }

    const uniqueFileName = generateUniqueFileName(file.filename);
    const filePath = `${uniqueFileName}`;

    let uploadSource: Buffer;
    try {
      uploadSource = await file.toBuffer();
    } catch {
      throw new BadRequestException(
        `Failed to process file buffer for ${file.filename}.`,
      );
    }

    if (!uploadSource || uploadSource.length === 0) {
      throw new BadRequestException(
        `File buffer for ${file.filename} is empty or could not be retrieved.`,
      );
    }

    const { data, error: uploadError } = await this.supabase.storage
      .from('user-photos')
      .upload(filePath, uploadSource, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw new BadRequestException(
        `Failed to upload photo ${file.filename}. Supabase error: ${uploadError.message}`,
      );
    }

    const publicUrlData = this.supabase.storage
      .from('user-photos')
      .getPublicUrl(filePath);

    if (
      !publicUrlData ||
      !publicUrlData.data ||
      !publicUrlData.data.publicUrl
    ) {
      throw new BadRequestException(
        `Failed to get a valid photo URL for ${file.filename} after upload.`,
      );
    }

    return publicUrlData.data.publicUrl;
  }

  async getUserProfile(userId: string): Promise<GetUserProfileResponseDto> {
    // Validasi User ID
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          fullname: true,
          nim: true,
          email: true,
          profilePicture: true,
          Photos: true,
          bio: true,
          fakultas: true,
          prodi: true,
          age: true,
          gender: true,
          alamat: true,
          verified: true,
          // relasi interests untuk minat pengguna
          interests: {
            select: {
              interest: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Hitung persentase kelengkapan profil
      const profileFields = [
        user.fullname,
        user.profilePicture,
        user.bio,
        user.gender,
        user.fakultas,
        user.prodi,
        user.alamat,
      ];

      const filledFields = profileFields.filter(
        (field) => field !== null && field !== undefined,
      ).length;
      const completionPercentage = Math.round(
        (filledFields / profileFields.length) * 100,
      );

      // Transform minat pengguna ke format yang lebih baik
      const interests =
        user.interests?.map((item) => ({
          id: item.interest.id,
          name: item.interest.name,
        })) || [];

      // Transform data untuk format response yang konsisten
      const profileData = {
        ...user,
        interests: undefined, // Remove original format
      };

      // Tambahkan informasi yang lebih relevan untuk self-viewing
      const missingFields = profileFields
        .map((field, index) => ({
          field: field,
          name: [
            'fullname',
            'profilePicture',
            'bio',
            'gender',
            'fakultas',
            'prodi',
            'alamat',
            'interestedInGender',
            'minAgePreference',
            'maxAgePreference',
          ][index],
        }))
        .filter((item) => item.field === null || item.field === undefined)
        .map((item) => item.name);

      return {
        statusCode: 200,
        message: 'User profile retrieved successfully',
        data: {
          ...profileData,
          profileCompletion: completionPercentage,
          missingFields: missingFields.length > 0 ? missingFields : undefined,
          interests,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('User not found or error occurred');
    }
  }

  async updateUserProfile(
    userId: string,
    updateProfileDto: UpdateUserProfileDto,
  ) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { addInterests, removeInterests, setInterests, ...otherProfileData } =
      updateProfileDto;

    // 1. Handle setInterests (exclusive)
    // This operation will replace all existing interests with the new set.
    if (setInterests && Array.isArray(setInterests)) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          interests: {
            deleteMany: {}, // Delete all existing UserInterest for this user
            create: setInterests.map((interestId: string) => ({
              interestId: interestId.trim(), // Link to an existing Interest via its ID
            })),
          },
        },
      });
    } else {
      // 2. Handle removeInterests if setInterests is not provided
      if (
        removeInterests &&
        Array.isArray(removeInterests) &&
        removeInterests.length > 0
      ) {
        await this.prisma.userInterest.deleteMany({
          where: {
            userId: userId,
            interestId: {
              in: removeInterests.map((id) => id.trim()),
            },
          },
        });
      }

      // 3. Handle addInterests if setInterests is not provided
      if (
        addInterests &&
        Array.isArray(addInterests) &&
        addInterests.length > 0
      ) {
        // Using nested create which handles connecting to existing Interest
        // and creating the UserInterest join table record.
        // Prisma's nested create on a many-to-many relation implicitly handles
        // not creating duplicates if the link already exists.
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            interests: {
              create: addInterests.map((interestId: string) => ({
                interestId: interestId.trim(),
              })),
            },
          },
        });
      }
    }

    // 4. Update other profile fields
    const dataToUpdate: any = {};
    let hasOtherFieldsToUpdate = false;

    // Populate dataToUpdate only with fields present in otherProfileData
    for (const key in otherProfileData) {
      if (Object.prototype.hasOwnProperty.call(otherProfileData, key)) {
        // @ts-ignore
        if (otherProfileData[key] !== undefined) {
          // @ts-ignore
          dataToUpdate[key] = otherProfileData[key];
          hasOtherFieldsToUpdate = true;
        }
      }
    }
    
    if (updateProfileDto.hasOwnProperty('dateOfBirth')) {
        dataToUpdate.dateOfBirth = updateProfileDto.dateOfBirth ? new Date(updateProfileDto.dateOfBirth) : null;
        hasOtherFieldsToUpdate = true;
    }


    if (hasOtherFieldsToUpdate) {
      await this.prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
      });
    }

    // 5. Return the updated user profile with all changes reflected
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullname: true,
        profilePicture: true,
        Photos: true,
        bio: true,
        dateOfBirth: true,
        gender: true,
        fakultas: true,
        prodi: true,
        age: true,
        alamat: true,
        verified: true,
        interests: {
          select: {
            interest: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        interestedInGender: true,
        minAgePreference: true,
        maxAgePreference: true,
        email: false, // Exclude sensitive information
        password: false,
      },
    });
  }

  async manageUserPhotos(
    userId: string,
    photosDto: ManageUserPhotosDto,
    filesFromController?: any[],
  ) {
    const filesToProcess: any[] = Array.isArray(filesFromController)
      ? filesFromController
      : filesFromController
        ? [filesFromController]
        : [];

    // Normalisasi removePhotos agar selalu array of string
    if (photosDto.removePhotos) {
      if (!Array.isArray(photosDto.removePhotos)) {
        const remove = photosDto.removePhotos as any;
        if (
          typeof remove === 'object' &&
          remove !== null &&
          'value' in remove
        ) {
          photosDto.removePhotos = Array.isArray(remove.value)
            ? remove.value
            : [remove.value];
        } else if (typeof remove === 'string') {
          photosDto.removePhotos = [remove];
        } else {
          photosDto.removePhotos = [];
        }
      }
    } else {
      photosDto.removePhotos = [];
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, Photos: true, profilePicture: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const currentPhotos = user.Photos || [];
    let updatedPhotos = [...currentPhotos];

    if (filesToProcess.length > 0) {
      const newPhotoUrls: string[] = [];
      for (const filePart of filesToProcess) {
        const url = await this.saveFileToSupabaseAndGetUrl(filePart);
        newPhotoUrls.push(url);
      }
      const uniqueNewPhotos = newPhotoUrls.filter(
        (url) => !updatedPhotos.includes(url),
      );
      updatedPhotos = [...updatedPhotos, ...uniqueNewPhotos];
    }

    // Remove photos (hanya hapus dari array, tidak hapus file di storage)
    if (photosDto.removePhotos && photosDto.removePhotos.length > 0) {
      const removeList = (photosDto.removePhotos as any[])
        .filter((p) => typeof p === 'string')
        .map((p) => decodeURI(p.trim()));
      updatedPhotos = updatedPhotos.filter((photo) => {
        if (typeof photo !== 'string') return true;
        const normalizedPhoto = decodeURI(photo.trim());
        return !removeList.includes(normalizedPhoto);
      });
      if (
        removeList.includes(
          user.profilePicture ? decodeURI(user.profilePicture.trim()) : '',
        )
      ) {
        if (!photosDto.profilePicture) {
          photosDto.profilePicture =
            updatedPhotos.length > 0 ? updatedPhotos[0] : null;
        }
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        Photos: updatedPhotos,
        profilePicture: photosDto.profilePicture,
      },
      select: {
        id: true,
        fullname: true,
        profilePicture: true,
        Photos: true,
      },
    });
  }

  async deleteUserPhoto(userId: string, photoUrl: string) {
    if (!photoUrl || typeof photoUrl !== 'string') {
      throw new BadRequestException(
        'photoUrl is required and must be a string',
      );
    }
    // Cari user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { Photos: true, profilePicture: true },
    });
    if (!user) throw new NotFoundException('User not found');
    // Normalisasi URL
    const normalizedUrl = decodeURI(photoUrl.trim());
    // Hapus file dari Supabase
    const match = normalizedUrl.match(/user-photos\/(.*)$/);
    if (match && match[1]) {
      const filePath = match[1];
      await this.supabase.storage.from('user-photos').remove([filePath]);
    }
    // Hapus dari array Photos
    const updatedPhotos = (user.Photos || []).filter((p) => {
      if (typeof p !== 'string') return true;
      return decodeURI(p.trim()) !== normalizedUrl;
    });
    // Update profilePicture jika perlu
    let newProfilePicture = user.profilePicture;
    if (
      user.profilePicture &&
      decodeURI(user.profilePicture.trim()) === normalizedUrl
    ) {
      newProfilePicture = updatedPhotos.length > 0 ? updatedPhotos[0] : null;
    }
    // Simpan perubahan
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        Photos: updatedPhotos,
        profilePicture: newProfilePicture,
      },
      select: {
        id: true,
        fullname: true,
        profilePicture: true,
        Photos: true,
      },
    });
  }

  async setUserProfilePicture(userId: string, body: any, req: any) {
    // Jika remove true, hapus profilePicture
    if (body.remove) {
      return this.prisma.user.update({
        where: { id: userId },
        data: { profilePicture: null },
        select: {
          id: true,
          fullname: true,
          profilePicture: true,
          Photos: true,
        },
      });
    }

    // Jika photoUrl ada, set profilePicture dari Photos
    if (body.photoUrl && typeof body.photoUrl === 'string') {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { Photos: true },
      });
      if (!user) throw new NotFoundException('User not found');
      const normalizedUrl = decodeURI(body.photoUrl.trim());
      const exists = (user.Photos || []).some(
        (p) => typeof p === 'string' && decodeURI(p.trim()) === normalizedUrl,
      );
      if (!exists)
        throw new BadRequestException('photoUrl is not in Photos array');
      return this.prisma.user.update({
        where: { id: userId },
        data: { profilePicture: normalizedUrl },
        select: {
          id: true,
          fullname: true,
          profilePicture: true,
          Photos: true,
        },
      });
    }

    // Jika ada file upload, upload ke Supabase dan set profilePicture
    let filePart = null;
    // Cek form-data (Fastify multipart) di req.body.files atau req.files()
    if (body && body.files) {
      filePart = Array.isArray(body.files) ? body.files[0] : body.files;
    } else if (req && req.files && typeof req.files === 'function') {
      for await (const part of req.files()) {
        if (part && part.file) {
          filePart = part;
          break;
        }
      }
    }
    if (filePart) {
      const url = await this.saveFileToSupabaseAndGetUrl(filePart);
      // Tambahkan ke Photos jika belum ada
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { Photos: true },
      });
      let updatedPhotos = user?.Photos || [];
      if (!updatedPhotos.includes(url)) updatedPhotos = [...updatedPhotos, url];
      return this.prisma.user.update({
        where: { id: userId },
        data: { profilePicture: url, Photos: updatedPhotos },
        select: {
          id: true,
          fullname: true,
          profilePicture: true,
          Photos: true,
        },
      });
    }

    throw new BadRequestException(
      'No valid photoUrl, file upload, or remove flag provided',
    );
  }
}

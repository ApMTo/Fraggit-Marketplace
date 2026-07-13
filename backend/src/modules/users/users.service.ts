import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { FilesService } from '../files/files.service';
import { UserAuthCacheService } from '../auth/user-auth-cache.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  USER_PROFILE_SELECT,
  USER_PUBLIC_PROFILE_SELECT,
  UserProfile,
  UserPublicProfile,
} from './constants/user-profile.select';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
    private readonly userAuthCache: UserAuthCacheService,
  ) {}

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_PROFILE_SELECT,
    });

    if (!user) {
      throw new NotFoundException('user_not_found');
    }

    return user;
  }

  async getPublicByUsername(username: string): Promise<UserPublicProfile> {
    const normalized = username.trim().toLowerCase();

    const user = await this.prisma.user.findFirst({
      where: {
        username: normalized,
        status: UserStatus.ACTIVE,
      },
      select: USER_PUBLIC_PROFILE_SELECT,
    });

    if (!user) {
      throw new NotFoundException('user_not_found');
    }

    return user;
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    avatar?: Express.Multer.File,
  ): Promise<UserProfile> {
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, displayName: true },
    });

    if (!current) {
      throw new NotFoundException('user_not_found');
    }

    if (dto.username !== current.username) {
      await this.assertUsernameAvailable(dto.username, userId);
    }

    let avatarUrl: string | undefined;
    if (avatar) {
      const uploaded = await this.filesService.uploadFile(avatar, 'avatars');
      avatarUrl = uploaded.url;
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        username: dto.username,
        displayName: dto.displayName,
        bio: dto.bio ?? null,
        ...(avatarUrl && { avatarUrl }),
      },
      select: USER_PROFILE_SELECT,
    });

    const authFieldsChanged =
      dto.username !== current.username ||
      dto.displayName !== current.displayName;

    if (authFieldsChanged) {
      await this.userAuthCache.invalidate(userId);
    }

    return user;
  }

  private async assertUsernameAvailable(
    username: string,
    excludeUserId: string,
  ): Promise<void> {
    const taken = await this.prisma.user.findFirst({
      where: { username, NOT: { id: excludeUserId } },
      select: { id: true },
    });

    if (taken) {
      throw new ConflictException('username_already_exists');
    }
  }
}

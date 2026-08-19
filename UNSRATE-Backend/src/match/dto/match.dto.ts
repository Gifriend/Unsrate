import { Gender } from '@prisma/client';

// Basic user information to return in match responses
export class MatchedUserDto {
  id: string;
  fullname: string;
  age: number;
  gender?: Gender;
  fakultas?: string;
  prodi?: string;
  profilePicture?: string;
  bio?: string;
}

// Last message information for match preview
export class LastMessageDto {
  id: string;
  content: string;
  senderId: string;
  createdAt: Date;
  isRead: boolean;
}

// Single match details
export class MatchDto {
  id: string;
  matchedUser: MatchedUserDto;
  createdAt: Date;
  lastMessage?: LastMessageDto;
  unreadCount: number;
}

// Response for a single match query
export class MatchResponseDto {
  statusCode: number;
  message: string;
  match: MatchDto;
}

import { Permission, type CreateUserRequest } from '@bookorbit/types';
import { IsArray, IsEmail, IsEnum, IsInt, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto implements CreateUserRequest {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  username: string;

  @IsString()
  @MinLength(8)
  @MaxLength(1024)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one digit',
  })
  password: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsArray()
  @IsEnum(Permission, { each: true })
  @IsOptional()
  permissionNames?: Permission[];

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  libraryIds?: number[];
}

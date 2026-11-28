import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class CreatePdfBookmarkDto {
  @IsInt()
  @Min(1)
  pageNumber!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title!: string;
}

import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/request-user';
import { BookmarkService } from './bookmark.service';
import { CreatePdfBookmarkDto } from './dto/create-pdf-bookmark.dto';

@Controller('books/files/:fileId/bookmarks')
export class PdfBookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Get()
  getBookmarks(@Param('fileId', ParseIntPipe) fileId: number, @CurrentUser() user: RequestUser) {
    return this.bookmarkService.getPdfBookmarks(fileId, user);
  }

  @Post()
  createBookmark(@Param('fileId', ParseIntPipe) fileId: number, @Body() dto: CreatePdfBookmarkDto, @CurrentUser() user: RequestUser) {
    return this.bookmarkService.createPdfBookmark(fileId, user, dto);
  }

  @Delete(':bookmarkId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBookmark(
    @Param('fileId', ParseIntPipe) fileId: number,
    @Param('bookmarkId', ParseIntPipe) bookmarkId: number,
    @CurrentUser() user: RequestUser,
  ) {
    await this.bookmarkService.deletePdfBookmark(fileId, bookmarkId, user);
  }
}

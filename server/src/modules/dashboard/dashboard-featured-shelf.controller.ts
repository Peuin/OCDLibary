import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Req,
  Res,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { createReadStream } from 'fs';

import { DASHBOARD_FEATURED_SHELF_IMAGE_MAX_BYTES, Permission } from '@bookorbit/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import type { MultipartRequest } from '../../common/types/multipart-request';
import type { RequestUser } from '../../common/types/request-user';
import { DashboardFeaturedShelfService } from './dashboard-featured-shelf.service';
import {
  CreateDashboardFeaturedShelfDto,
  DashboardDefaultLayoutDto,
  ReorderDashboardFeaturedShelvesDto,
  UpdateDashboardFeaturedShelfDto,
} from './dto/dashboard-featured-shelf.dto';

@Controller('dashboard')
export class DashboardFeaturedShelfController {
  constructor(private readonly featuredShelfService: DashboardFeaturedShelfService) {}

  @Get('shared-config')
  getSharedConfig(@CurrentUser() user: RequestUser) {
    return this.featuredShelfService.getSharedConfig(user);
  }

  @Get('featured-shelves')
  @RequirePermission(Permission.ManageAppSettings)
  listFeaturedShelves() {
    return this.featuredShelfService.listAll();
  }

  @Post('featured-shelves')
  @RequirePermission(Permission.ManageAppSettings)
  createFeaturedShelf(@CurrentUser() user: RequestUser, @Body() dto: CreateDashboardFeaturedShelfDto) {
    return this.featuredShelfService.create(dto, user);
  }

  @Put('featured-shelves/order')
  @RequirePermission(Permission.ManageAppSettings)
  reorderFeaturedShelves(@Body() dto: ReorderDashboardFeaturedShelvesDto) {
    return this.featuredShelfService.reorder(dto);
  }

  @Patch('featured-shelves/:id')
  @RequirePermission(Permission.ManageAppSettings)
  updateFeaturedShelf(@CurrentUser() user: RequestUser, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDashboardFeaturedShelfDto) {
    return this.featuredShelfService.update(id, dto, user);
  }

  @Delete('featured-shelves/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(Permission.ManageAppSettings)
  async deleteFeaturedShelf(@CurrentUser() user: RequestUser, @Param('id', ParseIntPipe) id: number) {
    await this.featuredShelfService.remove(id, user);
  }

  @Post('featured-shelves/:id/image')
  @RequirePermission(Permission.ManageAppSettings)
  async uploadFeaturedShelfImage(@CurrentUser() user: RequestUser, @Param('id', ParseIntPipe) id: number, @Req() req: MultipartRequest) {
    let data;
    let buffer: Buffer;
    try {
      data = await req.file({ limits: { fileSize: DASHBOARD_FEATURED_SHELF_IMAGE_MAX_BYTES } });
      if (!data) throw new BadRequestException('No file provided');
      buffer = await data.toBuffer();
    } catch (error) {
      if (isFileTooLargeError(error)) throw new BadRequestException('Image exceeds 5 MB limit');
      throw error;
    }
    return this.featuredShelfService.uploadImage(id, buffer, data.mimetype, user);
  }

  @Delete('featured-shelves/:id/image')
  @RequirePermission(Permission.ManageAppSettings)
  deleteFeaturedShelfImage(@CurrentUser() user: RequestUser, @Param('id', ParseIntPipe) id: number) {
    return this.featuredShelfService.removeImage(id, user);
  }

  @Get('featured-shelves/:id/image')
  async getFeaturedShelfImage(@Param('id', ParseIntPipe) id: number, @Res() reply: FastifyReply) {
    const path = await this.featuredShelfService.getImagePath(id);
    if (!path) {
      reply.status(404).send({ message: `No image for featured shelf ${id}` });
      return;
    }
    // The URL carries the image version, so a replaced image is a new URL.
    reply.header('Cache-Control', 'private, max-age=31536000, immutable');
    reply.type('image/jpeg');
    reply.send(createReadStream(path));
  }

  @Put('default-layout')
  @RequirePermission(Permission.ManageAppSettings)
  setDefaultLayout(@CurrentUser() user: RequestUser, @Body() dto: DashboardDefaultLayoutDto) {
    return this.featuredShelfService.setDefaultLayout(dto, user);
  }

  @Delete('default-layout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(Permission.ManageAppSettings)
  async clearDefaultLayout(@CurrentUser() user: RequestUser) {
    await this.featuredShelfService.clearDefaultLayout(user);
  }
}

function isFileTooLargeError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const value = error as { code?: unknown; statusCode?: unknown; message?: unknown };
  if (value.code === 'FST_REQ_FILE_TOO_LARGE') return true;
  return value.statusCode === 413 && typeof value.message === 'string' && value.message.toLowerCase().includes('file too large');
}

import { BadRequestException } from '@nestjs/common';

import { DASHBOARD_FEATURED_SHELF_MAX, EMPTY_CONTENT_FILTER_RULES } from '@bookorbit/types';
import type { RequestUser } from '../../common/types/request-user';
import type { DashboardFeaturedShelfRow } from '../../db/schema';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { DashboardFeaturedShelfImageStorage } from './dashboard-featured-shelf-image.storage';
import { DashboardFeaturedShelfRepository } from './dashboard-featured-shelf.repository';
import { DashboardFeaturedShelfService } from './dashboard-featured-shelf.service';

function makeUser(overrides: Partial<RequestUser> = {}): RequestUser {
  return {
    id: 42,
    username: 'reader',
    name: 'Reader',
    email: null,
    active: true,
    isSuperuser: false,
    isDefaultPassword: false,
    tokenVersion: 1,
    settings: {},
    avatarUrl: null,
    provisioningMethod: 'local',
    permissions: [],
    contentFilters: EMPTY_CONTENT_FILTER_RULES,
    ...overrides,
  };
}

function shelfRow(overrides: Partial<DashboardFeaturedShelfRow> = {}): DashboardFeaturedShelfRow {
  return {
    id: 1,
    title: 'Linh đạo Cát Minh',
    saintName: null,
    imageVersion: 0,
    displayOrder: 1,
    rows: 1,
    createdByUserId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeService() {
  const repo = {
    findAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
    insert: vi.fn(),
    update: vi.fn(),
    bumpImageVersion: vi.fn(),
    delete: vi.fn(),
    updateDisplayOrders: vi.fn(),
  };
  const imageStorage = { save: vi.fn(), delete: vi.fn(), getPathIfExists: vi.fn() };
  const appSettings = { getValue: vi.fn().mockResolvedValue(null), setValue: vi.fn() };
  const service = new DashboardFeaturedShelfService(
    repo as unknown as DashboardFeaturedShelfRepository,
    imageStorage as unknown as DashboardFeaturedShelfImageStorage,
    appSettings as unknown as AppSettingsService,
  );
  return { service, repo, imageStorage, appSettings };
}

describe('DashboardFeaturedShelfService', () => {
  it('creates a shelf with a trimmed free-form title at the end of the order', async () => {
    const { service, repo } = makeService();
    repo.count.mockResolvedValue(2);
    repo.insert.mockImplementation((values: Partial<DashboardFeaturedShelfRow>) => Promise.resolve(shelfRow({ id: 5, ...values })));

    const created = await service.create({ title: '  Sách Thánh Gioan  ', saintName: '  Thánh Gioan Thánh Giá ' }, makeUser({ id: 1 }));

    expect(repo.insert).toHaveBeenCalledWith({
      title: 'Sách Thánh Gioan',
      saintName: 'Thánh Gioan Thánh Giá',
      rows: 1,
      displayOrder: 3,
      createdByUserId: 1,
    });
    expect(created).toEqual({ id: 5, title: 'Sách Thánh Gioan', saintName: 'Thánh Gioan Thánh Giá', imageUrl: null, rows: 1, displayOrder: 3 });
  });

  it('refuses a blank title', async () => {
    const { service, repo } = makeService();

    await expect(service.create({ title: '   ' }, makeUser())).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.insert).not.toHaveBeenCalled();
  });

  it('refuses a shelf beyond the dashboard limit', async () => {
    const { service, repo } = makeService();
    repo.count.mockResolvedValue(DASHBOARD_FEATURED_SHELF_MAX);

    await expect(service.create({ title: 'One more' }, makeUser())).rejects.toBeInstanceOf(BadRequestException);
  });

  it('shares every shelf with a versioned portrait url', async () => {
    const { service, repo } = makeService();
    repo.findAll.mockResolvedValue([shelfRow({ id: 2, imageVersion: 3, saintName: 'Edith Stein', rows: 2 })]);

    const config = await service.getSharedConfig();

    expect(config.featuredShelves).toEqual([
      {
        id: 2,
        title: 'Linh đạo Cát Minh',
        saintName: 'Edith Stein',
        imageUrl: '/api/v1/dashboard/featured-shelves/2/image?v=3',
        rows: 2,
        displayOrder: 1,
      },
    ]);
  });

  it('clears the saint name when given an empty string and keeps the rest', async () => {
    const { service, repo } = makeService();
    repo.findById.mockResolvedValue(shelfRow({ id: 3, saintName: 'Old', rows: 2 }));
    repo.update.mockImplementation((_id: number, values: Partial<DashboardFeaturedShelfRow>) => Promise.resolve(shelfRow({ id: 3, ...values })));

    await service.update(3, { saintName: '   ' }, makeUser());

    expect(repo.update).toHaveBeenCalledWith(3, { title: 'Linh đạo Cát Minh', saintName: null, rows: 2 });
  });

  it('requires a reorder to list every shelf exactly once', async () => {
    const { service, repo } = makeService();
    repo.findAll.mockResolvedValue([shelfRow({ id: 1 }), shelfRow({ id: 2 })]);

    await expect(service.reorder({ ids: [2] })).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.updateDisplayOrders).not.toHaveBeenCalled();
  });

  it('treats a cleared default layout as no default', async () => {
    const { service, appSettings } = makeService();
    appSettings.getValue.mockResolvedValue('');

    await expect(service.getDefaultLayout()).resolves.toBeNull();
  });
});

import { BadRequestException } from '@nestjs/common';

import { EMPTY_CONTENT_FILTER_RULES } from '@bookorbit/types';
import type { RequestUser } from '../../common/types/request-user';
import type { DashboardFeaturedShelfRow } from '../../db/schema';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { CollectionService } from '../collection/collection.service';
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
    collectionId: 10,
    title: 'Carmelite spirituality',
    saintName: null,
    attachTo: null,
    imageVersion: 0,
    displayOrder: 1,
    createdByUserId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function collection(id: number, overrides: Partial<{ userId: number; name: string; mediaType: 'books' | 'podcasts'; isPublic: boolean }> = {}) {
  return { id, userId: 1, name: `Collection ${id}`, mediaType: 'books' as const, isPublic: true, ...overrides };
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
  const collectionService = { findSummariesByIds: vi.fn().mockResolvedValue([]) };
  const appSettings = { getValue: vi.fn().mockResolvedValue(null), setValue: vi.fn() };
  const service = new DashboardFeaturedShelfService(
    repo as unknown as DashboardFeaturedShelfRepository,
    imageStorage as unknown as DashboardFeaturedShelfImageStorage,
    collectionService as unknown as CollectionService,
    appSettings as unknown as AppSettingsService,
  );
  return { service, repo, imageStorage, collectionService, appSettings };
}

describe('DashboardFeaturedShelfService', () => {
  it('refuses to feature a private collection, since every user would see the shelf', async () => {
    const { service, collectionService, repo } = makeService();
    collectionService.findSummariesByIds.mockResolvedValue([collection(10, { isPublic: false })]);

    await expect(service.create({ collectionId: 10 }, makeUser())).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.insert).not.toHaveBeenCalled();
  });

  it('titles a new shelf after its collection when no title is given', async () => {
    const { service, collectionService, repo } = makeService();
    collectionService.findSummariesByIds.mockResolvedValue([collection(10, { name: 'Lectio Divina' })]);
    repo.insert.mockImplementation((values: Partial<DashboardFeaturedShelfRow>) => Promise.resolve(shelfRow({ ...values, id: 5 })));

    const created = await service.create({ collectionId: 10, title: '   ' }, makeUser({ id: 1 }));

    expect(created).toMatchObject({ id: 5, title: 'Lectio Divina', collectionId: 10, imageUrl: null });
  });

  it('hides shelves whose collection went private from everyone but its owner', async () => {
    const { service, repo, collectionService } = makeService();
    repo.findAll.mockResolvedValue([shelfRow({ id: 1, collectionId: 10 }), shelfRow({ id: 2, collectionId: 11, imageVersion: 3 })]);
    collectionService.findSummariesByIds.mockResolvedValue([collection(10, { isPublic: false, userId: 7 }), collection(11)]);

    const forReader = await service.getSharedConfig(makeUser({ id: 42 }));
    const forOwner = await service.getSharedConfig(makeUser({ id: 7 }));

    expect(forReader.featuredShelves.map((shelf) => shelf.id)).toEqual([2]);
    expect(forReader.featuredShelves[0]?.imageUrl).toBe('/api/v1/dashboard/featured-shelves/2/image?v=3');
    expect(forOwner.featuredShelves.map((shelf) => shelf.id)).toEqual([1, 2]);
  });

  it('keeps a trimmed saint name and clears it when sent empty', async () => {
    const { service, collectionService, repo } = makeService();
    collectionService.findSummariesByIds.mockResolvedValue([collection(10)]);
    repo.insert.mockImplementation((values: Partial<DashboardFeaturedShelfRow>) => Promise.resolve(shelfRow({ ...values, id: 5 })));
    repo.findById.mockResolvedValue(shelfRow({ id: 5, saintName: 'Thánh Gioan Thánh Giá' }));
    repo.update.mockImplementation((_id: number, values: Partial<DashboardFeaturedShelfRow>) => Promise.resolve(shelfRow({ id: 5, ...values })));

    const created = await service.create({ collectionId: 10, saintName: '  Thánh Têrêsa Avila  ' }, makeUser());
    const cleared = await service.update(5, { saintName: '' }, makeUser());

    expect(created.saintName).toBe('Thánh Têrêsa Avila');
    expect(cleared.saintName).toBeNull();
  });

  it('lets only one entry decorate each built-in shelf', async () => {
    const { service, collectionService, repo } = makeService();
    collectionService.findSummariesByIds.mockResolvedValue([collection(10)]);
    repo.findAll.mockResolvedValue([shelfRow({ id: 1, attachTo: 'recently-added' })]);

    await expect(service.create({ collectionId: 10, attachTo: 'recently-added' }, makeUser())).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.insert).not.toHaveBeenCalled();
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

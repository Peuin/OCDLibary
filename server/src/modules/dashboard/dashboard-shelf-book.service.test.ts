import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { DASHBOARD_SHELF_BOOKS_MAX, EMPTY_CONTENT_FILTER_RULES } from '@bookorbit/types';
import type { RequestUser } from '../../common/types/request-user';
import { CollectionService } from '../collection/collection.service';
import { DashboardFeaturedShelfRepository } from './dashboard-featured-shelf.repository';
import { DashboardShelfBookRepository } from './dashboard-shelf-book.repository';
import { DashboardShelfBookService } from './dashboard-shelf-book.service';

function makeUser(): RequestUser {
  return {
    id: 1,
    username: 'admin',
    name: 'Admin',
    email: null,
    active: true,
    isSuperuser: true,
    isDefaultPassword: false,
    tokenVersion: 1,
    settings: {},
    avatarUrl: null,
    provisioningMethod: 'local',
    permissions: [],
    contentFilters: EMPTY_CONTENT_FILTER_RULES,
  };
}

function makeService() {
  const repo = {
    findVisibleBookIds: vi.fn().mockResolvedValue([]),
    countBooks: vi.fn().mockResolvedValue(0),
    findExistingBookIds: vi.fn().mockResolvedValue([]),
    appendBooks: vi.fn().mockResolvedValue(0),
    removeBook: vi.fn().mockResolvedValue(true),
    findHiddenBookIds: vi.fn().mockResolvedValue([]),
    unhideBooks: vi.fn().mockResolvedValue(0),
    hideBook: vi.fn().mockResolvedValue(undefined),
    removeHiddenBooks: vi.fn().mockResolvedValue(undefined),
  };
  const shelfRepo = { findById: vi.fn().mockResolvedValue({ id: 7, collectionId: null }) };
  const collectionService = {
    findBookIdsInOrder: vi.fn().mockResolvedValue([]),
    containsBook: vi.fn().mockResolvedValue(false),
    assertShelfLinkable: vi.fn().mockResolvedValue(undefined),
  };
  const service = new DashboardShelfBookService(
    repo as unknown as DashboardShelfBookRepository,
    shelfRepo as unknown as DashboardFeaturedShelfRepository,
    collectionService as unknown as CollectionService,
  );
  return { service, repo, shelfRepo, collectionService };
}

describe('DashboardShelfBookService', () => {
  it('serves the visible books in shelf order', async () => {
    const { service, repo } = makeService();
    repo.findVisibleBookIds.mockResolvedValue([9, 4]);

    await expect(service.findVisibleBookIds(7, makeUser(), [1, 2], 20)).resolves.toEqual([9, 4]);
    expect(repo.findVisibleBookIds).toHaveBeenCalledWith(7, [1, 2], 20, undefined);
  });

  it('adds only books that exist, once each', async () => {
    const { service, repo } = makeService();
    repo.findExistingBookIds.mockResolvedValue([5, 6]);
    repo.appendBooks.mockResolvedValue(2);

    await expect(service.addBooks(7, [5, 6, 6, 404], makeUser())).resolves.toEqual({ added: 2 });
    expect(repo.appendBooks).toHaveBeenCalledWith(7, [5, 6], 1);
  });

  it('refuses books for a shelf that does not exist', async () => {
    const { service, repo, shelfRepo } = makeService();
    shelfRepo.findById.mockResolvedValue(null);

    await expect(service.addBooks(99, [5], makeUser())).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.appendBooks).not.toHaveBeenCalled();
  });

  it('refuses books that would overfill the shelf', async () => {
    const { service, repo } = makeService();
    repo.findExistingBookIds.mockResolvedValue([5]);
    repo.countBooks.mockResolvedValue(DASHBOARD_SHELF_BOOKS_MAX);

    await expect(service.addBooks(7, [5], makeUser())).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.appendBooks).not.toHaveBeenCalled();
  });

  it("shows a linked collection's books first, then the shelf's own, without repeats", async () => {
    const { service, repo, shelfRepo, collectionService } = makeService();
    const user = makeUser();
    shelfRepo.findById.mockResolvedValue({ id: 7, collectionId: 30 });
    collectionService.findBookIdsInOrder.mockResolvedValue([9, 2]);
    repo.findVisibleBookIds.mockResolvedValue([5, 2]);

    await expect(service.findVisibleBookIds(7, user, [1], 50)).resolves.toEqual([9, 2, 5]);
    expect(collectionService.findBookIdsInOrder).toHaveBeenCalledWith(30, user, 50, [1]);
  });

  it('follows the collection but skips the books taken off the shelf', async () => {
    const { service, repo, shelfRepo, collectionService } = makeService();
    shelfRepo.findById.mockResolvedValue({ id: 7, collectionId: 30 });
    repo.findHiddenBookIds.mockResolvedValue([2]);
    collectionService.findBookIdsInOrder.mockResolvedValue([9, 2, 4]);

    await expect(service.findVisibleBookIds(7, makeUser(), [1], 50)).resolves.toEqual([9, 4]);
    // Asks for one more book than the shelf shows, to make up for the hidden one.
    expect(collectionService.findBookIdsInOrder).toHaveBeenCalledWith(30, expect.anything(), 51, [1]);
  });

  it("keeps only the shelf's own books when its linked collection went private", async () => {
    const { service, repo, shelfRepo, collectionService } = makeService();
    shelfRepo.findById.mockResolvedValue({ id: 7, collectionId: 30 });
    collectionService.findBookIdsInOrder.mockRejectedValue(new ForbiddenException());
    repo.findVisibleBookIds.mockResolvedValue([5]);

    await expect(service.findVisibleBookIds(7, makeUser(), [1], 50)).resolves.toEqual([5]);
  });

  it('adds a book to a linked shelf without touching the collection', async () => {
    const { service, repo, shelfRepo } = makeService();
    shelfRepo.findById.mockResolvedValue({ id: 7, collectionId: 30 });
    repo.findExistingBookIds.mockResolvedValue([5]);
    repo.appendBooks.mockResolvedValue(1);

    await expect(service.addBooks(7, [5], makeUser())).resolves.toEqual({ added: 1 });
    expect(repo.appendBooks).toHaveBeenCalledWith(7, [5], 1);
  });

  it('brings back a collection book that was taken off the shelf', async () => {
    const { service, repo, shelfRepo } = makeService();
    shelfRepo.findById.mockResolvedValue({ id: 7, collectionId: 30 });
    repo.unhideBooks.mockResolvedValue(1);

    await service.addBooks(7, [2], makeUser());

    expect(repo.unhideBooks).toHaveBeenCalledWith(7, [2]);
  });

  it('hides a collection book from the shelf instead of removing it from the collection', async () => {
    const { service, repo, shelfRepo, collectionService } = makeService();
    shelfRepo.findById.mockResolvedValue({ id: 7, collectionId: 30 });
    collectionService.containsBook.mockResolvedValue(true);

    await service.removeBook(7, 2, makeUser());

    expect(collectionService.containsBook).toHaveBeenCalledWith(30, 2);
    expect(repo.hideBook).toHaveBeenCalledWith(7, 2, 1);
    expect(repo.removeBook).not.toHaveBeenCalled();
  });

  it('removes a book the shelf added on its own, even when linked', async () => {
    const { service, repo, shelfRepo } = makeService();
    shelfRepo.findById.mockResolvedValue({ id: 7, collectionId: 30 });

    await service.removeBook(7, 5, makeUser());

    expect(repo.removeBook).toHaveBeenCalledWith(7, 5);
    expect(repo.hideBook).not.toHaveBeenCalled();
  });

  it("keeps the shelf's own books when linking it", async () => {
    const { service, repo, collectionService } = makeService();

    await service.relink({ id: 7, collectionId: null } as never, 30, makeUser());

    expect(collectionService.assertShelfLinkable).toHaveBeenCalledWith(30);
    expect(repo.removeHiddenBooks).toHaveBeenCalledWith(7);
    expect(repo.appendBooks).not.toHaveBeenCalled();
  });

  it('keeps a copy of the books the collection was showing when unlinking', async () => {
    const { service, repo, collectionService } = makeService();
    repo.findHiddenBookIds.mockResolvedValue([2]);
    collectionService.findBookIdsInOrder.mockResolvedValue([9, 2]);

    await service.relink({ id: 7, collectionId: 30 } as never, null, makeUser());

    expect(repo.removeHiddenBooks).toHaveBeenCalledWith(7);
    expect(repo.appendBooks).toHaveBeenCalledWith(7, [9], 1);
  });

  it('reports a book that was not on the shelf', async () => {
    const { service, repo } = makeService();
    repo.removeBook.mockResolvedValue(false);

    await expect(service.removeBook(7, 5, makeUser())).rejects.toBeInstanceOf(NotFoundException);
  });
});

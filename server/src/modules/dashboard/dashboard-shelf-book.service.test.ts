import { BadRequestException, NotFoundException } from '@nestjs/common';

import { DASHBOARD_SHELF_BOOKS_MAX, EMPTY_CONTENT_FILTER_RULES } from '@bookorbit/types';
import type { RequestUser } from '../../common/types/request-user';
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
  };
  const shelfRepo = { findById: vi.fn().mockResolvedValue({ id: 7 }) };
  const service = new DashboardShelfBookService(
    repo as unknown as DashboardShelfBookRepository,
    shelfRepo as unknown as DashboardFeaturedShelfRepository,
  );
  return { service, repo, shelfRepo };
}

describe('DashboardShelfBookService', () => {
  it('serves the visible books in shelf order', async () => {
    const { service, repo } = makeService();
    repo.findVisibleBookIds.mockResolvedValue([9, 4]);

    await expect(service.findVisibleBookIds(7, [1, 2], 20)).resolves.toEqual([9, 4]);
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

  it('reports a book that was not on the shelf', async () => {
    const { service, repo } = makeService();
    repo.removeBook.mockResolvedValue(false);

    await expect(service.removeBook(7, 5, makeUser())).rejects.toBeInstanceOf(NotFoundException);
  });
});

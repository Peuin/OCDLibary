import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

import { DASHBOARD_QUOTE_IMPORT_MAX_ROWS, EMPTY_CONTENT_FILTER_RULES } from '@bookorbit/types';
import type { RequestUser } from '../../common/types/request-user';
import type { DashboardQuoteRow } from '../../db/schema';
import { DashboardQuoteRepository, quoteKey } from './dashboard-quote.repository';
import { DashboardQuoteService } from './dashboard-quote.service';

const user = {
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
} as RequestUser;

function row(overrides: Partial<DashboardQuoteRow> = {}): DashboardQuoteRow {
  return { id: 1, text: 'Lúc khởi đầu', source: 'Ga 1,1', enabled: true, createdAt: new Date(0), updatedAt: new Date(0), ...overrides };
}

function makeService() {
  const repo = {
    findPage: vi.fn(),
    findRandomEnabled: vi.fn(),
    findDuplicate: vi.fn().mockResolvedValue(null),
    findExistingKeys: vi.fn().mockResolvedValue(new Set()),
    findById: vi.fn(),
    insert: vi.fn(),
    insertMany: vi.fn((values: unknown[]) => Promise.resolve(values.length)),
    update: vi.fn(),
    delete: vi.fn(),
  };
  return { repo, service: new DashboardQuoteService(repo as unknown as DashboardQuoteRepository) };
}

describe('DashboardQuoteService', () => {
  it('excludes the previous quote and falls back when it is the only one enabled', async () => {
    const { repo, service } = makeService();
    repo.findRandomEnabled.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 5, text: 'x', source: 'y' });
    await expect(service.pickRandom(5)).resolves.toEqual({ quote: { id: 5, text: 'x', source: 'y' } });
    expect(repo.findRandomEnabled).toHaveBeenNthCalledWith(1, 5);
    expect(repo.findRandomEnabled).toHaveBeenNthCalledWith(2, null);
  });

  it('returns null when there are no enabled quotes', async () => {
    const { repo, service } = makeService();
    repo.findRandomEnabled.mockResolvedValue(null);
    await expect(service.pickRandom(undefined)).resolves.toEqual({ quote: null });
    expect(repo.findRandomEnabled).toHaveBeenCalledTimes(1);
  });

  it('rejects blank and duplicate quotes on create', async () => {
    const { repo, service } = makeService();
    await expect(service.create({ text: '  ', source: 'Ga 1,1' }, user)).rejects.toBeInstanceOf(BadRequestException);
    repo.findDuplicate.mockResolvedValueOnce({ id: 2 });
    await expect(service.create({ text: 'a', source: 'b' }, user)).rejects.toBeInstanceOf(ConflictException);
  });

  it('toggles enabled without touching text', async () => {
    const { repo, service } = makeService();
    repo.findById.mockResolvedValue(row());
    repo.update.mockResolvedValue(row({ enabled: false }));
    await expect(service.update(1, { enabled: false }, user)).resolves.toMatchObject({ enabled: false });
    expect(repo.findDuplicate).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith(1, { text: 'Lúc khởi đầu', source: 'Ga 1,1', enabled: false });
  });

  it('throws NotFound for a missing quote', async () => {
    const { repo, service } = makeService();
    repo.findById.mockResolvedValue(null);
    repo.delete.mockResolvedValue(false);
    await expect(service.update(9, { enabled: true }, user)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove(9, user)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('imports 100 quotes from a file', async () => {
    const { repo, service } = makeService();
    const content = Array.from({ length: 100 }, (_, index) => `Câu ${index + 1} (Ga 1,${index + 1})`).join('\n');
    await expect(service.importFile(content, 'txt', user)).resolves.toEqual({ imported: 100, skippedDuplicates: 0, errors: [] });
    expect(repo.insertMany.mock.calls[0]![0]).toHaveLength(100);
  });

  it('skips existing and repeated quotes and reports bad lines', async () => {
    const { repo, service } = makeService();
    repo.findExistingKeys.mockResolvedValue(new Set([quoteKey('A', 'Ga 1,1')]));
    const result = await service.importFile('A (Ga 1,1)\nB (Mt 5,3)\nB (Mt 5,3)\nkhông nguồn', 'txt', user);
    expect(result).toEqual({ imported: 1, skippedDuplicates: 2, errors: [{ line: 4, code: 'missing_source' }] });
  });

  it('rejects files over the row limit', async () => {
    const { repo, service } = makeService();
    const content = Array.from({ length: DASHBOARD_QUOTE_IMPORT_MAX_ROWS + 1 }, (_, index) => `${index} (x)`).join('\n');
    await expect(service.importFile(content, 'txt', user)).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.insertMany).not.toHaveBeenCalled();
  });
});

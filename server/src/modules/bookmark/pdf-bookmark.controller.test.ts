import type { RequestUser } from '../../common/types/request-user';
import { PdfBookmarkController } from './pdf-bookmark.controller';
import type { CreatePdfBookmarkDto } from './dto/create-pdf-bookmark.dto';

describe('PdfBookmarkController', () => {
  const user = { id: 8 } as RequestUser;
  const service = {
    getPdfBookmarks: vi.fn(),
    createPdfBookmark: vi.fn(),
    deletePdfBookmark: vi.fn(),
  };
  const controller = new PdfBookmarkController(service as never);

  beforeEach(() => vi.clearAllMocks());

  it('delegates the file-scoped list to the service', async () => {
    service.getPdfBookmarks.mockResolvedValue([]);

    await controller.getBookmarks(70, user);

    expect(service.getPdfBookmarks).toHaveBeenCalledWith(70, user);
  });

  it('delegates create with the validated body and current user', async () => {
    const dto: CreatePdfBookmarkDto = { pageNumber: 12, title: 'Page 12' };
    service.createPdfBookmark.mockResolvedValue({ id: 1 });

    await controller.createBookmark(70, dto, user);

    expect(service.createPdfBookmark).toHaveBeenCalledWith(70, user, dto);
  });

  it('delegates delete with file, bookmark, and current user', async () => {
    service.deletePdfBookmark.mockResolvedValue(undefined);

    await controller.deleteBookmark(70, 10, user);

    expect(service.deletePdfBookmark).toHaveBeenCalledWith(70, 10, user);
  });
});

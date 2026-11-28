import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreatePdfBookmarkDto } from './dto/create-pdf-bookmark.dto';

async function errorsFor(value: Record<string, unknown>) {
  return validate(plainToInstance(CreatePdfBookmarkDto, value), { whitelist: true, forbidNonWhitelisted: true });
}

describe('CreatePdfBookmarkDto validation', () => {
  it('accepts a positive integer page and non-empty title', async () => {
    expect((await errorsFor({ pageNumber: 12, title: 'Page 12' })).length).toBe(0);
  });

  it.each([0, -1, 1.5, '12'])('rejects invalid page number %s', async (pageNumber) => {
    expect((await errorsFor({ pageNumber, title: 'Page' })).length).toBeGreaterThan(0);
  });

  it('requires a non-empty string title up to 500 characters', async () => {
    expect((await errorsFor({ pageNumber: 1, title: '' })).length).toBeGreaterThan(0);
    expect((await errorsFor({ pageNumber: 1, title: 12 })).length).toBeGreaterThan(0);
    expect((await errorsFor({ pageNumber: 1, title: 'x'.repeat(501) })).length).toBeGreaterThan(0);
  });

  it('rejects unknown fields', async () => {
    expect((await errorsFor({ pageNumber: 1, title: 'Page', extra: true })).length).toBeGreaterThan(0);
  });
});

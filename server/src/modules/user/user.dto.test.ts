import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Permission } from '@bookorbit/types';

import { CreateUserDto } from './dto/create-user.dto';
import { SetLibrariesDto } from './dto/set-libraries.dto';
import { SetPermissionsDto } from './dto/set-permissions.dto';
import { SetSuperuserDto } from './dto/set-superuser.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateMeSettingsDto } from './dto/update-me-settings.dto';
import { UpdateUserDto } from './dto/update-user.dto';

async function hasErrors(dto: object): Promise<boolean> {
  return (await validate(dto as any)).length > 0;
}

describe('User DTO validation', () => {
  it('CreateUserDto requires username and password while allowing name and email to be omitted', async () => {
    const bad = plainToInstance(CreateUserDto, { username: 'ab', permissionNames: [1, 2] });
    expect(await hasErrors(bad)).toBe(true);

    const good = plainToInstance(CreateUserDto, {
      username: 'alice',
      password: 'StrongPass123',
      email: null,
      permissionNames: [Permission.LibraryDownload],
    });
    expect(await hasErrors(good)).toBe(false);
  });

  it('CreateUserDto applies the existing password policy and validates optional email values', async () => {
    for (const password of ['short', 'lowercase123', 'UPPERCASE123', 'NoDigitsHere', `Aa1${'x'.repeat(1022)}`]) {
      expect(await hasErrors(plainToInstance(CreateUserDto, { username: 'alice', password }))).toBe(true);
    }

    expect(await hasErrors(plainToInstance(CreateUserDto, { username: 'alice', password: 'StrongPass123', email: 'not-an-email' }))).toBe(true);
    expect(
      await hasErrors(
        plainToInstance(CreateUserDto, {
          username: 'alice',
          password: 'StrongPass123',
          name: 'Alice',
          email: 'alice@example.com',
        }),
      ),
    ).toBe(false);
  });

  it('SetPermissionsDto requires an array of permission enums', async () => {
    expect(await hasErrors(plainToInstance(SetPermissionsDto, { permissionNames: [1, 2] }))).toBe(true);
    expect(await hasErrors(plainToInstance(SetPermissionsDto, { permissionNames: [Permission.LibraryDownload] }))).toBe(false);
    expect(await hasErrors(plainToInstance(SetPermissionsDto, { permissionNames: [] }))).toBe(false);
  });

  it('SetSuperuserDto requires a boolean', async () => {
    expect(await hasErrors(plainToInstance(SetSuperuserDto, { isSuperuser: true }))).toBe(false);
    expect(await hasErrors(plainToInstance(SetSuperuserDto, { isSuperuser: 'true' }))).toBe(true);
    expect(await hasErrors(plainToInstance(SetSuperuserDto, {}))).toBe(true);
  });

  it('SetLibrariesDto requires positive integer IDs', async () => {
    expect(await hasErrors(plainToInstance(SetLibrariesDto, { libraryIds: [1, 2] }))).toBe(false);
    expect(await hasErrors(plainToInstance(SetLibrariesDto, { libraryIds: [0] }))).toBe(true);
    expect(await hasErrors(plainToInstance(SetLibrariesDto, { libraryIds: ['2'] }))).toBe(true);
  });

  it('UpdateMeDto accepts an optional name string and ignores unknown fields', async () => {
    expect(await hasErrors(plainToInstance(UpdateMeDto, { name: 'Alice' }))).toBe(false);
    expect(await hasErrors(plainToInstance(UpdateMeDto, {}))).toBe(false);
    expect(await hasErrors(plainToInstance(UpdateMeDto, { name: '' }))).toBe(true);
    expect(await hasErrors(plainToInstance(UpdateMeDto, { name: 'a'.repeat(256) }))).toBe(true);
  });

  it('UpdateMeSettingsDto requires settings to be a non-empty object', async () => {
    expect(await hasErrors(plainToInstance(UpdateMeSettingsDto, { settings: { theme: 'dark' } }))).toBe(false);
    expect(await hasErrors(plainToInstance(UpdateMeSettingsDto, { settings: { dashboardConfig: { readingGoal: 12 } } }))).toBe(false);
    expect(await hasErrors(plainToInstance(UpdateMeSettingsDto, { settings: 'bad' }))).toBe(true);
    expect(await hasErrors(plainToInstance(UpdateMeSettingsDto, { settings: 42 }))).toBe(true);
    expect(await hasErrors(plainToInstance(UpdateMeSettingsDto, {}))).toBe(true);
    expect(await hasErrors(plainToInstance(UpdateMeSettingsDto, { settings: {} }))).toBe(true);
  });

  it('UpdateUserDto enforces boolean active field', async () => {
    expect(await hasErrors(plainToInstance(UpdateUserDto, { active: 'false' }))).toBe(true);
    expect(await hasErrors(plainToInstance(UpdateUserDto, { active: false }))).toBe(false);
  });
});

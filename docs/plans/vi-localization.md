# Plan: Thêm tiếng Việt (vi) cho toàn bộ app

Tài liệu này dành cho agent thực thi (Codex). Đọc hết trước khi bắt đầu. Đọc thêm `CLAUDE.md` và `docs/LOCALIZATION.md`: mọi quy ước ở đó vẫn áp dụng, trừ ngoại lệ về Crowdin ghi ở mục "Bối cảnh".

## Mục tiêu

- Người dùng chọn được "Tiếng Việt" trong language picker (trang login, setup và Settings > Appearance > Language).
- Mọi chuỗi giao diện đều có bản tiếng Việt: toàn bộ `client/src/locales/en.json` (khoảng 9.356 message, trong đó 305 message ICU plural), cộng các chuỗi tiếng Anh còn hardcode trong component.
- Ngày, số và thời gian tương đối hiển thị theo `vi`.
- `pnpm --filter client validate:locales`, lint, typecheck và các test liên quan đều pass.

## Bối cảnh (đã khảo sát)

- i18n dùng Vue I18n cùng ICU MessageFormat, xem `client/src/i18n/index.ts` và `client/src/i18n/icu.ts`. `en` là catalog nguồn và cũng là `fallbackLocale`. Các locale khác được lazy-load qua `import(../locales/${locale}.json)`.
- Danh sách locale nằm ở `packages/types/src/locale.ts` (`SUPPORTED_LOCALES`, `LOCALE_LABELS`, `LOCALE_DIRECTIONS`). Language picker, validation preference phía server và typing phía client đều đọc từ đây.
- `client/scripts/validate-locales.mjs` bắt buộc tập file trong `client/src/locales/` khớp đúng `SUPPORTED_LOCALES`. Script này cũng kiểm tra placeholder, cấu trúc plural, không có HTML, không có em dash và protected terms.
- Catalog trong `en.json` không dùng linked message (`@:`) và không dùng ICU `select`. Chỉ có placeholder `{name}` và ICU `plural`.
- **Ngoại lệ về Crowdin:** repo upstream dùng Crowdin làm nguồn cho catalog đích và cấm sửa catalog đích trực tiếp trong Git. Repo này là bản fork: `.github/workflows/` chỉ có `ghcr.yml`, không chạy workflow Crowdin nào. Vì vậy `vi.json` sẽ được viết trực tiếp trong Git, và Git là nguồn duy nhất của bản dịch tiếng Việt. Không cần thiết lập Crowdin.

## Nguyên tắc chung

- Branch: `BO-<issue>-vi-localization`, hoặc `vi-localization` nếu chưa có issue.
- Không đổi key hay nội dung `en.json`, trừ Phase 3 (thêm key cho chuỗi đang hardcode).
- Không bao giờ dùng em dash (ký tự Unicode U+2014), kể cả trong bản dịch. Dùng dấu gạch ngang thường `-` hoặc dấu hai chấm.
- Không đưa HTML vào message.
- Commit theo `docs/COMMIT_GUIDELINES.md`. **Không** thêm trailer `Co-authored-by`.
- Chạy Prettier và ESLint trước mỗi commit.

## Phase 1: Đăng ký locale `vi`

1. `packages/types/src/locale.ts`:
   - Thêm `"vi"` vào `SUPPORTED_LOCALES`, đặt ngay sau `"uk"` để giữ thứ tự chữ cái.
   - `LOCALE_LABELS.vi = "Tiếng Việt"`.
   - `LOCALE_DIRECTIONS.vi = "ltr"`.
2. Tạo `client/src/locales/vi.json` với nội dung `{}`. Phase 2 sẽ điền vào.
3. Tìm mọi nơi đang liệt kê locale và bổ sung `vi` cho đồng bộ:
   ```bash
   grep -rln "zh-Hant" --exclude-dir=node_modules --exclude-dir=dist .
   ```
   Các file cần xem: `crowdin.yml` (thêm `vi` vào `export_languages` để config vẫn nhất quán), `scripts/classify-crowdin-pr.sh` (`allowed_paths`), `client/src/i18n/icu.spec.ts` (import và bảng catalog), `client/src/stores/__tests__/locale.spec.ts`, `docs/LOCALIZATION.md` (thêm dòng Vietnamese vào bảng).
4. `client/src/stores/__tests__/locale.spec.ts`: thêm test để `matchSupportedLocale(['vi-VN'])` và `matchSupportedLocale(['vi'])` trả về `'vi'`.
5. `client/src/i18n/icu.spec.ts`: thêm `vi` vào test runtime ICU. Tiếng Việt chỉ có một category là `other`. Kiểm tra lại bằng `new Intl.PluralRules('vi').resolvedOptions().pluralCategories`.
6. Server: chạy `pnpm --filter server exec vitest run src/modules/user-preferences/user-preferences.service.test.ts` để chắc server chấp nhận `locale: 'vi'`.
7. Build types và validate:
   ```bash
   pnpm --filter @bookorbit/types build
   pnpm --filter client validate:locales
   ```

Commit: `feat(i18n): register Vietnamese locale`.

## Phase 2: Dịch `en.json` sang `vi.json`

### Cách làm

- Dịch theo từng namespace cấp cao nhất. Các namespace lớn cần chia nhỏ hơn: `settings` (khoảng 2.900 message), `book` (khoảng 1.200), `podcast` (khoảng 740), `bookRequests` (khoảng 610).
- Thứ tự gợi ý, ưu tiên màn hình người dùng thấy trước: `common`, `errors`, `auth`, `titles`, `views`, `dashboard`, `library`, `book`, `author`, `series`, `collection`, `smartScope`, `reader`, `annotations`, `bookDock`, `statistics`, `achievements`, `notifications`, `components`, `tools`, `bookMetadataFetch`, `metadataScore`, `scanner`, `settings`, `adminFeature`, `audit`, `email`, `migration`, `bookRequests`, `podcast`, `tts`, `hardcover`, `customIcons`, `whatsNew`.
- `vi.json` phải giữ đúng cấu trúc lồng nhau và thứ tự key của `en.json`. Có thể viết một script Node nhỏ trong thư mục tạm (không commit) để merge từng batch vào `vi.json` theo thứ tự key của `en.json`.
- Sau mỗi batch chạy `pnpm --filter client validate:locales` và sửa lỗi ngay, không dồn lại đến cuối.
- Commit theo từng nhóm namespace, ví dụ `i18n(client): translate auth and library to Vietnamese`.

### Quy tắc dịch bắt buộc

1. **Placeholder:** giữ nguyên tên và số lượng, ví dụ `{name}`, `{count}`, `{total}`, `{title}`. Được đổi vị trí trong câu, không được đổi tên.
2. **ICU plural:** tiếng Việt chỉ dùng category `other`.
   - Bỏ nhánh `one`. Giữ mọi exact selector có trong bản gốc, ví dụ `=0` và `=1`.
   - Ví dụ: `{count, plural, =0 {No books} one {1 book} other {# books}}` dịch thành `{count, plural, =0 {Không có sách} other {# cuốn sách}}`.
   - Giữ nguyên tên argument, kiểu argument và `offset` nếu có.
   - Validator sẽ báo lỗi nếu thiếu category hoặc lệch selector.
3. **Không để nguyên tiếng Anh**, trừ tên riêng và thuật ngữ kỹ thuật: BookOrbit, Kobo, KOReader, Kindle, Hardcover, Goodreads, StoryGraph, Readwise, OPDS, OIDC, EPUB, PDF, CBZ, ISBN, API, URL, SMTP, Markdown, v.v.
4. **Protected terms:** không đổi các key trong `client/scripts/locale-protected-terms.mjs`. Hiện chỉ áp dụng cho một số locale, nhưng với `vi` cũng nên giữ nguyên.
5. **Xưng hô:** gọi người dùng là "bạn". Giọng văn ngắn gọn, trung tính, không dịch từng chữ.
6. **Viết hoa:** chỉ viết hoa chữ đầu câu hoặc nhãn (sentence case), không Title Case kiểu tiếng Anh. Ví dụ "Cài đặt tài khoản", không phải "Cài Đặt Tài Khoản".
7. **Độ dài:** nhãn nút và tab nên ngắn tương đương bản tiếng Anh vì thường nằm trong không gian hẹp, nhất là trên mobile.
8. Không có em dash, không có HTML, không có khoảng trắng thừa ở đầu hoặc cuối chuỗi.

### Bảng thuật ngữ (dùng thống nhất)

| English                       | Tiếng Việt                            |
| ----------------------------- | ------------------------------------- |
| Book / Books                  | Sách                                  |
| Library                       | Thư viện                              |
| Author                        | Tác giả                               |
| Series                        | Bộ sách                               |
| Collection                    | Bộ sưu tập                            |
| Shelf                         | Kệ sách                               |
| Smart Scope                   | Bộ lọc thông minh                     |
| Book Dock                     | Book Dock (tên tính năng, giữ nguyên) |
| Metadata                      | Siêu dữ liệu                          |
| Cover                         | Ảnh bìa                               |
| Title                         | Tiêu đề                               |
| Publisher                     | Nhà xuất bản                          |
| Genre / Tag                   | Thể loại / Thẻ                        |
| Rating                        | Đánh giá                              |
| Reader (app đọc)              | Trình đọc                             |
| Reading progress              | Tiến độ đọc                           |
| Read / Reading / Unread       | Đã đọc / Đang đọc / Chưa đọc          |
| Annotation                    | Chú thích                             |
| Highlight                     | Đánh dấu                              |
| Bookmark                      | Dấu trang                             |
| Audiobook                     | Sách nói                              |
| Ebook                         | Sách điện tử                          |
| Comic                         | Truyện tranh                          |
| Podcast / Episode             | Podcast / Tập                         |
| Import / Export               | Nhập / Xuất                           |
| Scan                          | Quét                                  |
| Sync                          | Đồng bộ                               |
| Upload / Download             | Tải lên / Tải xuống                   |
| Settings                      | Cài đặt                               |
| Appearance                    | Giao diện                             |
| Accent (color)                | Màu nhấn                              |
| Admin / Administration        | Quản trị                              |
| User / Role / Permission      | Người dùng / Vai trò / Quyền          |
| Sign in / Sign out / Sign up  | Đăng nhập / Đăng xuất / Đăng ký       |
| Password                      | Mật khẩu                              |
| Username                      | Tên đăng nhập                         |
| Request (book request)        | Yêu cầu sách                          |
| Notification                  | Thông báo                             |
| Achievement                   | Thành tích                            |
| Statistics                    | Thống kê                              |
| Audit log                     | Nhật ký hoạt động                     |
| Save / Cancel / Delete / Edit | Lưu / Hủy / Xóa / Sửa                 |
| Confirm                       | Xác nhận                              |
| Retry                         | Thử lại                               |
| Loading...                    | Đang tải...                           |
| Failed to ...                 | Không thể ...                         |

Nếu cần thêm thuật ngữ mới, bổ sung vào bảng này trong cùng commit để các batch sau dùng thống nhất.

### Kiểm tra độ đầy đủ

Sau khi dịch xong, chạy đoạn script dưới đây (không commit). Kết quả cần là `missing 0`, và mọi key trong danh sách `same as English` phải là tên riêng hoặc thuật ngữ được phép giữ nguyên.

```bash
node -e '
const en=require("./client/src/locales/en.json"),vi=require("./client/src/locales/vi.json");
const flat=(o,p="",m=new Map())=>{for(const[k,v]of Object.entries(o)){const key=p?p+"."+k:k;typeof v=="string"?m.set(key,v):flat(v,key,m)}return m};
const E=flat(en),V=flat(vi);const missing=[...E.keys()].filter(k=>!V.has(k));
const same=[...E].filter(([k,v])=>V.get(k)===v).map(([k])=>k);
console.log("missing",missing.length,missing.slice(0,20));console.log("same as English",same.length,same.slice(0,50));'
```

## Phase 3: Chuỗi hardcode chưa qua i18n

1. Tìm text tiếng Anh viết thẳng trong template và script Vue. Khảo sát sơ bộ thấy vài chỗ, ví dụ trong `features/reader/ReaderView.vue`, `features/readwise/`, `features/storygraph/`, `features/library/components/LibraryCreatorDetails.vue`, `features/reader/pdf-v4/components/`. Có thể tìm bằng:
   ```bash
   find client/src -name "*.vue" | xargs grep -nE ">[[:space:]]*[A-Z][a-z]+( [a-z]+){1,6}[[:space:]]*<"
   find client/src -name "*.vue" -o -name "*.ts" | grep -v spec | xargs grep -nE "(placeholder|title|aria-label|label)=\"[A-Z][a-z]+ "
   find client/src -name "*.ts" | grep -v spec | xargs grep -nE "toast\.(success|error|info|warning)\('[A-Z]"
   ```
2. Với mỗi chuỗi: thêm key vào `en.json` theo đúng namespace của feature, thay bằng `t('...')`, rồi thêm bản dịch vào `vi.json`.
3. Không i18n: tên riêng, log, message chỉ dùng cho developer, giá trị gửi lên API.
4. Cập nhật test của component nếu test đang assert text tiếng Anh cũ.
5. Tuân thủ quy tắc Vue trong `CLAUDE.md`, ví dụ handler phải là bare method reference.

Commit: `fix(i18n): move hardcoded client strings into locale catalogs`.

## Phase 4: Định dạng theo locale

- Đọc `client/src/i18n/formatters.ts` và xác nhận các hàm dùng `Intl.*` với locale đang active, không hardcode `'en'` hay `'en-US'`.
- Tìm các chỗ gọi thẳng `toLocaleString(`, `toLocaleDateString(` hoặc `new Intl.` mà truyền `'en-US'` hoặc không truyền locale:
  ```bash
  grep -rnE "toLocale(Date|Time)?String\(|new Intl\." client/src --include=*.ts --include=*.vue | grep -v spec
  ```
  Chuyển những chỗ đó sang formatter chung.
- Kiểm tra tay: số có dấu chấm ngăn cách hàng nghìn (`1.234`), ngày dạng `30 thg 9, 2026`, thời gian tương đối dạng "3 ngày trước".

## Phase 5 (tùy chọn, hỏi chủ repo trước): Chuỗi phía server

Server hiện gửi một số text tiếng Anh trực tiếp tới người dùng:

- `server/src/modules/email/system-mail.service.ts`: email đặt lại mật khẩu (`subject: 'Reset your password'` và nội dung trong `buildResetText`).
- Hơn 1.000 message trong `HttpException`. Phần lớn là lỗi kỹ thuật, và client thường hiển thị message riêng từ `en.json` (có `errorCode` qua `GlobalExceptionFilter`).

Đề xuất: chỉ xử lý email hệ thống, bằng cách đọc locale preference của người nhận và chọn template `en` hoặc `vi`. Không dịch toàn bộ exception message của server trong plan này. Chỉ làm phase này khi chủ repo đồng ý.

## Phase 6: Tiếng Việt làm ngôn ngữ mặc định (cần chủ repo quyết định)

Code hiện tại đã bỏ tự nhận diện ngôn ngữ trình duyệt, và trang setup ép về `DEFAULT_LOCALE` (`client/src/main.ts`, `client/src/stores/locale.ts`). Nếu muốn app mặc định là tiếng Việt:

- **Không** đổi `DEFAULT_LOCALE` sang `vi`, vì đó là catalog nguồn và fallback. Đổi sẽ làm các key thiếu hiển thị sai và làm hỏng validator.
- Thêm một hằng số riêng, ví dụ `INITIAL_LOCALE: Locale = "vi"` trong `packages/types/src/locale.ts`. Dùng nó trong `detectInitialLocale()` và trong nhánh `needsSetup` của `main.ts`. Cập nhật `client/src/stores/__tests__/locale.spec.ts` theo.
- Làm tương tự bước chuyển một lần của accent màu (`accentDefault` trong `client/src/stores/theme.ts`) nếu cần đổi người dùng cũ đang lưu `en` sang `vi`. Chỉ làm khi chủ repo yêu cầu.

## Phase 7: Kiểm tra cuối

```bash
pnpm --filter @bookorbit/types build
pnpm --filter client validate:locales
pnpm --filter client lint:check
pnpm --filter server lint:check
pnpm typecheck:client
pnpm typecheck:server
pnpm --filter client exec vitest run src/stores/__tests__/locale.spec.ts src/i18n
pnpm --filter server exec vitest run src/modules/user-preferences/user-preferences.service.test.ts
```

Kiểm tra tay (desktop và mobile 375px) với locale `vi`:

- Language picker hiển thị "Tiếng Việt". Reload vẫn giữ lựa chọn. `<html lang="vi">`.
- Login, setup, dashboard, thư viện, chi tiết sách, trình đọc, Settings (đủ các tab), trang quản trị, thống kê, dialog xác nhận xóa, toast lỗi.
- Không có chữ bị tràn hay cắt ở nút, tab, sidebar và badge.
- Plural hiển thị đúng với 0, 1 và 5 phần tử.
- Ngày, số và thời gian tương đối theo định dạng Việt Nam.

## Bảo trì sau này

- Khi merge code upstream có key mới trong `en.json`, key đó sẽ hiện tiếng Anh cho tới khi được dịch. Chạy lại script "Kiểm tra độ đầy đủ" ở Phase 2 sau mỗi lần merge upstream và dịch bù các key thiếu.
- Ghi chú này vào `docs/LOCALIZATION.md` ở một mục "Vietnamese (fork-maintained)" ngắn, nói rõ `vi.json` được duy trì trực tiếp trong Git, không qua Crowdin.

## Định nghĩa hoàn thành

- [ ] `vi` có trong `SUPPORTED_LOCALES`, picker hiển thị "Tiếng Việt".
- [ ] `vi.json` có đủ 100% key của `en.json`. Các key giống tiếng Anh chỉ là tên riêng hoặc thuật ngữ được phép.
- [ ] Không còn chuỗi tiếng Anh hardcode trong các màn hình chính.
- [ ] Toàn bộ lệnh ở Phase 7 pass.
- [ ] Đã kiểm tra tay trên desktop và mobile.
- [ ] Phase 5 và Phase 6 chỉ làm nếu chủ repo đã đồng ý, và ghi rõ trong PR là đã làm hay bỏ qua.

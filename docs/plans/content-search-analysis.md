# Phân tích: Tìm kiếm theo nội dung trong sách (Content / Semantic Search)

Người soạn: Kapy (BA) · Review kỹ thuật: Claude · Ngày: 28/11/2026 · Trạng thái: **Nháp v2 (đã review), chờ anh Peuin chốt** · Chưa có ticket Jira

## 1. Vấn đề

Người dùng muốn gõ một câu/ý (vd. "lòng thương xót của Chúa") và tìm ra **những sách và đoạn văn** chứa nội dung đó trong cả thư viện, không chỉ tìm theo tên sách/tác giả.

## 2. Hiện trạng trong code (đã đối chiếu repo, nhánh main sau PR #5)

| Thành phần | Đang làm gì | Có tìm theo nội dung không |
|---|---|---|
| `server/src/modules/search` | Tìm theo tên sách, tác giả, bộ sách, thể loại, tag; không phân biệt dấu (`bookorbit_unaccent` + `pg_trgm`, migration 0047) | Không |
| `server/src/modules/embedding` | Vector 256 chiều từ **metadata**, tạo bằng **băm từ khoá (FNV32 % 256)**, không phải mô hình ngôn ngữ | Không, và **không phải semantic** |
| Tìm trong trình đọc (EPUB qua foliate, PDF qua `@embedpdf/plugin-search`) | Tìm trong **1 cuốn đang mở**, chạy ở trình duyệt | Có, chỉ 1 cuốn |
| Trích văn bản phía server | Có `unzipper` (đọc được EPUB). **Chưa có** thư viện trích chữ PDF phía server (`pdf-lib` không trích được text) | Thiếu cho PDF |
| Job nền | Có mẫu `scan_jobs` + `@nestjs/schedule`, chưa có hàng đợi job chuyên dụng | Cần tái dùng mẫu scanner |
| Cơ sở dữ liệu | PostgreSQL 18 + `pgvector` (`pgvector/pgvector:pg18`), index HNSW trên `book_metadata.embedding` | Hạ tầng có, nhưng xem mục 3.1 |

**Kết luận:** chưa có tìm nội dung trên toàn thư viện. Postgres đủ cho giai đoạn 1, không cần thêm dịch vụ. Tuy nhiên "hạ tầng sẵn sàng" ở bản v1 hơi lạc quan: thiếu trích chữ PDF phía server, chưa có cách tính vị trí EPUB phía server, và embedding hiện tại không dùng lại được cho semantic.

## 3. Nhận định review (điểm cần sửa so với v1)

### 3.1. Embedding hiện tại không phải semantic
- Vector 256 chiều hiện tại là "túi từ băm": hai câu cùng ý nhưng khác chữ sẽ không gần nhau. Không nên mô tả là nền tảng cho giai đoạn 2.
- Cột `vector(256)` gắn với `book_metadata` (1 vector / sách). Semantic theo đoạn cần **bảng riêng**, số chiều theo mô hình được chọn (thường 384, 768 hoặc 1024). Không sửa cột cũ để tránh làm hỏng tính năng gợi ý sách tương tự.

### 3.2. Giai đoạn 1 nên dùng Postgres Full-Text Search, không dùng `pg_trgm` làm chính
- `pg_trgm` hợp với chuỗi ngắn (tên sách). Với văn bản dài, index trigram GIN rất lớn, chậm khi cập nhật và không xếp hạng theo mức liên quan.
- Đề xuất: cột `tsvector` dựng từ `bookorbit_unaccent(text)` với cấu hình `simple` (tiếng Việt là ngôn ngữ đơn âm tiết, không cần stemmer), index GIN. Tìm cụm từ bằng `phraseto_tsquery` / `websearch_to_tsquery`, xếp hạng bằng `ts_rank_cd`.
- `pg_trgm` chỉ giữ làm phương án dự phòng cho lỗi gõ, nếu đo thấy cần.
- **Rủi ro mất dấu:** bỏ dấu làm "ba", "bà", "bá" trùng nhau. Khi người dùng gõ **có dấu**, nên ưu tiên (tăng điểm) đoạn khớp đúng dấu; khi gõ không dấu thì khớp tất cả. Cần thống nhất quy tắc này với GD1-C01/C02.
- Đoạn trích tô đậm bằng `ts_headline` khá tốn CPU: chỉ chạy trên các kết quả của trang hiện tại, không chạy trên toàn bộ kết quả.

### 3.3. Quy mô (theo CLAUDE.md: hàng chục nghìn sách / người dùng)
- Ước tính thô: 20.000 sách × 100-300 đoạn = **2-6 triệu dòng**, văn bản thô 10-30 GB trước nén (TOAST nén được một phần), cộng index GIN. Đây là con số giả định, **phải đo** trước khi chốt thiết kế.
- Hệ quả thiết kế:
  - Index **theo file sách, một lần**, không nhân bản theo người dùng. Phân quyền lọc lúc truy vấn (thư viện người dùng được xem + `content-filter-sql.utils.ts`).
  - Nên lưu thêm `library_id` trên bảng đoạn để lọc phân quyền sớm, tránh join toàn bảng sách.
  - API phân trang, nhóm theo sách (vd. 20 sách / trang, tối đa 3 đoạn trích / sách). Không trả toàn bộ kết quả về frontend.
  - Nên có cấu hình bật/tắt tính năng (và theo từng thư viện) vì tốn dung lượng đĩa đáng kể.

### 3.4. Job index: phải chạy nền, tiếp tục được, idempotent
- Trạng thái index theo từng file: `pending` / `indexed` / `failed` / `unsupported` (PDF ảnh, CBZ, sách nói) / `skipped`, kèm `content_hash` và phiên bản bộ trích để bỏ qua file không đổi và re-index khi nâng cấp bộ trích.
- Ba nguồn kích hoạt: tải lên, quét thư viện, và **backfill** cho thư viện đang có (lần đầu có thể chạy nhiều giờ). Backfill cần tiến độ hiển thị cho admin, giới hạn đồng thời, chạy lại được khi server khởi động lại.
- Phải xử lý: file bị thay thế (re-index), sách bị xoá (xoá đoạn theo cascade), sách bị chuyển thư viện (`book-move`: cập nhật `library_id`).
- Log theo chuẩn `[content_index.book] [start|end|fail] bookId=... durationMs=... chunks=...`. Không log nội dung sách.

### 3.5. Mở đúng vị trí (AC2) là rủi ro kỹ thuật lớn nhất
- **EPUB:** CFI hiện do foliate tính ở trình duyệt. Tính CFI chính xác phía server là việc khó và dễ lệch. Đề xuất lưu `spine index` (chương) + offset ký tự + một đoạn text trích dẫn; khi bấm kết quả, trình đọc mở chương đó rồi dùng tìm-trong-sách (GD1-C01) để nhảy tới đoạn khớp. Như vậy **phụ thuộc** C01 thay vì chỉ "liên quan".
- **PDF:** cần thêm thư viện trích chữ theo trang phía server (vd. `pdfjs-dist` hoặc pdfium WASM, cùng engine client đang dùng để vị trí khớp nhau). Đây là dependency mới, Atlas chọn trong CS-01.

### 3.6. Phạm vi định dạng chưa rõ
Scanner đang nhận: EPUB, PDF, MOBI, AZW3, FB2, TXT, CBZ/CBR/CB7, M4B/MP3. Bản v1 chỉ nói EPUB/PDF. Đề xuất đợt này: **EPUB, PDF có lớp chữ, TXT** (dễ). MOBI/AZW3/FB2 đánh dấu `unsupported` và để đợt sau. Cần anh Peuin chốt (câu hỏi 5).

### 3.7. Giai đoạn 2 (semantic): chi phí thật sự nằm ở backfill
- Mô hình chạy local phù hợp tiếng Việt: họ `multilingual-e5` (small/base) hoặc `bge-m3`. Trên CPU, tốc độ chỉ khoảng vài chục đến vài trăm đoạn/giây, nên vài triệu đoạn có thể mất **nhiều ngày** backfill. Cần đo, không đoán.
- Lưu trữ: 3 triệu đoạn × 384 chiều × 4 byte ≈ 4.6 GB, chưa kể HNSW. Dùng `halfvec` của pgvector giảm một nửa.
- Cách triển khai gợi ý: **container sidecar** cho embedding (giống cách đang chạy Kokoro TTS), server gọi qua HTTP nội bộ, không gửi nội dung ra ngoài, không cần API key.
- Có thể giảm chi phí: chỉ embed theo **chương/đoạn lớn** thay vì đoạn nhỏ, hoặc bật semantic theo từng thư viện.
- Xếp hạng kết hợp: Reciprocal Rank Fusion (RRF) giữa kết quả FTS và kết quả vector, đơn giản hơn chuẩn hoá điểm.

### 3.8. Phân quyền và bảo mật
- Kích hoạt backfill / re-index toàn thư viện phải có `@RequirePermission(...)` (quyền quản trị thư viện), UI ẩn theo `usePermissions()`.
- Đoạn trích là nội dung sách: chỉ trả về khi người dùng có quyền xem sách đó (AC3), kể cả trong số đếm tổng kết quả.

## 4. Đề xuất chia 2 giai đoạn (đã cập nhật)

### Giai đoạn 1: Tìm toàn văn (full-text, theo từ khoá), làm trước
- Trích văn bản EPUB (theo chương), PDF có lớp chữ (theo trang), TXT; chia đoạn, lưu kèm vị trí (chương + offset cho EPUB, số trang cho PDF).
- FTS Postgres: `tsvector` cấu hình `simple` trên văn bản đã bỏ dấu, index GIN; ưu tiên khớp đúng dấu khi người dùng gõ có dấu.
- Job nền có trạng thái từng file, backfill có tiến độ, re-index khi file đổi.
- Tab **"Trong nội dung"** trong ô tìm kiếm: kết quả nhóm theo sách, phân trang, đoạn trích tô đậm; bấm vào mở đúng chương/trang rồi nhảy tới đoạn.
- Chỉ hiện sách người dùng được xem.
- Không hỗ trợ đợt này: PDF ảnh quét (OCR), CBZ/CBR/CB7, sách nói, MOBI/AZW3/FB2 (chờ chốt).

### Giai đoạn 2: Tìm theo ý nghĩa (semantic), làm sau
- Embedding đoạn bằng mô hình đa ngôn ngữ chạy trong container sidecar, lưu bảng riêng (`halfvec`), kết hợp với FTS bằng RRF.
- Chỉ bắt đầu khi giai đoạn 1 đã có số liệu thật về số đoạn và dung lượng.

## 5. User Story & Acceptance Criteria (Giai đoạn 1)

**US-CS-01:** Là người đọc, tôi muốn tìm một cụm từ trong nội dung mọi sách tôi được xem, để tìm lại đoạn văn mà không nhớ ở sách nào.

- **AC1:** Given thư viện có EPUB chứa "Bà ngoại", When tôi tìm "ba ngoai" ở tab "Trong nội dung", Then kết quả có cuốn đó kèm đoạn trích tô đậm cụm từ.
- **AC1b (mới):** Given có sách chứa "bà ngoại" và sách chứa "ba ngoài", When tôi tìm "bà ngoại" (có dấu), Then sách khớp đúng dấu xếp trên.
- **AC2:** Given một kết quả, When tôi bấm vào, Then trình đọc mở đúng chương/trang và cuộn tới đoạn khớp.
- **AC3:** Given sách thuộc thư viện tôi không có quyền, Then sách đó không xuất hiện trong kết quả và không được tính vào tổng số kết quả.
- **AC4:** Given PDF ảnh quét không có lớp chữ (hoặc định dạng chưa hỗ trợ), Then hệ thống ghi trạng thái "chưa index được", không báo lỗi cho người dùng, và admin xem được danh sách này.
- **AC5:** Given sách mới tải lên, When xử lý xong, Then tìm được nội dung sách đó mà không cần thao tác thêm.
- **AC5b (mới):** Given file sách bị thay bằng bản khác hoặc sách bị xoá, Then kết quả tìm kiếm phản ánh bản mới / không còn sách đó.
- **AC5c (mới):** Given thư viện có sẵn trước khi bật tính năng, When admin chạy index lần đầu, Then thấy tiến độ, và nếu server khởi động lại giữa chừng thì job chạy tiếp từ chỗ dừng.
- **AC6:** Thời gian trả kết quả và dung lượng index: chưa chốt. Giả định để đo: p95 dưới 1 giây cho 1 trang kết quả trên khoảng 3 triệu đoạn. Ngưỡng thật chốt sau CS-00.

## 6. Chia task đề xuất (đã cập nhật, chưa tạo trên Jira)

| # | Task | Vai trò | Phụ thuộc |
|---|---|---|---|
| CS-00 (mới) | Spike đo: trích thử 300-500 sách thật (EPUB + PDF), đo số đoạn, dung lượng text + index GIN, thời gian trích, thời gian truy vấn | Atlas | - |
| CS-01 | Thiết kế kỹ thuật: bảng đoạn + bảng trạng thái index, cấu hình FTS, quy tắc dấu, luồng job/backfill, cách lưu vị trí EPUB/PDF, chọn thư viện trích PDF | Atlas | CS-00 |
| CS-02 | Trích văn bản EPUB/PDF/TXT + job index (tải lên, quét, backfill, re-index, xoá/chuyển sách) | BE (Forge) | CS-01 |
| CS-03 | API tìm nội dung: phân quyền, phân trang nhóm theo sách, đoạn trích | BE | CS-02 |
| CS-04 | Tab "Trong nội dung" + mở đúng vị trí trong trình đọc | FE (Pixel) | CS-03 (song song bằng dữ liệu giả), GD1-C01 |
| CS-04b (mới) | Màn hình admin: bật/tắt, tiến độ backfill, danh sách sách chưa index được | FE + BE | CS-02 |
| CS-05 | Review + kiểm thử: có/không dấu, phân quyền, re-index, hiệu năng theo số liệu CS-00 | Lens, Probe | CS-03, CS-04 |
| CS-06 | (Giai đoạn 2) Semantic: chọn mô hình, sidecar, embedding đoạn, RRF | Atlas + BE | Giai đoạn 1 xong + quyết định câu 3 |

Ước lượng giờ: chưa đưa, chờ CS-00/CS-01.

## 7. Liên quan
- GD1-C01..C05 (SCRUM-78..82): sửa tìm trong 1 cuốn đang mở. Task này tìm trên cả thư viện, nhưng **phụ thuộc** C01 cho việc nhảy tới đoạn khớp (AC2) và phải dùng chung quy tắc chuẩn hoá tiếng Việt với C01/C02.

## 8. Câu hỏi cần anh Peuin chốt

1. Làm Giai đoạn 1 (từ khoá) trước, Giai đoạn 2 (ngữ nghĩa) sau? (đề xuất: Có. Semantic chỉ nên quyết khi có số liệu từ giai đoạn 1.)
2. Thuộc Sprint nào? (đề xuất: CS-00 spike có thể nhét vào cuối S1 nếu còn chỗ vì nhỏ và giảm rủi ro; phần còn lại vào S2.)
3. Giai đoạn 2: mô hình local hay API ngoài? (đề xuất: local trong container sidecar như Kokoro; chấp nhận backfill chậm.)
4. Có cần OCR cho PDF ảnh quét không? (đề xuất: không trong đợt này.)
5. (mới) Định dạng nào trong đợt này? (đề xuất: EPUB, PDF có chữ, TXT; MOBI/AZW3/FB2 để sau.)
6. (mới) Tính năng bật mặc định hay admin tự bật theo thư viện? (đề xuất: admin tự bật, vì tốn dung lượng đĩa và CPU lúc backfill.)

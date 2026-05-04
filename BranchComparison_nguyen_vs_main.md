# Branch Comparison: `nguyen` vs `main`

> Tài liệu này mô tả toàn bộ thay đổi trong branch `nguyen` so với `main`.  
> Dùng để báo cáo với teammates về những gì đã được thêm/sửa/xóa.  
> Cập nhật: 2026-05-05 (lần 6)

---

## Tóm tắt nhanh

| Loại thay đổi | Số file |
|--------------|---------|
| File mới (frontend) | 9 |
| File mới (backend) | 2 |
| File bị xóa | 1 |
| File sửa đổi | 33 |
| **Tổng dòng thêm** | **+2136** |
| **Tổng dòng xóa** | **−2392** (chủ yếu do refactor, không mất tính năng) |

---

## 1. Backend — Những gì đã thay đổi

### 1.1 Socket.IO — Thêm session channel cho SINGLE player

**File:** [back-end/src/socket.js](back-end/src/socket.js)

Trước (main):
- Chỉ có `join_room_channel` / `leave_room_channel` cho online game.

Sau (nguyen):
- Thêm 2 event mới: `join_session_channel(sessionId)` và `leave_session_channel(sessionId)`.
- Client join vào room `session:{sessionId}` để nhận bot move update qua socket khi chơi SINGLE mode.

```
join_session_channel(sessionId) → socket.join(`session:${sessionId}`)
leave_session_channel(sessionId) → socket.leave(`session:${sessionId}`)
```

---

### 1.2 Game Service — Bot move async + Arena listing

**File:** [back-end/src/services/game.service.js](back-end/src/services/game.service.js)

**Thay đổi 1 — Bot move chạy async qua `setImmediate` và emit qua session channel:**

Trước (main): Bot move chạy đồng bộ trong `makeMove`, response phải chờ bot xong mới trả về.

Sau (nguyen):
- Sau khi lưu nước đi của player, emit ngay `session_updated` qua `session:{id}` channel.
- Bot move chạy qua `setImmediate` (async, không block response).
- Sau khi bot đi xong, emit thêm một `session_updated` nữa qua channel.
- Thêm hàm `emitSessionUpdatedById(sessionId, session)` để emit đúng channel.

**Thay đổi 2 — Arena: liệt kê phòng đang chờ:**

Thêm hàm `listWaitingRooms()` trả về danh sách các `GameRoom` có status `WAITING`:
```
roomCode, boardSize, hostMarker, hostUsername, createdAt
```

---

### 1.3 Repository & Service — Barrel index files

**File mới:** [back-end/src/repositories/index.js](back-end/src/repositories/index.js)  
**File mới:** [back-end/src/services/index.js](back-end/src/services/index.js)

Thêm barrel export để import gọn hơn trong các controller:
```js
// Trước
const userProfileService = require('../services/userProfileService');

// Sau
const { userProfile: userProfileService } = require('../services');
```

---

### 1.4 Game Repository — Thêm `findWaitingRooms()`

**File:** [back-end/src/repositories/gameRoom.repository.js](back-end/src/repositories/gameRoom.repository.js)

Thêm method `findWaitingRooms()` để query các room có `status: 'WAITING'`, populate `players[0].userId` để lấy `username` của host.

---

### 1.5 Router — Thêm route Arena

**File:** [back-end/src/router/roomRouter.js](back-end/src/router/roomRouter.js)

Thêm route mới:
```
GET /api/room/arena  →  listWaitingRoomsController
```

> **Lưu ý:** Route này đặt TRƯỚC `/:roomCode` để tránh conflict (Express match `/arena` thành roomCode).

---

### 1.6 Auth Middleware — Xóa file trùng lặp

**File bị xóa:** `back-end/src/middleware/auth.middleware.js`

File này có logic JWT giống hệt `middleware/jwtAuth.js`. Branch `nguyen` xóa bỏ để tránh duy trì 2 file làm cùng việc. Tất cả route đang dùng `jwtAuth.js` — không ảnh hưởng.

---

### 1.7 Auth DTO — Response an toàn cho user

**File:** [back-end/src/dtos/authDto.js](back-end/src/dtos/authDto.js)

`mapSafeUser()` kiểm soát chính xác những field nào được trả về client:

| Field | Có trong response? | Lý do |
|-------|--------------------|-------|
| `isPremium` | ✅ Có | Frontend cần để quyết định có cho phép replay moves không |
| `isActive` | ✅ Có | UI có thể hiển thị trạng thái tài khoản |
| `failedLogins` | ❌ Không | Internal security state — không lộ ra ngoài |
| `lockUntil` | ❌ Không | Internal security state — không lộ ra ngoài |
| `walletBalance` | ❌ Không | Không cần thiết ở mọi response |
| `passwordHash` | ❌ Không | Tuyệt đối không trả về |

> **Quan trọng:** `failedLogins` và `lockUntil` bị ẩn khỏi response nhưng **phải tồn tại trong schema** để cơ chế brute-force (1.8) hoạt động. Xem lỗi schema và cách fix ở **→ 1.10**.

---

### 1.8 Auth Service — Brute-force protection

**File:** [back-end/src/services/authService.js](back-end/src/services/authService.js)

```js
MAX_FAILED_LOGINS = 5      // block sau 5 lần fail
LOCK_DURATION_MS  = 60000  // trong vòng 60 giây
```

Flow:
1. Sai password → `failedLogins++`, lưu vào DB.
2. `failedLogins >= 5` → set `lockUntil = now + 60s`, reset `failedLogins = 0`.
3. Mọi login (kể cả đúng password) trong thời gian lock → 423 Locked.
4. Sau 60 giây, lock tự hết — lần login tiếp theo reset counter.

> **Lưu ý:** Cơ chế này hoàn toàn phụ thuộc vào `failedLogins` và `lockUntil` được persist xuống MongoDB. Schema `user.js` ban đầu thiếu 2 field này — Mongoose strict mode sẽ bỏ qua chúng khi save, khiến counter luôn bằng 0 sau mỗi request. **Xem fix ở → 1.10.**

---

### 1.9 UserProfile Controller — Simplify error handler

**File:** [back-end/src/controller/userProfileController.js](back-end/src/controller/userProfileController.js)

Gộp các nhánh if/else của `handleError()` thành ternary — không thay đổi logic, chỉ giảm dòng code.

---

### 1.10 Auth — User Schema fix (bug fix)

**File:** [back-end/src/models/user.js](back-end/src/models/user.js)

Schema ban đầu chỉ có 7 field. Thiếu 3 field mà `authService.js` cần để hoạt động đúng:

| Field thiếu | Dùng ở đâu | Hậu quả khi thiếu |
|-------------|-----------|-------------------|
| `isPremium` | `mapSafeUser()` trả về frontend; `ProfilePage` đọc để gate replay feature | Luôn `undefined` → replay moves không bao giờ hoạt động dù user là premium |
| `failedLogins` | Brute-force counter trong `authService.login()` | Counter không persist → lockout không hoạt động |
| `lockUntil` | Thời điểm hết lock trong `authService.login()` | Lock không persist → user có thể brute-force không giới hạn |

**Fix:**
```js
isPremium:    { type: Boolean, default: false },
failedLogins: { type: Number,  default: 0 },
lockUntil:    { type: Date,    default: null }
```

**Regression test thủ công (12 case, tất cả pass):**

| # | Test case | Kết quả kỳ vọng | Kết quả thực tế |
|---|-----------|-----------------|-----------------|
| 1 | Register — thiếu field | 400 "required" | ✅ |
| 2 | Register — password yếu (không có uppercase/number/special) | 400 password policy | ✅ |
| 3 | Register — country không hợp lệ | 400 "must be from allowed list" | ✅ |
| 4 | Register — username có space và `!` | 400 username regex | ✅ |
| 5 | Register hợp lệ | 201 + `isPremium: false` trong response | ✅ |
| 6 | Register trùng email | 409 | ✅ |
| 7 | Register trùng username | 409 | ✅ |
| 8 | Login bằng email | 200 + token | ✅ |
| 9 | Login bằng username | 200 + token | ✅ |
| 10 | Brute-force: lần thứ 5 sai → lock | 423 + `lockUntil` trong body | ✅ |
| 11 | Login đúng password khi đang bị lock | 423 bị chặn | ✅ |
| 12 | Gửi `isPremium: true` lúc register | 400 bị từ chối | ✅ |

---

## 2. Frontend — Những gì đã thay đổi

### 2.1 File mới hoàn toàn

#### `ArenaPage.jsx` — Trang Arena
**File:** [full-stack-group-assignment/src/pages/ArenaPage.jsx](full-stack-group-assignment/src/pages/ArenaPage.jsx)

Trang hiển thị danh sách các online room đang ở trạng thái `WAITING`. Features:
- Fetch từ `GET /api/room/arena` khi mount.
- Nút **Refresh** để tải lại.
- Mỗi room hiển thị: room code, host name, board size.
- Nút **Join** — nếu chưa login thì trigger `onRequireLogin` popup.

---

#### `ApiClient.js` — REST HTTP Helper Class
**File:** [full-stack-group-assignment/src/services/ApiClient.js](full-stack-group-assignment/src/services/ApiClient.js)

Class tập trung tất cả HTTP calls. Methods: `get()`, `post()`, `put()`, `patch()`, `delete()`.  
Tự động đính kèm JWT token từ localStorage vào header `Authorization: Bearer`.  
Tất cả methods trả về `{ data, status, headers }`.

---

#### `useRoomActions.js` — Hook xử lý room actions
**File:** [full-stack-group-assignment/src/hooks/useRoomActions.js](full-stack-group-assignment/src/hooks/useRoomActions.js)

Tách logic từ `CreateRoomForm.jsx` (~1000 dòng) ra hook riêng. Quản lý:
- `handlePlay()` — tạo SINGLE/LOCAL/ONLINE game
- `handleJoin()` — join room bằng code
- `handleStart()` — host start game
- `handlePlayAgain()` — request chơi lại
- States: `loading`, `error`, `infoMessage`, `resultData`, `showBoard`, `joinRoomCode`

---

#### `useGameDraft.js` — Hook quản lý game draft state
**File:** [full-stack-group-assignment/src/hooks/useGameDraft.js](full-stack-group-assignment/src/hooks/useGameDraft.js)

Tách state chọn game option ra khỏi `CreateRoomForm`:  
`gameMode`, `marker`, `boardSize`, `aiLevel`, `nextStarterRole`, `localPlayer2Name`, `localPlayer2Marker`, `boardStyleId`.

---

#### Profile Sub-components (4 file mới)
**Folder:** [full-stack-group-assignment/src/components/profile/](full-stack-group-assignment/src/components/profile/)

`ProfilePage.jsx` (~1128 dòng trong main) đã được tách thành 4 component con:

| File | Chức năng |
|------|-----------|
| `ProfileAvatarSection.jsx` | Upload / hiển thị avatar |
| `ProfileInfoForm.jsx` | Sửa email, username, country |
| `ProfilePasswordForm.jsx` | Đổi mật khẩu |
| `SessionHistoryPanel.jsx` | Xem lịch sử ván, filter, search, replay |

---

#### `utils/gameUtils.js` — Utility functions
**File:** [full-stack-group-assignment/src/utils/gameUtils.js](full-stack-group-assignment/src/utils/gameUtils.js)

- `toAssetUrl(path)` — build full URL cho avatar (prepend API_ROOT_URL).
- `toAlgebraicNotation(row, col, boardSize)` — chuyển `(0,0)` → `"A15"` (cột A-O, hàng 1-15).
- `computeWinningCells(moves, board, boardSize)` — tính 5 ô thắng để highlight.

---

#### `utils/profileUtils.js` — Profile utility functions
**File:** [full-stack-group-assignment/src/utils/profileUtils.js](full-stack-group-assignment/src/utils/profileUtils.js)

Các helper dùng trong `ProfilePage`: format date, map `gameType` frontend↔backend, filter sessions.

---

### 2.2 File đã sửa đổi lớn

#### `CreateRoomForm.jsx` — Refactor lớn (~1028 → ~200 dòng)
**File:** [full-stack-group-assignment/src/components/CreateRoomForm.jsx](full-stack-group-assignment/src/components/CreateRoomForm.jsx)

Toàn bộ logic và state đã chuyển vào `useRoomActions.js` và `useGameDraft.js`.  
`CreateRoomForm` giờ chỉ là UI orchestrator — render các sub-panel và truyền props.  
**Không mất tính năng nào.**

---

#### `ProfilePage.jsx` — Refactor lớn (~1128 → ~300 dòng)
**File:** [full-stack-group-assignment/src/pages/ProfilePage.jsx](full-stack-group-assignment/src/pages/ProfilePage.jsx)

Tương tự, logic đã chuyển vào 4 sub-components ở trên.

---

#### `GameBoard.jsx` — Thêm tính năng hiển thị
**File:** [full-stack-group-assignment/src/components/GameBoard.jsx](full-stack-group-assignment/src/components/GameBoard.jsx)

| Tính năng | Mô tả |
|-----------|-------|
| Highlight đường thắng | 5 ô thắng đổi màu vàng `#ffe066` + border `#f59e0b` |
| Winner animation | Banner thắng có animation `winnerPop` (keyframe trong `index.css`) |
| Avatar trong PlayerCard | `<img>` avatar của từng player hiển thị trong thẻ player info |
| Algebraic notation | Nước đi cuối hiển thị dạng `A15`, `B7`, v.v. trong infoBox |

---

#### `useRoomSocket.js` — Thêm single-player session channel
**File:** [full-stack-group-assignment/src/hooks/useRoomSocket.js](full-stack-group-assignment/src/hooks/useRoomSocket.js)

Trước: chỉ xử lý online room channel.  
Sau: nếu `gameType === 'SINGLE'`, join `session:{sessionId}` channel và lắng nghe `session_updated` để nhận bot move realtime.

---

#### `roomService.js` — Dùng ApiClient + thêm `getWaitingRooms()`
**File:** [full-stack-group-assignment/src/services/roomService.js](full-stack-group-assignment/src/services/roomService.js)

- Chuyển tất cả `fetch()` thủ công sang dùng `ApiClient`.
- Thêm `getWaitingRooms()` gọi `GET /api/room/arena`.

---

#### `userProfileService.js` — Dùng ApiClient
**File:** [full-stack-group-assignment/src/services/userProfileService.js](full-stack-group-assignment/src/services/userProfileService.js)

Chuyển tất cả calls sang `ApiClient` — không thay đổi API shape.

---

#### `App.jsx` — Thêm Arena view
**File:** [full-stack-group-assignment/src/App.jsx](full-stack-group-assignment/src/App.jsx)

Thêm `VIEWS.ARENA` và navigation đến `ArenaPage`.

---

#### `CreateGamePanel.jsx` — Thêm Player 2 name + board style
**File:** [full-stack-group-assignment/src/components/room/CreateGamePanel.jsx](full-stack-group-assignment/src/components/room/CreateGamePanel.jsx)

- Input field nhập tên Player 2 cho LOCAL mode.
- Dropdown chọn board style (Classic / Aurora / Contrast).

---

#### `index.css` — Thêm animation
**File:** [full-stack-group-assignment/src/index.css](full-stack-group-assignment/src/index.css)

```css
@keyframes winnerPop {
  /* scale up + fade in cho winner banner */
}
```

---

### 2.3 AuthForm — Hiển thị password requirements

**Files sửa đổi:**
- [full-stack-group-assignment/src/design/AuthForm.jsx](full-stack-group-assignment/src/design/AuthForm.jsx)
- [full-stack-group-assignment/src/design/AuthForm.css](full-stack-group-assignment/src/design/AuthForm.css)

Form register không hiển thị password policy trước khi submit — user phải đoán hoặc submit sai rồi mới biết. Fix: thêm hint text nhỏ ngay bên dưới input Password:

```
Min 8 chars · uppercase · number · special ($ # @ !)
```

Style `.auth-hint` thêm vào `AuthForm.css` — `font-size: 12px`, màu `#666`.

---

## 2.5 Thay đổi bổ sung (cập nhật lần 2)

### 2.5.1 Session History UI — Cải thiện layout (lần 3 — full rewrite)

**Files sửa đổi:**
- [full-stack-group-assignment/src/components/profile/SessionHistoryPanel.jsx](full-stack-group-assignment/src/components/profile/SessionHistoryPanel.jsx)
- [full-stack-group-assignment/src/pages/ProfilePage.jsx](full-stack-group-assignment/src/pages/ProfilePage.jsx)

**Vấn đề gốc:** `SessionHistoryPanel` (default export) chứa cả bảng lớn bên trong `leftPane` hẹp → bảng bị cắt, text bị wrap, filter không đủ chỗ.

**Giải pháp — tách thành 2 export:**

| Export | Vị trí render | Chứa gì |
|--------|---------------|---------|
| `default SessionHistoryPanel` | Cột trái (hẹp, sticky) | 3 recent session cards + nút "View All Sessions" |
| `export SessionTablePanel` | Full-width bên **dưới** grid 2 cột | Filter bar + pagination + bảng đầy đủ |

`ProfilePage.jsx` giờ render `SessionTablePanel` tách biệt bên dưới grid — có toàn bộ chiều rộng của card, không bị nhét trong cột trái nữa.

**Chi tiết `SessionHistoryPanel` (compact):**
- 3 recent cards dạng grid — mỗi card có badge màu kết quả (xanh Win / đỏ Lose / vàng Draw)
- Nút "View All Sessions" toggle `isViewAllOpen` tại `ProfilePage`

**Chi tiết `SessionTablePanel` (full-width):**
- Search input full-width hàng đầu
- Filter bar flexWrap: 2 date inputs + 3 dropdowns + nút Reset
- Pagination `‹ Prev | 1 / N | Next ›` hiển thị "Showing X–Y of Z"
- Bảng 7 cột với `minWidth` per cột, `minWidth: 600` tổng, `overflowX: auto`
- Zebra striping, kết quả tô màu chữ

---

### 2.5.2 Backend — Waiting Room tự xóa sau 2 tiếng

**Files sửa đổi:**
- [back-end/src/models/gameRoom.js](back-end/src/models/gameRoom.js) — thêm field `hostLastSeen: Date | null`
- [back-end/src/repositories/gameRoom.repository.js](back-end/src/repositories/gameRoom.repository.js) — thêm `findArenaRooms()`, `updateHostLastSeen(roomCode)`, `deleteExpiredWaitingRooms()`
- [back-end/src/services/game.service.js](back-end/src/services/game.service.js) — thêm `listArenaRooms()`, `cleanupExpiredWaitingRooms()`
- [back-end/src/controller/game.controller.js](back-end/src/controller/game.controller.js) — `listWaitingRoomsController` gọi `listArenaRooms` thay vì `listWaitingRooms`
- [back-end/src/index.js](back-end/src/index.js) — thêm `setInterval(runRoomCleanup, 15 min)` chạy ngay sau khi server khởi động

**Logic cleanup:**
```
Xóa room có status='WAITING' khi:
  - hostLastSeen === null VÀ createdAt < now - 2h  (host chưa bao giờ ping)
  - HOẶC hostLastSeen < now - 2h  (host đã biến mất hơn 2 tiếng)
```
Cleanup chạy mỗi 15 phút và một lần ngay khi server start.

---

### 2.5.3 Backend — Host presence tracking qua Socket heartbeat

**File:** [back-end/src/socket.js](back-end/src/socket.js)

Thêm event `host_heartbeat(roomCode)`:
- Client (host) emit event này định kỳ mỗi 60 giây khi đang ở lobby.
- Server cập nhật `room.hostLastSeen = now` trong DB.
- Một host có thể mở nhiều tab, mỗi tab đều tự emit heartbeat độc lập.

---

### 2.5.4 Frontend — Host heartbeat trong useRoomSocket

**File:** [full-stack-group-assignment/src/hooks/useRoomSocket.js](full-stack-group-assignment/src/hooks/useRoomSocket.js)

Thêm param `isHost: boolean`:
- Khi `isHost === true` và `roomCode` có giá trị: emit `host_heartbeat` ngay lập tức + mỗi 60 giây.
- `CreateRoomForm.jsx` truyền `isHost` (đã tính sẵn tại line 67) vào hook.

---

### 2.5.5 Arena — Dueling Room (phòng 2 người đang đấu)

**Files sửa đổi:**
- [back-end/src/repositories/gameRoom.repository.js](back-end/src/repositories/gameRoom.repository.js) — `findArenaRooms()` query cả `WAITING` và `PLAYING`
- [back-end/src/services/game.service.js](back-end/src/services/game.service.js) — `listArenaRooms()` trả về `roomType: 'WAITING' | 'DUELING'`, thêm `player2Username`
- [full-stack-group-assignment/src/pages/ArenaPage.jsx](full-stack-group-assignment/src/pages/ArenaPage.jsx) — tách thành 2 section: **Waiting Rooms** (nút Join) và **Dueling Rooms** (nút Spectate, màu đỏ/cam)
- [full-stack-group-assignment/src/services/roomService.js](full-stack-group-assignment/src/services/roomService.js) — thêm `getArenaRooms()`, `getRoom(roomCode)`

Dueling Room hiển thị: `hostUsername vs player2Username`, board size, nút Spectate màu amber.

---

### 2.5.6 Frontend — Spectator Mode (xem live game)

**File mới:** [full-stack-group-assignment/src/pages/SpectatorPage.jsx](full-stack-group-assignment/src/pages/SpectatorPage.jsx)

- Fetch room + session hiện tại khi mount.
- Join `room_channel` qua socket, lắng nghe `room_updated` và `session_updated` realtime.
- Render `GameBoard` với `readOnly={true}` — board không click được, không có nút Surrender.

**File sửa đổi:** [full-stack-group-assignment/src/components/GameBoard.jsx](full-stack-group-assignment/src/components/GameBoard.jsx)
- Thêm prop `readOnly: boolean` (default `false`).
- Khi `readOnly=true`: hiển thị banner "Spectating — view only", disable toàn bộ cell click, ẩn nút Surrender.

**File sửa đổi:** [full-stack-group-assignment/src/App.jsx](full-stack-group-assignment/src/App.jsx)
- Thêm `VIEWS.SPECTATE`, `spectateRoomCode` state, `handleSpectateRoom(roomCode)` function.
- Render `<SpectatorPage>` khi view = SPECTATE.
- Truyền `onSpectateRoom` prop vào `ArenaPage`.

---

### 2.5.7 Backend — Dueling Room tự đóng sau 2 tiếng không hoạt động

**Files sửa đổi:**
- [back-end/src/repositories/gameSession.repository.js](back-end/src/repositories/gameSession.repository.js) — thêm `findStalePlayingSessions(cutoffTime)`, `abortSession(sessionId)`
- [back-end/src/services/game.service.js](back-end/src/services/game.service.js) — thêm `cleanupStaleDuelingRooms()`
- [back-end/src/index.js](back-end/src/index.js) — `runRoomCleanup` gọi cả `cleanupStaleDuelingRooms`

**Logic:**
```
GameSession có { timestamps: true } → updatedAt tự cập nhật mỗi khi có nước đi mới.

Đóng Dueling Room khi:
  session.status = 'PLAYING'
  AND session.gameType = 'ONLINE'
  AND session.updatedAt < now - 2h

→ session: result='ABORT', status='FINISHED', endTime=now
→ room: status='CLOSED', currentSessionId=null, closedAt=now
```

Chạy mỗi 15 phút cùng với cleanup Waiting Rooms.

---

## 2.6 Backend — AI Complexity Refactor (2026-05-05)

**Files sửa đổi:**
- [back-end/src/services/game.service.js](back-end/src/services/game.service.js)
- [back-end/src/repositories/userProfile.repository.js](back-end/src/repositories/userProfile.repository.js)

Sau khi giáo viên chỉ ra nguy cơ crash với board size lớn, toàn bộ AI helper functions đã được refactor để loại bỏ allocation O(n²) không cần thiết. **Functionality không thay đổi** — output giống hệt, có regression test 24 case xác nhận.

### Thay đổi cụ thể

#### `findWinningMove` — O(k×n²) → O(k×n)
Trước: `cloneBoard(board)` tạo n×n array mới cho mỗi candidate cell.  
Sau: đặt marker trực tiếp lên board, đọc kết quả, xóa ngay (in-place + undo).

#### `findForkMove` — O(k²×n²) → O(1) allocations
Trước: 2 lớp `cloneBoard` lồng nhau — outer loop nhân inner loop, mỗi cặp (cell, nextCell) tạo 2 board clone.  
Sau: 2 lớp in-place mutation + undo. Xóa hoàn toàn tất cả `cloneBoard` calls bên trong.

#### `getPatternInsight` — O(n²) alloc/call → O(1)
Trước: `cloneBoard` cho mỗi candidate cell được score (gọi trong `scoreCandidateCell` → `getTopScoredCells`).  
Sau: in-place mutation + undo. Cũng refactor logic đọc board từ `tempBoard` → `board`.

#### `minimax` — O(15⁵ × n²) clones → O(depth × n) stack
Trước: mỗi node trong cây minimax gọi `cloneBoard` → với depth=5, 15 candidates: lên đến 759,375 board clones.  
Sau: in-place mutation trước khi gọi đệ quy, undo ngay sau khi nhận kết quả. Board object được tái sử dụng hoàn toàn.

```js
// Trước
const nextBoard = cloneBoard(board);
nextBoard[cell.rowIndex][cell.colIndex] = botMarker;
const result = minimax(nextBoard, depth - 1, ...);

// Sau
board[cell.rowIndex][cell.colIndex] = botMarker;
const result = minimax(board, depth - 1, ...);
board[cell.rowIndex][cell.colIndex] = '';
```

#### `evaluateBoardForMarker` — xóa toàn bộ intermediate arrays
Trước: `board.map((row) => row[c])` cho mỗi cột (n array mới/call) + `cells.slice(i, i + target)` cho mỗi window.  
Sau: `scoreWindow(getCell, offset)` đọc cells qua closure — zero array allocation.

Cũng xóa 2 helper functions `evaluateWindow` và `addLineScore` — logic được inline vào `scoreWindow`.

#### minimax cache key — compact encoding
Trước: `row.join('.')` → dùng dấu `.` giữa cells, `|` giữa rows → ~450 chars cho n=15.  
Sau: `CACHE_MARKER_MAP` encode mỗi cell = 1 ký tự số, không separator → ~228 chars. Key nhỏ hơn ~50%, Map lookup nhanh hơn.

#### `generateUniqueRoomCode` — bounded retry
Trước: `while (exists)` loop không có limit — vòng lặp vô hạn nếu DB lỗi giữa chừng.  
Sau: `for (let i = 0; i < 20; i++)` — sau 20 lần thất bại throw 503. Với 32⁶ ≈ 1 tỷ mã, 20 retries không bao giờ cạn trong thực tế.

#### `getSessionHistoryByUserId` — pagination
Trước: aggregate không có `$limit` — user có 5000 session → response vài chục MB.  
Sau: `{ $limit: 500 }` thêm vào pipeline trước `.exec()`.

### `cloneBoard` — removed entirely
Sau khi tất cả caller được chuyển sang in-place, `cloneBoard` không còn được gọi ở bất kỳ đâu → xóa luôn định nghĩa hàm.

### Bảng tóm tắt

| Function | Trước (allocation) | Sau (allocation) |
|---|---|---|
| `findWinningMove` | O(k × n²) | O(1) |
| `findForkMove` | O(k² × n²) | O(1) |
| `getPatternInsight` | O(n²) per scored cell | O(1) |
| `minimax` loop | O(15⁵ × n²) ≈ 170M ops | O(depth) frames |
| `evaluateBoardForMarker` | n + windows arrays/call | 0 |
| `generateUniqueRoomCode` | unbounded loop | max 20 DB queries |
| session history aggregate | unbounded result | capped 500 rows |

---

## 3. Tổng kết theo tính năng SRS

| Tính năng | Trạng thái sau branch `nguyen` |
|-----------|-------------------------------|
| Arena (4.3.1) | ✅ Done — Waiting Rooms + Dueling Rooms, Spectate live game |
| REST HTTP Helper (A.2.b) | ✅ Done — `ApiClient.js` |
| Bot move async/realtime (SINGLE) | ✅ Done — `setImmediate` + session channel |
| Highlight đường thắng (4.1.4) | ✅ Done — `computeWinningCells` + ô vàng |
| Winner animation (4.2.6) | ✅ Done — `winnerPop` keyframe |
| Avatar trong game (4.2.1) | ✅ Done — `<img>` trong PlayerCard |
| Profile componentized (A.3.a) | ✅ Done — 4 sub-components tách riêng |
| Session history (3.1.2, 3.3.1) | ✅ Done — `SessionHistoryPanel` với filter/search |
| DTO an toàn — không lộ field nhạy cảm (A.3.1) | ✅ Done — `mapSafeUser` ẩn `failedLogins`/`lockUntil`, giữ `isPremium` |
| Brute-force (2.2.1) | ✅ Done — MAX=5, LOCK=60s; schema fix ở 1.10 đảm bảo persist đúng |
| Dueling Room + Spectate (4.3.1 mở rộng) | ✅ Done — PLAYING rooms hiện trong Arena, `SpectatorPage.jsx` xem live |
| Waiting Room timeout 2h | ✅ Done — `hostLastSeen` + cleanup job 15 phút |
| Host presence tracking | ✅ Done — `host_heartbeat` socket event + `useRoomSocket` gửi mỗi 60s |
| Session History UI fix | ✅ Done — `SessionTablePanel` full-width bên dưới grid |
| Dueling Room auto-delete 2h | ✅ Done — `cleanupStaleDuelingRooms` qua `session.updatedAt` |
| Register UX + schema integrity | ✅ Done — password hint, `isPremium`/`failedLogins`/`lockUntil` vào schema |

---

## 4. Những gì CHƯA làm (còn trong backlog)

> Những item này vẫn chưa có trong cả `nguyen` lẫn `main`.

| # | Tính năng | Độ ưu tiên |
|---|-----------|-----------|
| 1 | Real-time chat trong game (4.3.2) | Medium |
| 2 | Replay interface Pause/Resume/Forward/Backward (4.3.3) | Medium |
| 3 | Algebraic notation trên trục board (cột/hàng labels) | Medium |
| 4 | LOCAL game yêu cầu login (4.1.1) | Easy fix |
| 5 | Email format validation (1.2.2) | Easy fix |
| 6 | Premium subscription flow + UI (5.1.1) | Hard |
| 7 | Admin interface — 5 requirements (6.x) | Hard |
| 8 | Cloud deployment (D.2.1) | Hard |
| 9 | Responsive design cho Profile/Admin | Medium |
| 10 | Hard AI chạy trên Worker Thread (không block event loop) | Hard |

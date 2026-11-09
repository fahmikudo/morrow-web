# Personal Second Brain --- Frontend MVP Blueprint

**Document:** Frontend MVP Blueprint\
**Version:** 1.0\
**Status:** Draft for implementation\
**Scope:** Frontend only; dummy data; interactive prototype

------------------------------------------------------------------------

## 1. Tujuan MVP

Membangun prototype frontend Personal Second Brain yang dapat
didemonstrasikan dan digunakan untuk menguji pengalaman utama produk
tanpa membutuhkan backend.

Prototype harus memungkinkan pengguna untuk:

-   Melihat ringkasan aktivitas hari ini.
-   Menangkap ide, catatan, dan task dengan cepat.
-   Mengelola task dan project.
-   Membuat dan membaca knowledge/notes.
-   Menemukan informasi melalui pencarian.
-   Mengakses aplikasi melalui desktop dan mobile.

**Prinsip produk:** *Capture quickly, organize naturally, find
everything easily.*

Fokus MVP adalah validasi UX dan alur interaksi, bukan integrasi
backend, AI sungguhan, atau sinkronisasi multi-device.

## 2. Prinsip dan keputusan desain

Keputusan arah produk yang menjadi dasar MVP:

-   **Product direction:** Personal Second Brain.
-   **Workspace model:** Hybrid Contextual Workspace --- overview
    aktivitas dan workspace terfokus untuk objek tertentu.
-   **Visual inspiration:** Craft + Linear + Notion, tanpa menyalin
    salah satunya.
-   **UI library:** HeroUI.
-   **Responsive approach:** mobile-first interaction, desktop-first
    workspace.
-   **Capture principle:** pengguna dapat menangkap informasi terlebih
    dahulu dan mengorganisasikannya kemudian.
-   **Simplicity:** tampilkan informasi sesuai konteks; jangan memenuhi
    layar dengan semua fitur sekaligus.
-   **AI:** hanya simulasi panel assistant pada prototype.

## 3. Scope MVP

MVP terdiri dari lima area utama.

### 3.1 Today --- Daily Overview

Tujuan: memberi gambaran singkat tentang hal-hal yang perlu diperhatikan
hari ini.

Fitur:

-   Ringkasan aktivitas hari ini.
-   Daftar task yang perlu diselesaikan.
-   Upcoming activities/events berbasis dummy data.
-   Recent notes.
-   Quick Capture.
-   Ringkasan project aktif bila relevan.

### 3.2 Inbox --- Quick Capture

Tujuan: menjadi tempat penampungan awal untuk informasi yang belum
diorganisasi.

Fitur:

-   Membuat item baru dengan cepat.
-   Mendukung tipe `note`, `task`, dan `idea`.
-   Melihat seluruh item yang belum diorganisasi.
-   Mengubah item Inbox menjadi Note atau Task.
-   Archive dan delete.
-   Menampilkan waktu pembuatan.

Item yang baru ditangkap masuk ke Inbox secara default. Pengguna tidak
diwajibkan menentukan kategori, project, atau tag saat capture.

### 3.3 Tasks --- Task Management

Tujuan: mengelola pekerjaan dan tindakan yang perlu dilakukan.

Fitur:

-   Task list.
-   Status: `todo`, `in_progress`, `done`.
-   Priority: `low`, `medium`, `high`.
-   Due date opsional.
-   Filter dan sorting.
-   Menghubungkan task ke project.
-   Create, edit, complete, dan delete task.

Untuk MVP, list view menjadi tampilan utama. Board view dapat
ditambahkan bila tidak memperlambat delivery.

### 3.4 Projects --- Project Workspace

Tujuan: menyediakan ruang sederhana untuk melihat pekerjaan yang
memiliki tujuan atau hasil tertentu.

Fitur:

-   Daftar project.
-   Project detail.
-   Description.
-   Status: `active`, `completed`, `archived`.
-   Progress berdasarkan task yang terhubung.
-   Daftar related tasks dan notes.
-   Create, edit, dan archive project.

### 3.5 Knowledge --- Notes & Knowledge Base

Tujuan: menyimpan informasi yang ingin dibaca, dikembangkan, dan
ditemukan kembali.

Fitur:

-   Notes list.
-   Rich text editor menggunakan TipTap.
-   Title dan content.
-   Tags sederhana.
-   Relasi ke project (opsional).
-   Search.
-   Create, edit, dan delete note.

Knowledge bukan sekadar kumpulan halaman untuk semua jenis data. Task
tetap menjadi Task, Project tetap menjadi Project, dan Note tetap
menjadi Note.

## 4. Fitur di luar scope MVP

Fitur berikut ditunda agar prototype tetap fokus:

-   Backend dan database server.
-   Authentication dan multi-user.
-   AI integration sungguhan.
-   Calendar integration.
-   Email, Google Drive, dan external integrations.
-   Real-time collaboration.
-   Advanced offline synchronization.
-   Native Android/iOS application.
-   People/Contacts management sebagai modul tersendiri.
-   Family dan Business management sebagai modul tersendiri.
-   Advanced database builder dan custom views.

Informasi Personal, Family, Professional, dan Business dapat
direpresentasikan melalui contoh dummy data, tags, atau project tanpa
membangun modul khusus pada tahap ini.

## 5. Navigasi dan application shell

### 5.1 Desktop

Gunakan persistent sidebar dengan navigasi utama:

1.  Today
2.  Inbox
3.  Tasks
4.  Projects
5.  Knowledge

Topbar menyediakan:

-   Universal Search.
-   Quick Capture.
-   Akses AI Assistant (simulasi).
-   User/profile menu (placeholder bila diperlukan).

Main workspace menampilkan halaman aktif. Contextual detail panel dapat
digunakan untuk detail ringan tanpa meninggalkan halaman utama.

### 5.2 Mobile

Gunakan bottom navigation dengan lima entry point:

1.  Today
2.  Inbox
3.  Quick Capture (aksi utama di tengah)
4.  Tasks
5.  Knowledge

Projects dapat diakses melalui Today, Tasks, atau menu navigasi
tambahan. Pastikan target sentuh cukup besar dan form tidak terasa
padat.

### 5.3 Responsive behavior

-   Desktop: sidebar persistent dan workspace lebar.
-   Tablet: sidebar dapat diciutkan.
-   Mobile: bottom navigation dan halaman full-screen.
-   Modal desktop dapat berubah menjadi bottom sheet atau full-screen
    dialog di mobile.
-   Detail panel desktop menjadi halaman detail atau drawer di mobile.

## 6. Interaksi yang wajib berfungsi

Prototype harus interaktif. Hindari halaman yang hanya berupa visual
statis.

  Interaksi            Perilaku yang diharapkan
  -------------------- --------------------------------------------
  Quick Capture        Membuat item baru di Inbox
  Complete Task        Mengubah status task
  Create Task          Membuka form dan menyimpan task
  Edit Task            Memperbarui data task
  Create Note          Membuka editor dan menyimpan note
  Edit Note            Menyimpan perubahan note
  Search               Mencari di seluruh dummy data yang relevan
  Filter               Memfilter task dan notes
  Open Project         Membuka project detail
  Link Task            Menghubungkan task ke project
  Archive Inbox Item   Mengeluarkan item dari Inbox aktif
  AI Assistant         Membuka panel dengan respons simulasi

Setiap aksi harus memberikan feedback yang jelas, misalnya toast,
perubahan status, atau pembaruan daftar.

## 7. Dummy data

Gunakan dataset yang realistis dan saling berhubungan. Jangan
menggunakan data acak yang tidak memiliki relasi.

Contoh konteks data:

-   **Personal:** membaca buku, personal finance review.
-   **Family:** persiapan family gathering.
-   **Professional:** Data Warehouse Platform.
-   **Business:** Sajiin product development.
-   **Knowledge:** Go architecture notes, meeting notes, product ideas.

### 7.1 Model data awal

``` ts
type InboxItem = {
  id: string;
  title: string;
  content?: string;
  type: "note" | "task" | "idea";
  createdAt: string;
  archivedAt?: string;
};

type Task = {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
};

type Project = {
  id: string;
  name: string;
  description?: string;
  status: "active" | "completed" | "archived";
  createdAt: string;
  updatedAt: string;
};

type Note = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  projectId?: string;
  createdAt: string;
  updatedAt: string;
};
```

Model ini merupakan model frontend untuk prototype, bukan keputusan
final domain/backend.

## 8. Technology stack

  -----------------------------------------------------------------------
  Layer                   Technology              Tanggung jawab
  ----------------------- ----------------------- -----------------------
  Framework               React + TypeScript      UI application

  Build tool              Vite                    Development dan build

  UI library              HeroUI                  Komponen UI dasar

  Styling                 Tailwind CSS v4         Layout dan styling

  Icons                   Lucide React            Iconography

  Routing                 React Router            Navigasi halaman

  Server-state simulation TanStack Query          Pola query/mutation
                                                  melalui mock service

  Client/UI state         Zustand                 State lintas komponen

  Forms                   React Hook Form + Zod   Form dan validasi

  Rich text               TipTap                  Knowledge editor

  Persistence             localStorage            Menyimpan perubahan
                                                  prototype

  Drag & Drop             dnd-kit                 Interaksi drag-and-drop
                                                  bila dibutuhkan

  PWA                     Vite PWA Plugin         Installability dan app
                                                  shell caching
  -----------------------------------------------------------------------

Catatan: PWA pada tahap prototype tidak berarti advanced offline
synchronization sudah tersedia. Fokusnya adalah pengalaman installable
dan caching dasar.

## 9. Prinsip arsitektur frontend

**UI tidak boleh bergantung langsung pada dummy data.**

Gunakan service/repository abstraction agar implementasi mock dapat
diganti dengan API backend di masa depan tanpa membongkar komponen UI.

Alur sederhana:

``` text
Page / Feature Components
          |
          v
      Hooks / Query
          |
          v
    Repository Interface
          |
          v
      Mock Repository
          |
          v
  Mock Dataset + localStorage
```

Ketika backend tersedia, repository dapat diarahkan ke API
implementation. Kontrak data dan perilaku UI dijaga tetap konsisten
sejauh memungkinkan.

### 9.1 State management

Gunakan pembagian tanggung jawab berikut:

-   **TanStack Query:** data yang dibaca/diubah melalui repository,
    termasuk simulasi query dan mutation.
-   **Zustand:** UI state lintas halaman seperti sidebar, panel
    assistant, command palette, dan modal global.
-   **Local component state:** state sementara yang hanya digunakan oleh
    satu komponen.
-   **localStorage:** persistensi data prototype agar perubahan tidak
    hilang saat browser refresh.

Hindari menyimpan salinan data yang sama di beberapa state store.

## 10. Struktur folder

``` text
src/
├── app/
│   ├── layouts/
│   ├── providers/
│   ├── router/
│   └── App.tsx
│
├── components/
│   ├── ui/
│   ├── layout/
│   └── shared/
│
├── features/
│   ├── today/
│   ├── inbox/
│   ├── tasks/
│   ├── projects/
│   ├── knowledge/
│   └── assistant/
│
├── mocks/
│   ├── data/
│   └── handlers/
│
├── services/
│   ├── repositories/
│   └── mock/
│
├── stores/
├── hooks/
├── lib/
├── types/
└── main.tsx
```

Pedoman:

-   `features/` berisi UI dan logic spesifik fitur.
-   `components/ui/` berisi wrapper atau komponen dasar yang konsisten
    dengan design system.
-   `components/layout/` berisi app shell, sidebar, topbar, dan bottom
    navigation.
-   `services/repositories/` berisi kontrak akses data.
-   `services/mock/` berisi implementasi repository untuk prototype.
-   `mocks/data/` berisi seed data.
-   `stores/` berisi global UI state.
-   `types/` berisi tipe lintas fitur yang memang digunakan bersama.

Jangan membuat abstraksi berlebihan. Tambahkan struktur hanya ketika ada
kebutuhan nyata.

## 11. HeroUI dan product components

Gunakan HeroUI sebagai UI foundation untuk komponen generik, misalnya:

-   Button
-   Input
-   Textarea
-   Dialog/Modal
-   Dropdown
-   Tooltip
-   Tabs
-   Avatar
-   Chip/Badge
-   Toast atau feedback component sesuai dukungan versi yang digunakan

Bangun product-specific components sendiri:

-   App Sidebar
-   Mobile Bottom Navigation
-   Global Search
-   Quick Capture
-   Command Palette
-   Task List
-   Project Card dan Project Detail
-   Knowledge Editor
-   Contextual Detail Panel
-   AI Assistant Panel

Tujuannya adalah menjaga identitas produk dan menghindari ketergantungan
berlebihan pada tampilan default UI library.

## 12. Urutan implementasi

### Phase 1 --- Foundation & App Shell

Deliverables:

-   Setup React, TypeScript, dan Vite.
-   Setup HeroUI dan Tailwind CSS v4.
-   Global design tokens dan typography.
-   App shell desktop.
-   Mobile navigation.
-   Routing.
-   Global UI state.
-   Repository interface dan mock repository.
-   Seed dummy data.

### Phase 2 --- Today & Inbox

Deliverables:

-   Today dashboard.
-   Quick Capture.
-   Inbox list.
-   Create/edit item.
-   Convert item menjadi Note atau Task.
-   Archive dan delete.
-   Persistensi localStorage.

### Phase 3 --- Tasks & Projects

Deliverables:

-   Task list.
-   Create/edit task.
-   Status dan priority.
-   Due date.
-   Filter dan sorting.
-   Project list dan detail.
-   Relasi task-project.
-   Progress project.

### Phase 4 --- Knowledge & Polish

Deliverables:

-   Knowledge list.
-   TipTap editor.
-   Tags.
-   Relasi note-project.
-   Global search.
-   AI Assistant mock panel.
-   Responsive refinement.
-   PWA manifest dan caching dasar.
-   Empty states, loading states, error states, dan feedback interaksi.

## 13. Acceptance criteria

Prototype dapat dianggap memenuhi MVP apabila:

### Application shell

-   [ ] Navigasi utama berfungsi.
-   [ ] Layout desktop dan mobile dapat digunakan.
-   [ ] Active navigation state terlihat jelas.
-   [ ] Quick Capture dapat diakses dari area utama aplikasi.

### Inbox

-   [ ] Pengguna dapat membuat item.
-   [ ] Item baru muncul di Inbox.
-   [ ] Pengguna dapat mengubah dan mengarsipkan item.
-   [ ] Item dapat dikonversi menjadi Note atau Task.

### Tasks & Projects

-   [ ] Pengguna dapat membuat, mengubah, dan menghapus task.
-   [ ] Status dan priority dapat diubah.
-   [ ] Task dapat dihubungkan ke project.
-   [ ] Project detail menampilkan task terkait dan progress.

### Knowledge

-   [ ] Pengguna dapat membuat dan mengubah note.
-   [ ] Editor mendukung format rich text dasar.
-   [ ] Tags dapat ditampilkan dan digunakan untuk penyaringan.
-   [ ] Note dapat dihubungkan ke project.

### Search & persistence

-   [ ] Search menemukan data dummy dari beberapa modul.
-   [ ] Filter bekerja sesuai kriteria.
-   [ ] Perubahan data tetap tersedia setelah refresh melalui
    localStorage.

### Quality

-   [ ] Tidak ada tombol utama yang inert.
-   [ ] Aksi memberikan feedback.
-   [ ] Empty state tersedia.
-   [ ] Tampilan tetap usable pada viewport mobile.
-   [ ] Tidak ada ketergantungan pada backend.

## 14. Risiko dan perhatian teknis

1.  **Rich text editor:** TipTap dapat berkembang menjadi pekerjaan
    tersendiri. Batasi toolbar dan fitur editor pada kebutuhan MVP.
2.  **Local persistence:** localStorage cukup untuk prototype, tetapi
    bukan pilihan final untuk data besar atau offline-first production.
3.  **Mock repository:** jangan melewatkan lapisan repository hanya
    karena belum ada backend.
4.  **PWA compatibility:** uji installability dan perilaku PWA pada
    browser desktop, Android, dan iOS yang menjadi target.
5.  **Responsive interaction:** jangan sekadar mengecilkan desktop
    layout; desain ulang interaksi mobile seperti detail panel, modal,
    dan capture.
6.  **Scope control:** hindari menambahkan modul People, Calendar, AI
    integration, atau advanced views sebelum lima area inti stabil.

## 15. Definition of Done

Frontend MVP selesai ketika lima modul utama --- Today, Inbox, Tasks,
Projects, dan Knowledge --- dapat didemonstrasikan dalam satu alur yang
koheren, seluruh interaksi inti berjalan menggunakan dummy data,
perubahan tersimpan di browser, dan layout dapat digunakan pada desktop
maupun mobile.

**Target produk:** prototype yang terasa seperti aplikasi nyata dan
cukup matang untuk mendapatkan feedback UX sebelum backend dan integrasi
AI dibangun.

# UrbanShield Admin Panel — Complete Design Specification

> A comprehensive design system reference for the entire admin interface, from landing page through dashboard.

---

## Table of Contents
1. [Design System Foundations](#1-design-system-foundations)
2. [Landing Page (AdminLogin)](#2-landing-page-adminlogin)
3. [Authentication Forms](#3-authentication-forms)
4. [Dashboard Shell](#4-dashboard-shell)
5. [Dashboard Views](#5-dashboard-views)
6. [Component Library](#6-component-library)
7. [Responsive Behavior](#7-responsive-behavior)

---

## 1. Design System Foundations

### Color Palette

#### Dark Theme (Primary)
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0a0a0f` | Main app background |
| `--bg-secondary` | `#111118` | Cards, panels, sidebar |
| `--bg-tertiary` | `#1a1a24` | Inputs, table rows, hover states |
| `--bg-elevated` | `#22222e` | Modals, drawers, dropdowns |
| `--border-subtle` | `rgba(255,255,255,0.06)` | Dividers, card borders |
| `--border-default` | `rgba(255,255,255,0.1)` | Input borders, table borders |
| `--border-focus` | `#6366f1` | Focus rings, active states |
| `--text-primary` | `#fafafa` | Headings, primary text |
| `--text-secondary` | `#a1a1aa` | Body text, descriptions |
| `--text-tertiary` | `#71717a` | Placeholders, disabled |
| `--text-muted` | `#52525b` | Timestamps, meta info |

#### Accent Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--accent-primary` | `#6366f1` | Primary buttons, links, active nav |
| `--accent-success` | `#10b981` | Success states, resolved status |
| `--accent-warning` | `#f59e0b` | Warnings, pending status |
| `--accent-danger` | `#ef4444` | Errors, critical alerts, delete |
| `--accent-info` | `#3b82f6` | Info badges, neutral highlights |
| `--accent-purple` | `#8b5cf6` | Secondary accent |

#### Light Theme
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#ffffff` | Main background |
| `--bg-secondary` | `#f8f9fc` | Cards, panels |
| `--bg-tertiary` | `#f0f1f5` | Inputs, table rows |
| `--border-subtle` | `#e4e4e7` | Dividers |
| `--border-default` | `#d4d4d8` | Input borders |
| `--text-primary` | `#18181b` | Primary text |
| `--text-secondary` | `#52525b` | Body text |
| `--text-tertiary` | `#a1a1aa` | Placeholders |

### Typography

```css
/* Font Stack */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Scale */
--text-xs: 11px;    /* Labels, badges, timestamps */
--text-sm: 12px;    /* Table cells, descriptions */
--text-base: 14px;  /* Body text, inputs */
--text-md: 16px;    /* Emphasized body */
--text-lg: 18px;    /* Card titles */
--text-xl: 20px;    /* Section headings */
--text-2xl: 24px;   /* Page titles */
--text-3xl: 32px;   /* Hero headings */

/* Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Letter Spacing */
--tracking-tight: -0.02em;  /* Headings */
--tracking-normal: 0;       /* Body */
--tracking-wide: 0.05em;      /* Labels, uppercase */
```

### Spacing Scale

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

### Border Radius

```css
--radius-sm: 6px;    /* Small buttons, tags */
--radius-md: 8px;    /* Inputs, cards */
--radius-lg: 12px;   /* Modals, panels */
--radius-xl: 16px;   /* Large cards */
--radius-full: 9999px; /* Pills, avatars */
```

### Shadows (Dark Mode)

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
--shadow-md: 0 4px 12px rgba(0,0,0,0.4);
--shadow-lg: 0 8px 24px rgba(0,0,0,0.5);
--shadow-glow-primary: 0 0 20px rgba(99,102,241,0.3);
```

---

## 2. Landing Page (AdminLogin)

### Layout Structure
**Split-screen layout**: 52% left panel (dark branded), 48% right panel (clean light)

### Left Panel — Dark Branded Side

#### Background Layering (z-index stack)
1. **Base**: Solid `#06060f`
2. **Gradient Orbs** (blur 80px, opacity 0.22-0.14):
   - Top-left: Purple `#6366f1`
   - Bottom-right: Green `#10b981`
   - Animated floating (12s-15s ease-in-out loops)
3. **Dot Grid Pattern**: 
   - `radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)`
   - Size: 32px
   - Masked to fade at edges
4. **Floating Particles**: 8 white/blue/green/yellow dots (2-4px), floating upward animation
5. **Radar Effect** (center):
   - 3 concentric rings (purple, fading opacity)
   - Rotating conic-gradient sweep
   - 4 pulsing location pins at corners

#### Content Stack (top to bottom)
```
┌─────────────────────────────┐
│ [Logo] UrbanShield          │  ← Brand section
│ Admin Portal                │
├─────────────────────────────┤
│ ⚡ Bohol Command Center      │  ← Live badge (indigo pill)
│                             │
│ Protect your                │
│ community                   │  ← Hero headline
│ in real-time.               │    (32px bold, gradient accent)
│                             │
│ Monitor, analyze...         │  ← Subtext (14px muted)
├─────────────────────────────┤
│ [STATS GRID]                │  ← 4-column stat cards
│ 42 Total │ 12 Pending │     │    (color-coded bottom bars)
│ 8 Resolved │ 156 Users │   │
├─────────────────────────────┤
│ 📱 Get the mobile app       │  ← Download section
│ [QR Code]  [Download APK]   │    (phone icon, QR, button)
├─────────────────────────────┤
│ © 2025 Bohol Command        │  ← Footer
└─────────────────────────────┘
```

#### Live Badge Spec
```css
background: rgba(129, 140, 248, 0.08);
border: 1px solid rgba(129, 140, 248, 0.2);
border-radius: 999px;
padding: 4px 12px 4px 8px;
font-size: 10px;
font-weight: 700;
letter-spacing: 0.08em;
text-transform: uppercase;
color: #818cf8;
/* Contains: pulsing green dot + "Bohol Command Center" */
```

#### Stats Grid Spec
- Layout: CSS Grid, 4 columns, 1px gap
- Card: `rgba(255,255,255,0.02)` background, no border-radius (seamless)
- Value: 22px bold white
- Label: 10px uppercase muted
- Accent bar at bottom: 2px height, color per stat (red/yellow/green/blue)

### Right Panel — Clean Form Side

#### Container
- Background: `#ffffff` (light) / `#0a0a0f` (dark)
- Max-width form: 400px, centered
- Padding: 3rem

#### Form Elements
**Segmented Toggle (Login/Signup)**
```css
background: rgba(0,0,0,0.04);
border-radius: 10px;
padding: 4px;
/* Active tab: white bg, shadow-sm, text-primary */
/* Inactive: transparent, text-secondary */
```

**Input Fields**
```css
background: rgba(0,0,0,0.02);
border: 1px solid rgba(0,0,0,0.08);
border-radius: 10px;
padding: 12px 14px;
/* Focus: border-accent-primary, subtle glow */
/* Icon left: Mail/Lock, 16px, muted */
/* Icon right: Eye/EyeOff for password */
```

**Primary Button**
```css
background: linear-gradient(135deg, #6366f1, #4f46e5);
color: white;
border-radius: 10px;
padding: 12px;
font-weight: 600;
/* Hover: slight lift, increased shadow */
/* Loading: spinner inside */
```

**Secondary Actions**
- "Forgot password?" — right aligned, accent color, small text
- "Back to login" — left arrow icon + text

#### Error/Success States
- Error: Red border on input + red text below
- Success: Green check icon + "Success" message
- Toast notifications slide in from top

---

## 3. Authentication Forms

### Login Form
```
┌─────────────────────────────┐
│  ← Back                     │
│                             │
│  [Login] [Sign Up]          │  ← Segmented control
│                             │
│  ┌─────────────────────┐    │
│  │ ✉️  Email           │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ 🔒 Password    👁️   │    │
│  └─────────────────────┘    │
│  Forgot password?      →    │
│                             │
│  ┌─────────────────────┐    │
│  │     Sign In         │    │  ← Primary button
│  └─────────────────────┘    │
└─────────────────────────────┘
```

### Signup Form (Expanded)
```
┌─────────────────────────────┐
│  Full Name                  │
│  Email                      │
│  ┌─────────────────────┐    │
│  │ Suggested: @gmail   │    │  ← Domain suggestions dropdown
│  └─────────────────────┘    │
│  Password                   │
│  Confirm Password           │
│  ┌─────────────────────┐    │
│  │ 📋 Terms checkbox   │    │
│  └─────────────────────┘    │
│  [Create Account]           │
└─────────────────────────────┘
```

### Forgot Password Flow
1. Enter email → "Send Reset Code" button
2. Check your email message
3. Enter 6-digit code + new password
4. Success → redirect to login

---

## 4. Dashboard Shell

### Overall Layout
```
┌─────────────────────────────────────────────────────────────┐
│  🛡️ UrbanShield    Dashboard  Live Map  Posts  Users  ...  │  ← Header (mobile: hamburger)
├──────────┬──────────────────────────────────────────────────┤
│          │  🔍 Search posts              🔔  ⚫  ☀️  👤   │
│          ├──────────────────────────────────────────────────┤
│          │                                                  │
│  SIDEBAR │              MAIN CONTENT AREA                   │
│          │                                                  │
│  Collapsible│                                            │
│  (240px → 64px) │                                        │
│          │                                                  │
│  [Nav]   │              [Active Tab Content]                │
│  [User]  │                                                  │
│  [Logout]│                                                  │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

### Sidebar Design

**Collapsed State (64px)**
- Icons only, centered
- Tooltip on hover showing label

**Expanded State (240px)**
```
┌─────────────────┐
│  ☰  [Logo]      │  ← Toggle + Brand
├─────────────────┤
│  GENERAL        │  ← Section label (uppercase, muted)
│  📊 Dashboard   │
│  🗺️ Live Map    │  ← Active: accent left border, lighter bg
│  ⚠️ Posts       │
│  👥 Users       │
│  🛡️ Responders  │
├─────────────────┤
│  OTHER          │
│  📢 Announcements│
│  ⚙️ Settings    │
├─────────────────┤
│  ┌───┐ Name     │  ← User mini-profile
│  │ A │ Admin    │    (click → Settings)
│  └───┘          │
│  🚪 Logout      │
└─────────────────┘
```

**Nav Item Spec**
```css
/* Default */
padding: 10px 14px;
border-radius: 8px;
color: #a1a1aa;

/* Hover */
background: rgba(255,255,255,0.04);
color: #fafafa;

/* Active */
background: rgba(99,102,241,0.1);
color: #818cf8;
border-left: 3px solid #6366f1;
```

### Header Design

```css
height: 64px;
background: var(--bg-secondary);
border-bottom: 1px solid var(--border-subtle);
padding: 0 24px;
display: flex;
align-items: center;
justify-content: space-between;
```

**Left Side**
- Mobile menu button (hamburger)
- Page title (24px bold, dark: white, light: black)

**Right Side**
- Search bar: 280px width, icon left, clear button right
- Notification bell: icon + red badge dot with count
- Real-time indicator: green/gray pulsing dot
- Theme toggle: Sun/Moon icon button
- Admin avatar: 36px circle, click → profile menu

### Main Content Area
```css
background: var(--bg-primary);
padding: 24px;
min-height: calc(100vh - 64px);
overflow-y: auto;
```

---

## 5. Dashboard Views

### A. Dashboard (Overview Tab)

**Layout: 2-column grid**
```
┌─────────────────────────────────────────┐
│  [STAT CARD]  [STAT CARD]  [STAT CARD] │  ← Top row: 3 KPIs
│  Total Posts   Pending    Resolved   │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │  📈 Incident Trends (Line)      │    │  ← Full width
│  │  Last 6 months                  │    │
│  └─────────────────────────────────┘    │
├─────────────────────────────────────────┤
│  ┌──────────────┐  ┌────────────────┐   │
│  │ 📊 By Type   │  │ ⏱️ Response    │   │
│  │   (Pie)      │  │    Time Stats  │   │
│  └──────────────┘  └────────────────┘   │
└─────────────────────────────────────────┘
```

**Stat Card Design**
```css
background: var(--bg-secondary);
border: 1px solid var(--border-subtle);
border-radius: 12px;
padding: 20px;
/* Icon top-left: 40px circle with colored background */
/* Number: 32px bold */
/* Label: 12px uppercase muted */
/* Change indicator: +12% ▲ green or -5% ▼ red */
```

**Chart Styling**
- Line chart: Gradient fill under line (accent to transparent)
- Pie chart: Custom palette matching status colors
- Grid: Dashed, very subtle
- Tooltip: Dark elevated card with white text

### B. Live Map Tab

**Full-bleed map with overlay panels**
```
┌────────────────────────────────────────────┐
│  ┌────────┐                               │
│  │Filter ▼│  [Map fills entire area]      │
│  └────────┘                               │
│         📍         📍                      │
│              📍                              │
│  ┌────────────────┐                        │
│  │ Recent Posts   │  ← Bottom-left overlay│
│  │ • Post 1       │    (collapsible)        │
│  │ • Post 2       │                        │
│  └────────────────┘                        │
└────────────────────────────────────────────┘
```

**Map Pins**
- Pending: Orange `#f59e0b`
- In Action: Blue `#3b82f6`
- Resolved: Green `#10b981`
- Critical: Red `#ef4444`
- Size: 24px default, 32px on hover
- Popup card on click: Title, location, status badge

### C. Posts (IncidentModeration) Tab

**Filter Bar**
```
┌────────────────────────────────────────────────────────────┐
│  Status: [All ▼] [Pending] [In Action] [Resolved]       │
│  Sort: [Newest ▼]  [Refresh 🔄]  [Export 📥]             │
└────────────────────────────────────────────────────────────┘
```

**Posts Table**
```css
table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

th {
  padding: 12px 16px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-tertiary);
  border-bottom: 1px solid var(--border-default);
  text-align: left;
}

td {
  padding: 16px;
  border-bottom: 1px solid var(--border-subtle);
}

tr:hover td {
  background: var(--bg-tertiary);
}
```

**Columns**
1. **ID** — Monospace, truncated (#8f2d...)
2. **Title** — Bold, description below (muted)
3. **Location** — 📍 Icon + location text
4. **Category** — Colored tag/badge
5. **Status** — Status pill badge
6. **Date** — Relative time ("2 hours ago")
7. **Actions** — View 👁️, Edit ✏️, Delete 🗑️

**Status Badges**
```css
/* Pending */
background: rgba(245, 158, 11, 0.1);
color: #f59e0b;
border: 1px solid rgba(245, 158, 11, 0.2);
border-radius: 999px;
padding: 4px 10px;
font-size: 11px;
font-weight: 600;
```

**Detail Modal**
```
┌─────────────────────────────────────────┐
│  ×  Post Details              [Status ▼]│
├─────────────────────────────────────────┤
│  📷 [Image Gallery]                     │
├─────────────────────────────────────────┤
│  Title: Suspicious Activity             │
│  Location: Tagbilaran City              │
│  Reported by: John Doe                  │
│  Date: Mar 28, 2025 at 2:30 PM        │
├─────────────────────────────────────────┤
│  Description:                           │
│  [Full text here...]                    │
├─────────────────────────────────────────┤
│  🗺️ Mini Map Location                   │
├─────────────────────────────────────────┤
│  Actions:                               │
│  [Assign Responder] [Mark Resolved] [Delete]│
└─────────────────────────────────────────┘
```

### D. Users Tab

**Similar table layout to Posts**

**Columns**
1. Avatar + Name (with verification badge ✓)
2. Email
3. User Type (pill: Admin, User, Government, Responder)
4. Verification Status (verified/pending badge)
5. Joined Date
6. Actions: View, Verify, Suspend

**Verification Badge**
- Verified: Green checkmark in circle
- Pending: Gray clock icon
- Suspended: Red X icon

### E. Responders Tab

**Card Grid Layout**
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  ┌───────┐  │ │  ┌───────┐  │ │  ┌───────┐  │
│  │   👤  │  │ │  │   👤  │  │ │  │   👤  │  │
│  └──┬────┘  │ │  └──┬────┘  │ │  └──┬────┘  │
│     ✓       │ │     ✓       │ │     ⏳      │
│  John Doe   │ │  Jane Smith │ │  Pending... │
│  Police     │ │  Fire Dept  │ │  ...        │
│  📞 Call    │ │  📞 Call    │ │  [Verify]   │
└─────────────┘ └─────────────┘ └─────────────┘
```

**Responder Card**
- Avatar: 64px circle, initials or image
- Name: 16px semibold
- Department: 13px muted
- Status badge: top-right of avatar
- Action buttons at bottom

### F. Announcements Tab

**Two-pane layout**
```
┌──────────────────┬────────────────────────────────────────┐
│  + New           │  [Announcement Cards Grid]             │
│                  │                                        │
│  Filters         │  ┌──────────┐ ┌──────────┐            │
│  [All]           │  │ ⚠️       │ │ 📢       │            │
│  [Active]        │  │ Warning  │ │ Info     │            │
│  [Expired]       │  │          │ │          │            │
│                  │  └──────────┘ └──────────┘            │
│                  │                                        │
└──────────────────┴────────────────────────────────────────┘
```

**Announcement Card**
```css
/* Alert level indicator at top */
border-top: 3px solid var(--alert-color);
/* Critical: #ef4444, Warning: #f59e0b, Info: #3b82f6, Emergency: #dc2626 */

background: var(--bg-secondary);
border-radius: 12px;
padding: 20px;
```

**Card Contents**
- Alert badge (colored pill with icon)
- Title (18px bold)
- Content preview (2 lines, fade out)
- Date + "X days left"
- Edit/Delete actions (hover reveal)

**Create/Edit Drawer** (slides from right)
```
┌────────────────────────────┐
│  ×  New Announcement       │
├────────────────────────────┤
│  Alert Level:              │
│  [Info] [Warning] ⚠️ [Crit]│  ← Button group with colors
│                            │
│  Title *                   │
│  ┌──────────────────────┐  │
│  │                      │  │
│  └──────────────────────┘  │
│                            │
│  Content *                 │
│  ┌──────────────────────┐  │
│  │                      │  │  ← Textarea
│  │                      │  │
│  └──────────────────────┘  │
│                            │
│  Affected Areas            │
│  ┌──────────────────────┐  │
│  │ Barangay Tubigon...  │  │
│  └──────────────────────┘  │
│                            │
│  Action Items              │
│  1. ┌──────────────────┐   │
│     │ Stay indoors     │   │  ← Dynamic list
│  + Add step                │
│                            │
│  [Publish] [Save Draft]    │
└────────────────────────────┘
```

### G. Settings Tab

**Sub-tabs: General | Invitations**

**General Settings**
```
┌─────────────────────────────────────────────────────┐
│  Profile Picture                                    │
│  ┌────┐  [Upload New] [Remove]                     │
│  │ 👤 │                                             │
│  └────┘                                             │
├─────────────────────────────────────────────────────┤
│  Full Name                                          │
│  ┌──────────────────────────────────────────────┐   │
│  │ John Doe                                       │   │
│  └──────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│  Email                                              │
│  ┌──────────────────────────────────────────────┐   │
│  │ john@example.com                             │   │
│  └──────────────────────────────────────────────┘   │
│  [Change Email]                                     │
├─────────────────────────────────────────────────────┤
│  Password                                           │
│  Current: ┌──────────────────────────────────┐     │
│  New:     ┌──────────────────────────────────┐     │
│  Confirm: ┌──────────────────────────────────┐     │
│  [Update Password]                                 │
├─────────────────────────────────────────────────────┤
│  Preferences                                        │
│  [☀️/🌙]  Dark Mode                    [Toggle]     │
└─────────────────────────────────────────────────────┘
```

**Invitations Sub-tab**
```
┌─────────────────────────────────────────────────────┐
│  Invitation Codes                          [+ Generate]
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐│
│  │ Code: ABC12345      Status: ● Active            ││
│  │ Created: Mar 28    Expires: Apr 4              ││
│  │                                    [Copy] [Revoke]│
│  └─────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────┐│
│  │ Code: XYZ78901      Status: ✓ Used by Jane     ││
│  │ Created: Mar 25    Used: Mar 27                ││
│  │                                    [View]      ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

---

## 6. Component Library

### Buttons

**Primary Button**
```css
.btn-primary {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: 600;
  transition: all 0.2s;
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99,102,241,0.4);
}
```

**Secondary Button**
```css
.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
}
```

**Danger Button**
```css
.btn-danger {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}
```

**Ghost Button** (icon only)
```css
.btn-ghost {
  background: transparent;
  padding: 8px;
  border-radius: 8px;
}
.btn-ghost:hover {
  background: rgba(255,255,255,0.05);
}
```

### Inputs

```css
.input {
  width: 100%;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  padding: 10px 12px;
  color: var(--text-primary);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
  outline: none;
}
.input::placeholder {
  color: var(--text-tertiary);
}
```

### Cards

```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 20px;
}
.card-hover:hover {
  border-color: var(--border-default);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
```

### Modals / Drawers

**Modal Overlay**
```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
```

**Modal Content**
```css
.modal {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
}
.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-subtle);
}
.modal-body {
  padding: 24px;
  overflow-y: auto;
}
.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
```

**Drawer (Slide-in)**
```css
.drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 480px;
  max-width: 100%;
  height: 100vh;
  background: var(--bg-elevated);
  border-left: 1px solid var(--border-default);
  z-index: 1001;
  transform: translateX(100%);
  transition: transform 0.3s ease;
}
.drawer.open {
  transform: translateX(0);
}
```

### Badges / Tags

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}
.badge-success { background: rgba(16,185,129,0.1); color: #10b981; }
.badge-warning { background: rgba(245,158,11,0.1); color: #f59e0b; }
.badge-danger  { background: rgba(239,68,68,0.1); color: #ef4444; }
.badge-info    { background: rgba(59,130,246,0.1); color: #3b82f6; }
```

### Tooltips

```css
.tooltip {
  position: absolute;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--text-secondary);
  z-index: 100;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
}
.tooltip-trigger:hover .tooltip {
  opacity: 1;
}
```

### Toasts / Notifications

```css
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: slideIn 0.3s ease;
  z-index: 2000;
}
.toast-success { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #10b981; }
.toast-error   { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; }

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

---

## 7. Responsive Behavior

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile Adaptations

**Landing Page**
- Stack: Left panel (full width) on top, right panel below
- Reduce padding: 1.5rem
- Stats: 2x2 grid instead of 4 columns
- Hide decorative particles/orbs for performance

**Dashboard**
- Sidebar: Hidden by default, slide-in overlay via hamburger
- Header: Search collapses to icon-only, expands on click
- Stats: 2 columns
- Tables: Horizontal scroll with sticky first column
- Cards: Full width, stack vertically
- Modals: Full screen with reduced padding
- Drawer: Full width (100vw)

### Tablet Adaptations
- Sidebar: Collapsed by default (64px), expands on hover
- Stats: 2 or 4 columns depending on content
- Charts: Maintain 2-column layout with tighter padding

---

## Implementation Notes

### CSS Architecture
```
styles/
├── variables.css      /* Theme tokens */
├── base.css          /* Reset, typography */
├── components.css    /* Reusable components */
├── layouts.css       /* Grid, flex layouts */
└── utilities.css     /* Helper classes */
```

### Animation Standards
- Hover transitions: 200ms ease
- Page transitions: 300ms ease-in-out
- Modal/Drawer: 300ms cubic-bezier(0.16, 1, 0.3, 1)
- Loading spinners: 1s linear infinite
- Pulse effects: 2s ease-in-out infinite

### Accessibility
- Focus visible rings on all interactive elements
- Color contrast ratio ≥ 4.5:1 for text
- Reduced motion support: `@media (prefers-reduced-motion: reduce)`
- Keyboard navigation for sidebar, modals, dropdowns

---

## File Mapping

| Design Section | Component File | CSS File |
|----------------|----------------|----------|
| Landing Page | `AdminLogin.js` | `AdminLogin.css` |
| Dashboard Shell | `AdminDashboard.js` | `AdminDashboard.css` |
| Overview | `AdminDashboard.js` | `AdminDashboard.css` |
| Live Map | `MapComponent.js` | `MapComponent.css` |
| Posts | `IncidentModeration.js` | `IncidentModeration.css` |
| Users | `UserManagement.js` | `UserManagement.css` |
| Responders | `RespondersManagement.js` | `RespondersManagement.css` |
| Announcements | `AnnouncementsManagement.js` | `AnnouncementsManagement.css` |
| Settings | `Settings.js` | `Settings.css` |
| Invitations | `InvitationManager.js` | `InvitationManager.css` |

---

*End of Design Specification*

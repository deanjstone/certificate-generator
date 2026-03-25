# Architecture

## Overview

certgen is a browser-native single-page application with no server-side rendering.

## Data Flow

```
User uploads Excel file
        ↓
src/services/   — parse and validate input
        ↓
src/lib/        — transform data into certificate model
        ↓
src/components/ — render certificate UI / trigger PDF generation
        ↓
Supabase Storage — persist generated certificates
```

## Directory Responsibilities

| Directory | Responsibility |
|-----------|---------------|
| `src/components/` | Custom elements — UI only, no business logic |
| `src/lib/` | Pure functions — data transformation, validation |
| `src/services/` | All I/O — Supabase queries, file reads/writes |
| `src/styles/` | Global CSS tokens and Open Props imports |

## Component Architecture

All UI is built from native `HTMLElement` subclasses registered as `cert-*` custom elements.
Shadow DOM is used for style encapsulation where components need isolated styling.

See individual component files for element-level documentation.

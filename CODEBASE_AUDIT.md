# Codebase Audit Tracking

This file tracks the findings of the codebase audit, focusing on structural weaknesses, UI clutter, mock data, and stylistic inconsistencies.

## 📋 Audit Overview
- **Goal:** Identify improvements for maintainability, clarity, and performance.
- **Architectural Reference:** `CYMATIC_MASTER_ARCH.md`

## 🚨 Critical Issues
- [ ] **Build Failure:** The project build system (`npm run build`) is failing due to broken `node_modules` (specifically `rolldown` / `vite` issues). This needs urgent resolution before further refactoring to ensure imports are valid.

---

## 🔍 Findings

### 1. Structural Weaknesses
- [ ] **Observation:** The `src/components/` directory contains a very large number of components. Consider grouping them into sub-directories (e.g., `features/`, `common/`, `layouts/`).

### 2. UI Clutter
- [ ] **Observation:** Need to assess the density of components in the main views. Some might be redundant or could be simplified.

### 3. Mock Data
- [ ] **Observation:** Search for hard-coded data in components (e.g., in `src/data/`, `src/components/`, etc.) that should be fetched or moved to a proper data layer.

### 4. Stylistic Inconsistencies
- [ ] **Observation:** Check for mixed styling approaches (e.g., `patch.css` vs CSS-in-JS vs Tailwind if present).

---

## ✅ Action Plan

### 1. Mock Data Migration (Centralize Config)
- [x] Move hard-coded voice hints from `src/lib/HardwareBridge.ts` to `src/config/voice-hints.ts`.
- [x] Move hard-coded salutations from `src/lib/empathy-engine.ts` to `src/config/empathy-data.ts`.
- [x] Move curriculum definitions from `src/lib/tutor-audit.ts` to `src/config/curriculum.ts`.
- [x] Move hard-coded chart/dashboard data (intervals, days, skills) to `src/config/ui-data.ts` or fetchable constants.

### 2. Component Structure Refactoring
- [ ] Establish `src/components/features/` and move domain-specific modules there (e.g., `AdminAuditDashboard.tsx` -> `src/components/features/admin/`).
- [ ] Move reusable/generic UI components to `src/components/ui/` or `src/components/common/`.
- [ ] Move layout/wrapper components to `src/components/layout/`.
- [ ] Clean up `src/components/` root directory by removing all top-level files.

### 4. Stylistic Inconsistencies
- [ ] Evaluate `patch.css` and its usage across the app to determine if it can be unified with the global styles or Tailwind config.
- [ ] **Observation:** Found multiple local definitions of `InputField` across `BiologyTools.tsx`, `AreaPerimeterCalc.tsx`, and `PhysicsTools.tsx`. These should be unified to use the central `src/components/common/InputField.tsx`.


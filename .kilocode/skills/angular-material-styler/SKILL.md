---
name: angular-material-styler
description: This skill should be used when writing or reviewing Angular component styles, especially when working with Material Design 3 tokens. Use it when creating new components, styling existing ones, or ensuring styles follow Material Design 3 guidelines and best practices.
---

# Angular Material Styler

## Overview

This skill provides guidance for writing proper Angular component styles using Material Design 3 CSS tokens. It ensures components follow Material Design principles, support light/dark themes, and use the correct token system for colors, typography, elevation, and shapes.

## When to Use This Skill

Use this skill when:
- Creating new Angular components that need Material Design styling
- Reviewing or refactoring existing component styles
- Adding Material Design 3 tokens to custom components
- Ensuring styles support theme switching (light/dark)
- Styling custom components to match Material Design aesthetics

## Core Principles

### Token-Based Styling

Always use Material Design 3 CSS variables (`--mat-sys-*`) instead of hardcoded values. This ensures:
- Automatic theme switching (light/dark)
- Consistent design language across the application
- Easy theme customization in one place

### Token Categories

Material Design 3 tokens fall into four main categories:
1. **Color tokens** - Backgrounds, text, borders, shadows
2. **Typography tokens** - Font sizes, weights, line heights, tracking
3. **Elevation tokens** - Box shadows for depth
4. **Shape tokens** - Border radius values

## Styling Workflow

### Step 1: Determine Component Type

Identify the component's role and purpose:
- Is it a container (card, panel, dialog)?
- Is it interactive (button, input)?
- Is it informational (text, label)?
- Is it a decorative element?

### Step 2: Select Appropriate Tokens

Based on the component type, choose the right token categories:

**For containers (cards, panels):**
- Background: `--mat-sys-surface-container-*` (low, medium, high, highest)
- Border: `--mat-sys-outline-variant`
- Elevation: `--mat-sys-level1` through `--mat-sys-level3`
- Shape: `--mat-sys-corner-medium` or `--mat-sys-corner-large`

**For interactive elements:**
- Background: `--mat-sys-primary` / `--mat-sys-primary-container`
- Text: `--mat-sys-on-primary` / `--mat-sys-on-primary-container`
- Shape: `--mat-sys-corner-full` (for round buttons) or `--mat-sys-corner-medium`

**For text:**
- Body text: `--mat-sys-body-large`, `--mat-sys-body-medium`, `--mat-sys-body-small`
- Headings: `--mat-sys-headline-*`, `--mat-sys-title-*`
- Labels: `--mat-sys-label-large`, `--mat-sys-label-medium`, `--mat-sys-label-small`

### Step 3: Apply Color Pairs Correctly

Always use matching color pairs for proper contrast:
- Base color (e.g., `--mat-sys-primary`) for background
- On-color (e.g., `--mat-sys-on-primary`) for text/icons on that background

**Example:**
```css
.my-button {
  background-color: var(--mat-sys-primary);
  color: var(--mat-sys-on-primary);
}

.my-card {
  background-color: var(--mat-sys-surface-container-low);
  color: var(--mat-sys-on-surface);
}
```

### Step 4: Add Elevation and Shape

Apply elevation and shape tokens to create depth and visual hierarchy:

```css
.card {
  box-shadow: var(--mat-sys-level2);
  border-radius: var(--mat-sys-corner-medium);
  border: 1px solid var(--mat-sys-outline-variant);
}

.dialog {
  box-shadow: var(--mat-sys-level4);
  border-radius: var(--mat-sys-corner-extra-large);
}
```

### Step 5: Apply Typography

Use typography tokens for consistent text styling:

```css
/* Full token for quick application */
.description {
  font: var(--mat-sys-body-large);
}

/* Individual tokens for fine-tuning */
.custom-heading {
  font-family: var(--mat-sys-headline-medium-font);
  font-size: var(--mat-sys-headline-medium-size);
  font-weight: var(--mat-sys-headline-medium-weight);
  line-height: var(--mat-sys-headline-medium-line-height);
  letter-spacing: var(--mat-sys-headline-medium-tracking);
}
```

## Common Use Cases

### Styling a Card Component

```css
.feature-card {
  background-color: var(--mat-sys-surface-container-low);
  color: var(--mat-sys-on-surface);
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-medium);
  box-shadow: var(--mat-sys-level2);
  padding: 16px;
}

.feature-card h2 {
  font: var(--mat-sys-title-large);
  color: var(--mat-sys-primary);
}

.feature-card p {
  font: var(--mat-sys-body-medium);
  color: var(--mat-sys-on-surface-variant);
}
```

### Styling a Custom Button

```css
.custom-button {
  background-color: var(--mat-sys-primary);
  color: var(--mat-sys-on-primary);
  border: none;
  border-radius: var(--mat-sys-corner-full);
  font: var(--mat-sys-label-large);
  padding: 12px 24px;
  cursor: pointer;
  box-shadow: var(--mat-sys-level1);
}

.custom-button:hover {
  box-shadow: var(--mat-sys-level2);
}
```

### Styling an Input Field

```css
.custom-input {
  background-color: var(--mat-sys-surface-container-low);
  color: var(--mat-sys-on-surface);
  border: 1px solid var(--mat-sys-outline);
  border-radius: var(--mat-sys-corner-small);
  font: var(--mat-sys-body-large);
  padding: 12px 16px;
}

.custom-input:focus {
  border-color: var(--mat-sys-primary);
  outline: 2px solid var(--mat-sys-primary);
  outline-offset: 2px;
}
```

## Material Component Customization

### When to Use `*-overrides` Mixins

Use Material component `*-overrides` mixins when:
- Customizing specific Material components in a localized scope
- Changing component-specific properties (colors, shapes, sizes)
- Maintaining compatibility with Material updates

**Example:**
```scss
@use '@angular/material' as mat;

.my-feature-card mat-progress-bar {
  @include mat.progress-bar-overrides((
    track-color: var(--mat-sys-surface-container-highest),
    active-indicator-color: var(--mat-sys-primary),
    track-shape: 4px,
  ));
}
```

### When to Use Scoped Themes

Use scoped themes (`mat.theme()`) when:
- An entire section/module needs different colors/density
- Multiple components need consistent theming in a specific area
- Creating a "branded" section with different design language

**Example:**
```scss
@use '@angular/material' as mat;

.admin-panel {
  @include mat.theme((
    color: (
      primary: mat.$azure-palette,
      tertiary: mat.$blue-palette,
    ),
    density: -2,
  ));
}
```

## What to Avoid

### Prohibited Practices

- **Do not** use hardcoded hex values (e.g., `#1976D2`) - use tokens instead
- **Do not** target internal Material DOM classes (`.mat-mdc-*`) - use `*-overrides`
- **Do not** use `::ng-deep` for Material component customization - use `*-overrides`
- **Do not** modify Material component layout properties (padding, height, width) - may break behavior
- **Do not** mix base colors without their matching on-colors - ensures poor contrast

### Correct Approach

- Use `--mat-sys-*` variables for custom component styling
- Use `*-overrides` mixins for Material component customization
- Use scoped themes for area-wide theming changes
- Always pair base colors with their on-color counterparts

## Resources

This skill includes reference documentation for Material Design 3 tokens:

### references/material-css-color.md
Complete reference for color tokens including:
- Primary, secondary, tertiary color systems
- Error colors
- Surface and background colors
- Outline and border colors
- Usage recommendations

### references/material-css-elevation.md
Complete reference for elevation tokens including:
- Level 0-5 shadow tokens
- Outline and border tokens
- When to use each elevation level

### references/material-css-shape.md
Complete reference for shape tokens including:
- Corner radius tokens (extra-large, large, medium, small, extra-small, none, full)
- Directional tokens (top, start, end)
- Usage recommendations for different element types

### references/material-css-typography.md
Complete reference for typography tokens including:
- Display, headline, title, body, label typography systems
- Full tokens and individual sub-tokens (font, size, weight, line-height, tracking)
- Usage recommendations for text hierarchy

### references/material-rules.md
Comprehensive guide covering:
- Token system architecture
- When to use `*-overrides` vs scoped themes vs CSS variables
- Best practices and anti-patterns
- Examples for common scenarios

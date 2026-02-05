# Angular Material Overrides Must Be Derived from Local SCSS Sources

## Constraint
When suggesting CSS/SCSS overrides for Angular Material, the model must base them **only** on the local Angular Material source files inside `node_modules/@angular/material`.

Guessing selectors, DOM structure, or class names is forbidden.

---

## Source of Truth
For each component, the model must inspect files inside:

- `material/<component>/`
- Especially:
  - `_* -theme.scss`
  - `_m3-*.scss`

These files define:
- allowed theming APIs
- exposed CSS variables
- internal structure boundaries

---

## Mandatory Behavior

Before proposing an override, the model must:
- Locate the corresponding `_m3-*` SCSS
- Prefer:
  1. Theme mixins
  2. CSS variables (`--mat-*`)
  3. Public host classes (only if present in source)

If none exist, the model must **explicitly state that no stable override is exposed**.

---

## Output Requirement

Each override must mention:
- Component
- File name (`_m3-*`, or `*-theme.scss`)
- Whether the override is:
  - Stable
  - Internal
  - Unsafe

# Frontend UI Design Specification

## Overview

This document defines the UI/UX design for the Hookah Wishlist Telegram Mini-App frontend. It should be kept up-to-date as the design evolves.

## Design Philosophy

- **Minimalist & Clean**: Apple-inspired design with lots of whitespace
- **Mobile-First**: Optimized for Telegram Mini-App on mobile devices
- **Cold Palette**: Blue-grey background with blue accents (Telegram-like)
- **Modern Sans-Serif**: Clean, readable typography (Inter/SF Pro style)
- **Simplicity**: Only essential features, no bloat

---

## Color Palette

### Primary Colors
- **Background**: Cold blue-grey (#f0f2f5 or similar Telegram-like color)
- **Card Background**: White (#ffffff)
- **Text Primary**: Dark grey/black (#1a1a1a)
- **Text Secondary**: Medium grey (#6b7280)
- **Accent Blue**: Telegram blue (#0088cc or similar)

### Status Colors
- **Success**: Green (#10b981)
- **Error**: Red (#ef4444)
- **Warning**: Orange (#f59e0b)

---

## Typography

### Font Family
- **Primary**: Modern sans-serif (Inter, SF Pro, or similar)
- **Style**: Clean, geometric, highly readable

### Font Scale
- **Headlines**: Large, bold for section titles
- **Body**: Medium size for card content
- **Labels**: Small size for secondary information

---

## Layout Structure

### Single Page Design
- All functionality on one page
- Bottom tab navigation for switching between "Поиск" and "Wishlist"
- No separate pages or routes

### Bottom Tab Bar
- **Floating panel** with rounded corners
- **Text-only tabs** (no icons)
- **Active tab highlighted** with accent color
- **Two tabs**: "Поиск" (Search) and "Wishlist"
- **Position**: Fixed at bottom of screen

---

## Search Tab

### Header
- **Search bar** at the top (full width)
- **Filter button** with icon (opens filter modal)

### Search Bar
- Full-width input field
- Placeholder text for search query
- No autocomplete
- Real-time search as user types

### Filters Modal
- **Center modal** with rounded corners
- **Filters available**:
  - Status (Статус табака)
  - Country (Страна производства)
- **No other filters** (brand, rating, line are not needed)
- **Apply/Reset buttons** at bottom

### Tobacco Cards (Search)
- **Layout**: Vertical list (cards stacked vertically)
- **Spacing**: 12-16px between cards
- **Border radius**: Medium (12-16px)
- **Shadow**: Subtle elevation

### Card Content
- **Image**: Square image on the left
- **Name**: Tobacco name (prominent)
- **Brand**: Brand name
- **Rating**: Number + count (e.g., "4.5 (123)")
- **Add to Wishlist**: Small button in bottom-right corner

### Add to Wishlist Actions
- **Small button** in bottom-right corner of card
- **Icon-only** (heart icon)
- **No gestures** (swipe removed)

---

## Wishlist Tab

### Header
- **Title**: "Wishlist" at the top
- **No search bar** in wishlist tab

### Wishlist Cards
- **Same design** as search cards but more compact
- **Same data**: Name, brand, rating, image
- **Additional action**: Mark as purchased button

### Mark as Purchased Actions
- **Button with icon** (checkmark icon)
- **Action**: Marks as purchased AND removes from wishlist
- **No gestures** (swipe removed)
- **Visual feedback**: Checkmark appears before card disappears

### Empty State
- **Minimalist text only**: "Wishlist пуст" or similar
- **No icons or illustrations**
- **No call-to-action buttons**

---

## Animations & Micro-interactions

### Included
1. **Smooth tab transitions**: Fade/slide between tabs
2. **Hover effects on cards**: Subtle lift or color change on hover
3. **Skeleton loading**: Placeholder cards while loading data
4. **Checkmark animation**: Brief checkmark before card removal

### NOT Included
- Page transitions between states
- Complex micro-interactions
- Over-the-top animations

---

## Loading States

### Skeleton Loading
- **Cards**: Placeholder cards with shimmer effect
- **Maintains layout**: Same structure as real cards
- **Smooth transition**: Replaced with real data when loaded

### Infinite Scroll
- **Automatic loading**: Load more data when scrolling to bottom
- **Loading indicator**: Spinner at bottom while loading
- **No pagination button**: No "Load More" button

---

## Error Handling

### Toast Notifications
- **Position**: Bottom of screen
- **Duration**: Short (2-3 seconds)
- **Style**: Minimalist with icon and text
- **Auto-dismiss**: Disappears automatically

### Error Types
- Network errors
- API errors
- Validation errors

---

## Empty States

### Search Empty State
- **Text only**: "Ничего не найдено"
- **No icons or illustrations**
- **Minimalist approach**

### Wishlist Empty State
- **Text only**: "Wishlist пуст"
- **No icons or illustrations**
- **No call-to-action buttons**

---

## Gestures

### Policy
- **No gestures supported** (removed from design)
- All interactions via buttons only
- Consistent with minimalist approach

---

## Card Design Details

### Card Structure (Search)
```
┌─────────────────────────────────┐
│ [IMG]  Tobacco Name           │
│ [IMG]  Brand Name             │
│ [IMG]  4.5 (123)          [+] │
└─────────────────────────────────┘
```

### Card Structure (Wishlist)
```
┌─────────────────────────────────┐
│ [IMG]  Tobacco Name           │
│ [IMG]  Brand Name             │
│ [IMG]  4.5 (123)          [✓] │
└─────────────────────────────────┘
```

### Visual Properties
- **Border radius**: 12-16px (medium)
- **Shadow**: Subtle elevation (1-2 levels)
- **Background**: White (#ffffff)
- **Padding**: Comfortable spacing around content
- **Image**: Square, left-aligned
- **Text hierarchy**: Name > Brand > Rating

---

## Responsive Design

### Mobile (Primary Target)
- **Optimized for**: Mobile Telegram Mini-App
- **Layout**: Single column, vertical list
- **Touch targets**: Minimum 44px for buttons
- **Font sizes**: Readable on small screens

### Desktop (Secondary)
- **Centered content**: Max-width container
- **Same layout**: Vertical list maintained
- **No grid**: No multi-column layouts

---

## Accessibility

### Contrast
- **WCAG AA compliant**: Minimum 4.5:1 contrast ratio
- **Color combinations**: Tested for readability

### Touch Targets
- **Minimum size**: 44x44px for all interactive elements
- **Spacing**: Adequate spacing between touch targets

### Focus States
- **Visible focus**: Clear focus indicators for keyboard navigation
- **Skip links**: Not applicable (single page app)

---

## Performance

### Loading Strategy
- **Lazy loading**: Load images as needed
- **Infinite scroll**: Load data progressively
- **Skeleton screens**: Improve perceived performance

### Optimization
- **Image optimization**: Compress and resize images
- **Bundle size**: Keep JavaScript bundle minimal
- **Code splitting**: Lazy load non-critical code

---

## Design Tokens (Material Design 3)

### Color Tokens
- Background: `--mat-sys-surface-container-low`
- Card: `--mat-sys-surface`
- Text Primary: `--mat-sys-on-surface`
- Text Secondary: `--mat-sys-on-surface-variant`
- Accent: `--mat-sys-primary`

### Typography Tokens
- Headlines: `--mat-sys-headline-medium`
- Body: `--mat-sys-body-medium`
- Labels: `--mat-sys-label-medium`

### Elevation Tokens
- Card: `--mat-sys-level1` or `--mat-sys-level2`
- Modal: `--mat-sys-level4`

### Shape Tokens
- Card: `--mat-sys-corner-medium`
- Button: `--mat-sys-corner-full`
- Modal: `--mat-sys-corner-extra-large`

---

## Component Hierarchy

```
App Component
├── Tab Bar (Floating)
│   ├── Search Tab
│   └── Wishlist Tab
├── Search Tab Content
│   ├── Search Bar
│   ├── Filter Button
│   └── Tobacco Cards List
│       └── Tobacco Card
│           ├── Image
│           ├── Name
│           ├── Brand
│           ├── Rating
│           └── Add Button
├── Wishlist Tab Content
│   └── Wishlist Cards List
│       └── Wishlist Card
│           ├── Image
│           ├── Name
│           ├── Brand
│           ├── Rating
│           └── Purchased Button
└── Filter Modal
    ├── Status Filter
    ├── Country Filter
    └── Action Buttons
```

---

## Implementation Notes

### Angular Material Components
- Use Material Design 3 tokens for styling
- Follow angular-material-styler skill guidelines
- Use `--mat-sys-*` CSS variables
- Avoid hardcoded values

### State Management
- Use Angular signals for reactive state
- Model-based two-way binding for inputs
- Computed signals for derived state

### API Integration
- Use existing services (AuthService, WishlistService, HookahDbService)
- Implement infinite scroll with pagination
- Handle loading and error states properly

---

## Version History

### v1.0 (2025-02-01)
- Initial design specification
- Defined minimalist Apple-inspired aesthetic
- Established cold color palette (Telegram-like)
- Specified bottom tab navigation with floating panel
- Defined card structure and interactions
- Removed all gestures (swipe actions)
- Specified button-only interactions
- Added infinite scroll and skeleton loading
- Defined toast notifications for errors
- Specified minimalist empty states

---

## Future Considerations

### Potential Enhancements
- Dark mode support (if requested)
- Additional filters (brand, rating) if needed
- Advanced search features
- Analytics and user behavior tracking

### Design Debt
- Monitor user feedback for UX improvements
- Consider A/B testing for card layouts
- Evaluate performance metrics

---

## Maintenance

This document should be updated whenever:
- New UI components are added
- Design decisions change
- User feedback requires adjustments
- Technical constraints evolve

**Keep this document in sync with the actual implementation!**

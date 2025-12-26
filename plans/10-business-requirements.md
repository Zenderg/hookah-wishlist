# Business Requirements

## Overview

This document outlines the business requirements for the Hookah Wishlist System. It defines the problem statement, target audience, business goals, user stories, and success metrics.

## Problem Statement

### The Problem

Hookah enthusiasts often forget which tobacco flavors they want to try or purchase. When visiting a hookah shop or ordering online, they struggle to recall specific brands and flavors they've discovered or been recommended. This leads to:

- Missed opportunities to try interesting flavors
- Impulse purchases of already-tried flavors
- Frustration from forgetting interesting discoveries
- Inability to share preferences with friends

### Current Solutions & Limitations

**Existing Solutions**:
- **Notes apps**: Require manual entry, no structure
- **Spreadsheets**: Tedious to maintain, not mobile-friendly
- **Memory**: Unreliable, especially for occasional users

**Limitations**:
- No integration with tobacco databases
- No images or visual references
- Difficult to access on-the-go
- No social sharing capabilities

### Our Solution

A Telegram-based wishlist system that allows users to:
- Easily add tobaccos to a wishlist via bot or Mini App
- Search through a comprehensive tobacco database
- View their wishlist with images and details
- Mark items as purchased and track history
- Access the system anytime through Telegram

## Target Audience

### Primary Users

**Hookah Enthusiasts**:
- Age: 18-45
- Experience: Intermediate to advanced
- Frequency: Regular hookah users (1-5 times per week)
- Tech-savvy: Comfortable with mobile apps and Telegram
- Pain Points: Forgetful about flavors they want to try

### Secondary Users

**Casual Hookah Users**:
- Age: 18-35
- Experience: Beginner to intermediate
- Frequency: Occasional users (1-2 times per month)
- Tech-savvy: Moderate
- Pain Points: Want to explore new flavors but get overwhelmed

**Shop Owners** (Future):
- Want to understand customer preferences
- Interested in popular flavors and trends
- Potential for targeted recommendations

## Business Goals

### Primary Goals

1. **Solve User Problem**
   - Provide a convenient way to remember tobacco preferences
   - Reduce frustration from forgetting flavors
   - Enable easy access to wishlist on-the-go

2. **User Adoption**
   - Acquire 100 active users in first 3 months
   - Achieve 70% user retention after 30 days
   - Reach 500 active users in first 6 months

3. **User Engagement**
   - Average 5 wishlist items per user
   - 50% of users use both bot and Mini App
   - 30% of users add items weekly

### Secondary Goals

1. **Data Quality**
   - Maintain comprehensive tobacco database (500+ tobaccos)
   - Keep database updated with new releases
   - Ensure accurate and up-to-date information

2. **User Satisfaction**
   - Achieve 4.5/5 star rating
   - Keep support requests under 5% of users
   - Maintain 99% uptime

3. **Revenue Potential** (Future)
   - Explore affiliate partnerships with tobacco retailers
   - Consider premium features (advanced analytics, sharing)
   - Potential for B2B solutions for shop owners

## User Stories

### Epic 1: User Onboarding

**Story 1.1**: As a new user, I want to start the bot and receive a welcome message so that I understand what the system does.

**Acceptance Criteria**:
- User sends `/start` command
- Bot responds with welcome message
- Message explains system purpose
- Message lists available commands
- Bot creates user account automatically

**Priority**: High
**Effort**: Small

---

**Story 1.2**: As a new user, I want to open the Mini App from the bot so that I can access the full-featured interface.

**Acceptance Criteria**:
- Bot provides button to open Mini App
- Button opens Mini App in Telegram
- Mini App loads successfully
- User is authenticated automatically

**Priority**: High
**Effort**: Small

---

### Epic 2: Wishlist Management

**Story 2.1**: As a user, I want to add a tobacco to my wishlist via bot command so that I can quickly save flavors I want to try.

**Acceptance Criteria**:
- User sends `/add <tobacco name>` command
- Bot searches database for matching tobacco
- If found: Adds tobacco to wishlist, confirms with message
- If not found: Adds as custom tobacco, confirms with message
- Prevents duplicate entries
- Shows error if format is invalid

**Priority**: High
**Effort**: Medium

---

**Story 2.2**: As a user, I want to view my wishlist via bot command so that I can see what I need to buy.

**Acceptance Criteria**:
- User sends `/list` command
- Bot displays all items in wishlist
- Shows brand and name for each item
- Displays total count
- Limits to first 20 items with "and X more" message
- Shows empty state message if no items

**Priority**: High
**Effort**: Small

---

**Story 2.3**: As a user, I want to remove an item from my wishlist via bot so that I can clean up my list.

**Acceptance Criteria**:
- User sends `/remove <number>` command
- Bot shows numbered list of items
- User replies with item number
- Bot removes selected item
- Confirms removal with message
- Shows error if number is invalid

**Priority**: Medium
**Effort**: Medium

---

**Story 2.4**: As a user, I want to clear my entire wishlist via bot so that I can start fresh.

**Acceptance Criteria**:
- User sends `/clear` command
- Bot asks for confirmation
- User confirms
- Bot removes all items
- Confirms with success message
- User can cancel at any time

**Priority**: Low
**Effort**: Small

---

**Story 2.5**: As a user, I want to view my wishlist in Mini App so that I can see images and details.

**Acceptance Criteria**:
- Mini App displays wishlist on home screen
- Shows tobacco image for each item
- Displays brand and name
- Shows purchase status
- Provides quick actions (remove, mark purchased)
- Shows empty state if no items
- Loading states during data fetch

**Priority**: High
**Effort**: Medium

---

**Story 2.6**: As a user, I want to add a tobacco to my wishlist in Mini App so that I can save flavors I discover.

**Acceptance Criteria**:
- User searches for tobacco
- User taps "Add to wishlist" button
- Tobacco is added to wishlist
- Success message appears
- Wishlist updates immediately
- Prevents duplicate entries

**Priority**: High
**Effort**: Small

---

**Story 2.7**: As a user, I want to remove an item from my wishlist in Mini App so that I can manage my list.

**Acceptance Criteria**:
- User taps remove button on item
- Confirmation dialog appears
- User confirms
- Item is removed from wishlist
- Success message appears
- Wishlist updates immediately

**Priority**: Medium
**Effort**: Small

---

### Epic 3: Tobacco Discovery

**Story 3.1**: As a user, I want to search for tobaccos in the database so that I can find specific flavors.

**Acceptance Criteria**:
- User enters search query
- System searches by name and brand
- Results appear in real-time
- Shows up to 50 results
- Displays tobacco image, brand, and name
- Shows "no results" message if no matches
- Debounces search to avoid excessive API calls

**Priority**: High
**Effort**: Medium

---

**Story 3.2**: As a user, I want to browse tobaccos by brand so that I can explore a specific brand's offerings.

**Acceptance Criteria**:
- User selects brand from list
- System shows all tobaccos for that brand
- Displays tobacco images
- Shows tobacco names
- Allows adding to wishlist
- Shows empty state if no tobaccos

**Priority**: Medium
**Effort**: Medium

---

**Story 3.3**: As a user, I want to view tobacco details so that I can learn more about a flavor.

**Acceptance Criteria**:
- User taps on tobacco
- Detail view appears
- Shows tobacco image
- Displays brand and name
- Shows description
- Displays metadata (strength, cut, rating)
- Provides "Add to wishlist" button
- Shows "Back" button

**Priority**: Low
**Effort**: Small

---

### Epic 4: Purchase Tracking

**Story 4.1**: As a user, I want to mark items as purchased so that I can track what I've bought.

**Acceptance Criteria**:
- User taps "Mark as purchased" button
- Item status changes to purchased
- Purchase date is recorded
- Item moves to purchased section
- Success message appears

**Priority**: Medium
**Effort**: Small

---

**Story 4.2**: As a user, I want to view purchased items so that I can see my purchase history.

**Acceptance Criteria**:
- User switches to "Purchased" tab
- System shows all purchased items
- Displays purchase date
- Shows brand and name
- Allows removing purchased items
- Shows empty state if no purchases

**Priority**: Low
**Effort**: Small

---

**Story 4.3**: As a user, I want to clear all purchased items so that I can clean up my history.

**Acceptance Criteria**:
- User taps "Clear purchased" button
- Confirmation dialog appears
- User confirms
- All purchased items are removed
- Success message appears

**Priority**: Low
**Effort**: Small

---

### Epic 5: Custom Tobaccos

**Story 5.1**: As a user, I want to add a custom tobacco to my wishlist so that I can save flavors not in the database.

**Acceptance Criteria**:
- User enters custom tobacco name
- User enters custom brand name (optional)
- System adds to wishlist as custom item
- Shows confirmation message
- Item appears in wishlist
- Prevents duplicates

**Priority**: Medium
**Effort**: Small

---

### Epic 6: Bot Commands

**Story 6.1**: As a user, I want to receive help information so that I can learn about available commands.

**Acceptance Criteria**:
- User sends `/help` command
- Bot displays all available commands
- Shows description for each command
- Provides examples
- Includes link to Mini App

**Priority**: Medium
**Effort**: Small

---

**Story 6.2**: As a user, I want to search for tobaccos via bot so that I can find flavors without opening Mini App.

**Acceptance Criteria**:
- User sends `/search <query>` command
- Bot searches database
- Displays up to 10 results
- Shows inline buttons to add to wishlist
- Shows "no results" message if no matches

**Priority**: Low
**Effort**: Medium

---

## Functional Requirements

### FR-1: User Management

- The system shall create a user account automatically when a user first interacts with the bot
- The system shall store user's Telegram ID, username, and name
- The system shall authenticate users via Telegram initData for Mini App
- The system shall generate JWT tokens for authenticated sessions

### FR-2: Wishlist Management

- The system shall allow users to add tobaccos to their wishlist
- The system shall allow users to remove tobaccos from their wishlist
- The system shall allow users to view their wishlist
- The system shall allow users to clear their entire wishlist
- The system shall prevent duplicate items in a wishlist
- The system shall support both database tobaccos and custom tobaccos

### FR-3: Tobacco Database

- The system shall maintain a database of tobaccos with brands, names, descriptions, and images
- The system shall allow users to search tobaccos by name or brand
- The system shall allow users to browse tobaccos by brand
- The system shall display tobacco images from htreviews.org URLs
- The system shall automatically populate the database via scraping

### FR-4: Purchase Tracking

- The system shall allow users to mark items as purchased
- The system shall record the purchase date
- The system shall allow users to view purchased items
- The system shall allow users to clear purchased items

### FR-5: Bot Interface

- The system shall provide a Telegram bot with command-based interface
- The system shall support the following commands: `/start`, `/help`, `/list`, `/add`, `/remove`, `/clear`, `/app`, `/search`
- The system shall provide inline keyboards for quick actions
- The system shall send text-only responses (no images in bot)
- The system shall validate Telegram initData for Mini App access

### FR-6: Mini App Interface

- The system shall provide a web-based Mini App within Telegram
- The system shall integrate with Telegram theme and UI
- The system shall display wishlist items with images
- The system shall provide search functionality
- The system shall provide brand browsing
- The system shall support mobile touch interactions

### FR-7: API

- The system shall provide a REST API for bot and Mini App
- The system shall authenticate API requests via JWT or API key
- The system shall return JSON responses
- The system shall implement rate limiting
- The system shall provide proper error handling

### FR-8: Scraping

- The system shall automatically scrape tobacco data from htreviews.org
- The system shall run scraping on a daily schedule
- The system shall avoid duplicate entries
- The system shall store image URLs (not images)
- The system shall handle scraping errors gracefully

## Non-Functional Requirements

### NFR-1: Performance

- The system shall respond to bot commands within 2 seconds
- The system shall load Mini App within 3 seconds
- The system shall support up to 100 concurrent users
- The system shall handle 1000 API requests per minute

### NFR-2: Availability

- The system shall maintain 99% uptime
- The system shall have automated backups
- The system shall have health monitoring

### NFR-3: Scalability

- The system shall be designed to scale to 1000 users
- The system shall support horizontal scaling of API servers
- The system shall support database read replicas

### NFR-4: Security

- The system shall validate all user inputs
- The system shall use HTTPS for all communications
- The system shall store sensitive data in environment variables
- The system shall implement rate limiting
- The system shall protect against SQL injection

### NFR-5: Usability

- The system shall be intuitive for first-time users
- The system shall provide clear error messages
- The system shall support Russian and English languages
- The system shall be accessible on mobile devices

### NFR-6: Maintainability

- The system shall have clear code documentation
- The system shall use consistent coding standards
- The system shall have automated tests
- The system shall have logging and monitoring

## Technical Constraints

### TC-1: Platform

- Bot must run on Telegram platform
- Mini App must work within Telegram Web App
- API must be accessible from Telegram domains

### TC-2: Data Storage

- Images must not be stored locally
- Images must be displayed from htreviews.org URLs
- Database must support at least 1000 tobaccos

### TC-3: Integration

- System must integrate with Telegram Bot API
- System must integrate with Telegram Web App SDK
- System must scrape data from htreviews.org

### TC-4: Budget

- Initial deployment cost: <$50/month
- Scalable to <$100/month for 1000 users
- Free SSL certificates via Let's Encrypt

## Assumptions

### A-1: User Behavior

- Users have Telegram installed on their mobile devices
- Users are comfortable with text-based bot commands
- Users prefer visual interfaces (Mini App) for complex tasks

### A-2: Data Availability

- htreviews.org will remain accessible
- htreviews.org structure will remain relatively stable
- htreviews.org images will remain available

### A-3: Technical

- Telegram API will remain stable
- Telegram Web App SDK will continue to be supported
- PostgreSQL will remain a viable database option

## Dependencies

### D-1: External Services

- Telegram Bot API (required)
- Telegram Web App SDK (required)
- htreviews.org (required for scraping)

### D-2: Third-Party Libraries

- Telegraf (Telegram bot library)
- Fastify (API framework)
- Prisma (ORM)
- React (Mini App framework)
- Playwright (Web scraping)

### D-3: Infrastructure

- VPS or cloud hosting
- PostgreSQL database
- Nginx reverse proxy
- SSL certificate

## Risks

### R-1: Technical Risks

**Risk**: Telegram API changes may break functionality
**Impact**: High
**Probability**: Medium
**Mitigation**: Use stable libraries, monitor changelog, implement version checks

**Risk**: htreviews.org structure changes may break scraper
**Impact**: High
**Probability**: Medium
**Mitigation**: Design flexible scraper, monitor for changes, implement alerts

**Risk**: Database performance issues at scale
**Impact**: Medium
**Probability**: Low
**Mitigation**: Proper indexing, connection pooling, read replicas

### R-2: Business Risks

**Risk**: Low user adoption
**Impact**: High
**Probability**: Medium
**Mitigation**: Focus on user experience, gather feedback, iterate quickly

**Risk**: Competing solutions emerge
**Impact**: Medium
**Probability**: Low
**Mitigation**: Focus on unique value proposition, build community

**Risk**: Legal issues with scraping
**Impact**: High
**Probability**: Low
**Mitigation**: Respect robots.txt, implement rate limiting, consider API access

### R-3: Operational Risks

**Risk**: Downtime affects user trust
**Impact**: Medium
**Probability**: Medium
**Mitigation**: Monitoring, automated restarts, backup systems

**Risk**: Data loss
**Impact**: High
**Probability**: Low
**Mitigation**: Automated backups, disaster recovery plan

## Success Metrics

### User Metrics

- **Active Users**: 100 users in 3 months, 500 users in 6 months
- **User Retention**: 70% retention after 30 days
- **Engagement**: 5 wishlist items per user average
- **Feature Usage**: 50% of users use both bot and Mini App

### Technical Metrics

- **Uptime**: 99% availability
- **Response Time**: <2 seconds for bot commands
- **Error Rate**: <1% error rate
- **Database Size**: 500+ tobaccos in database

### Business Metrics

- **User Satisfaction**: 4.5/5 star rating
- **Support Requests**: <5% of users
- **Growth Rate**: 20% month-over-month growth

## Future Enhancements

### Phase 2 (3-6 months)

- Purchase history and analytics
- Wishlist sharing with friends
- Advanced search filters (strength, cut)
- User settings and preferences
- Daily reminders and notifications

### Phase 3 (6-12 months)

- Multiple wishlists per user
- Wishlist templates and collections
- Import/export functionality
- Social features (ratings, reviews)
- Affiliate partnerships with retailers

### Phase 4 (12+ months)

- B2B solutions for shop owners
- Premium features (advanced analytics, custom branding)
- Mobile app (native iOS/Android)
- Multi-language support (beyond Russian/English)

## Conclusion

The Hookah Wishlist System addresses a clear user problem with a focused solution. By leveraging Telegram's platform and providing both bot and Mini App interfaces, the system offers convenience and flexibility. With a clear path from MVP to enhanced features, the business can grow based on user feedback and market demand.

Key success factors:
- ✅ Solve the core problem effectively
- ✅ Provide excellent user experience
- ✅ Maintain high system reliability
- ✅ Iterate based on user feedback
- ✅ Scale infrastructure as needed

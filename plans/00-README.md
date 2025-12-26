# Hookah Wishlist System - Documentation

This directory contains comprehensive documentation for the Hookah Tobacco Wishlist System project.

## Project Overview

The Hookah Wishlist System is a Telegram-based application designed to help users manage their hookah tobacco preferences and shopping lists. The system consists of four main components:

1. **Telegram Bot** - Handles user commands and notifications
2. **Telegram Mini App** - Web-based interface for enhanced user experience
3. **API Server** - REST API providing business logic and data management
4. **Scraper Module** - Automated data collection from htreviews.org

## Architecture

All components run in Docker containers with PostgreSQL database. Deployment is automated via Coolify platform with GitHub Webhooks.

## Documentation Structure

### Technical Documentation
- [`01-technology-stack.md`](01-technology-stack.md) - Technology stack selection and justification
- [`02-system-architecture.md`](02-system-architecture.md) - High-level system architecture
- [`03-database-schema.md`](03-database-schema.md) - Database design and relationships
- [`04-api-specification.md`](04-api-specification.md) - API endpoints and contracts

### Component Documentation
- [`05-telegram-bot.md`](05-telegram-bot.md) - Bot commands and interaction patterns
- [`06-mini-app.md`](06-mini-app.md) - Mini App architecture and features
- [`07-scraper-module.md`](07-scraper-module.md) - Data scraping strategy and implementation

### Implementation & Deployment
- [`08-mvp-plan.md`](08-mvp-plan.md) - Minimum Viable Product implementation plan
- [`09-deployment-guide.md`](09-deployment-guide.md) - Infrastructure and deployment strategy
- [`docker-compose.yml.md`](docker-compose.yml.md) - Docker Compose configuration for local development
- [`coolify-deployment.md`](coolify-deployment.md) - Coolify platform configuration for production deployment

### Business Documentation
- [`10-business-requirements.md`](10-business-requirements.md) - Business goals and user stories
- [`11-user-flows.md`](11-user-flows.md) - Detailed user journey documentation

## Quick Start

### Local Development

1. Clone repository
2. Create `.env` file (see [`docker-compose.yml.md`](docker-compose.yml.md))
3. Start all services:
   ```bash
   docker-compose up -d
   ```
4. Access API at http://localhost:3000
5. Bot runs independently
6. Scraper runs on schedule

### Production Deployment

1. Follow [`coolify-deployment.md`](coolify-deployment.md) for Coolify setup
2. Push code to GitHub (triggers automatic deployment)
3. Configure Telegram bot webhook
4. Monitor deployment in Coolify dashboard

## Recommended Reading Order

1. Start with [`10-business-requirements.md`](10-business-requirements.md) to understand the project goals
2. Review [`01-technology-stack.md`](01-technology-stack.md) for technology choices
3. Study [`02-system-architecture.md`](02-system-architecture.md) for system design
4. Follow [`08-mvp-plan.md`](08-mvp-plan.md) for implementation steps
5. Reference [`docker-compose.yml.md`](docker-compose.yml.md) for local development
6. Reference [`coolify-deployment.md`](coolify-deployment.md) for production deployment

## Target Audience

- **Developers**: Technical implementation details
- **Architects**: System design and technology decisions
- **Project Managers**: Business requirements and timelines
- **DevOps Engineers**: Deployment and infrastructure

## Key Features

✅ **Docker Compose** - All services containerized, no local PostgreSQL installation
✅ **Coolify Deployment** - Automated deployment via GitHub Webhooks
✅ **Prisma 7.2.0+** - Latest ORM version with enhanced TypeScript support
✅ **No Testing Sections** - Focus on core functionality
✅ **Modern Tech Stack** - Latest 2025 technology versions

## Version

Documentation Version: 2.0
Last Updated: 2025-12-26

## Changes in Version 2.0

- ✅ Updated technology stack to latest versions (Prisma 7.2.0+, React 19+, Vite 7+)
- ✅ Replaced VPS deployment with Docker Compose and Coolify
- ✅ Added GitHub Webhooks automation
- ✅ Removed all testing sections from documentation
- ✅ Added Docker Compose configuration guide
- ✅ Added Coolify deployment configuration guide
- ✅ Updated system architecture for container-first approach
- ✅ Updated deployment guide for Coolify platform

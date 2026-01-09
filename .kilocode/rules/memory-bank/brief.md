# Hookah Wishlist Project

## Overview
Telegram bot with mini-app for managing hookah tobacco wishlist, solving the problem of tracking purchased tobaccos without manual record-keeping.

## Primary Goals
- Provide quick and easy tobacco search functionality
- Enable seamless wishlist management
- Deliver instant wishlist retrieval via simple bot commands
- Streamline the shopping experience at tobacco stores
- Secure user authentication through Telegram
- Provide unified access to all services via reverse proxy
- Ensure data persistence across deployments

## Key Features
- **Telegram Bot Integration**: Full-featured bot with command-based interface
- **Mini-App Interface**: User-friendly web app embedded in Telegram
- **Tobacco Search**: Fast search across brands and tobacco varieties
- **Wishlist Management**: Add/remove items with minimal effort
- **Quick Access**: Single command to retrieve complete wishlist
- **Telegram Authentication**: Secure user identification via Telegram user ID
- **Reverse Proxy**: Unified access to all services on port 80
- **Persistent Storage**: SQLite database with Docker volumes for data persistence
- **Independent Subprojects**: Backend and mini-app are completely isolated with their own dependencies and configurations

## Technology Stack
- **Runtime**: Node.js
- **Package Manager**: npm
- **Containerization**: Docker Compose
- **Reverse Proxy**: Nginx
- **Data Source**: hookah-db API (https://hdb.coolify.dknas.org) with API key authentication
- **Platform**: Telegram Bot API + Mini Apps
- **Storage**: SQLite database with persistent Docker volumes
- **Architecture**: Independent subprojects (backend/ and mini-app/) with complete isolation

## Significance
Eliminates friction in tracking hookah tobacco preferences by leveraging Telegram's familiar interface, making wishlist management effortless and accessible anywhere. Provides secure authentication and reliable data persistence for production deployment. The independent subproject architecture allows for flexible development and deployment of each component.

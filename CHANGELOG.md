# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-02-21

### Added
- **Frontend**: Added `vercel.json` configuration with rewrite rules to fix backend API routing (CORS and 404 errors) on Vercel deployments.
- **Frontend**: Added missing map items data transfer logic from `FittingPage` to `MapPage`. MapPage now correctly renders recommended products along with surrounding store locations.
- **Frontend**: Added robust URL matching rules and null-checks in `handleItemClick` to prevent empty brand names from matching all stores on the map.
- **Backend**: Implemented comprehensive try-on error handling, image format conversions, async reporting, and detailed error responses in `fitting_service.py` to gracefully handle Gemini AI rate limits or Naver Shopping download errors.

### Fixed
- Fixed an issue in the `RecommendPage` and `FittingPage` where the Vercel deployed frontend couldn't connect to the Render API due to missing route configurations.

## [0.1.0]

### Added
- Base K-Fit Hackathon project setup.
- Initial implementation of the virtual fitting room (`FittingPage.tsx`).
- Initial implementation of style recommendations and daily look analysis.
- Naver Map integration for offline store search (`MapPage.tsx`).
- FastAPI backend router configurations (`main.py`).

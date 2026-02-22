# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2026-02-23

### Added
- **Backend**: New `vision_service.py` — uses Gemini 2.0 Flash to batch-analyze user OOTD images and extract a unified `UserStyleProfile` JSON.
- **Backend**: New `/api/ootd/analyze` and `/api/ootd/recommend` API endpoints (`ootd.py`).
- **Frontend**: New `ProfilePage.tsx` — OOTD image upload UI with drag-and-drop, AI analysis results display, and personalized recommendation flow.
- **Frontend**: Added "Upload My OOTD & Get AI Analysis" link on the `OnboardingPage.tsx`.
- **Frontend**: Registered `/profile` route in `App.tsx`.

### Security
- All API keys (GOOGLE_API_KEY, OPENAI_API_KEY) are loaded exclusively from `.env` via `os.getenv()`. No keys are hardcoded or exposed to the frontend.

## [0.5.0] - 2026-02-23

### Added
- **Frontend**: Overhauled the `OnboardingPage.tsx` to ask for the user's Fashion Goal ("Trendy K-Fashion" vs "Tradition-core & Hanbok") instead of their gender as the first step.
- **Frontend**: Updated `StylePage.tsx` to present context-aware style keywords based on the selected fashion goal (e.g., K-Fashion shows 'Street', 'Y2K' while Hanbok shows 'Modern Hanbok', 'K-Culture'). Added a new gender selection toggle at the top of the Style Page.

## [0.4.0] - 2026-02-23

### Added
- **Frontend**: Added "Tradition-core" to selectable styles list in `StylePage.tsx`.
- **Backend**: Updated AI prompt in `openai_service.py` with "@rainbow_sprout", "@sadaham_kym", and "@kkangji_94" to act as a "Modern Hanbok Master" for 'Tradition-core' style, mixing traditional items with everyday wear.
- **Backend & Data**: Added new popular Modern Hanbok stores to `stores.json` (DAHAM, Navue Hanbok).

## [0.3.0] - 2026-02-21

### Added
- **Frontend**: Added Hotel Delivery feature in `MapPage.tsx` with a modal for specifying dates and hotel destinations for foreign travelers.
- **Frontend**: Upgraded the Store Map Card to display the image, name, and exact price of the specifically matched outfit item the user is looking for.
- **Frontend**: Added deep-link translation to KakaoMap, Google Maps, and Naver Map route search so they map to specific store names instead of arbitrary coordinates.
- **Frontend**: Extended bilingual store name mapping (`STORE_NAME_MAP`) to include global sports and fashion brands for better search coverage.
- **Frontend**: Refined the `speakKorean` text-to-speech payload in the Taxi Modal to read both the store name and address in a smooth, taxi-friendly phrase.

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

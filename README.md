# K-Fit: AI K-Fashion Travel Assistant

AI-powered K-Fashion styling, virtual fitting, store guide, and shopping route planner for travelers in Korea.

## Tech Stack
- **Backend**: FastAPI, Python 3.12
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **AI**: OpenAI GPT-4o, Google Gemini 2.5 Flash

## Setup

### Backend
**Option 1: Conda (Recommended)**
```bash
conda create -n kfit python=3.12 -y
conda activate kfit
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Option 2: venv**
```bash
cd backend

python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Generating Placeholder Images
The store data references images that are not included in the repo. You can generate placeholder images using the provided script:

```bash
python scripts/generate_images.py
```

## Environment Variables
Copy `.env.example` to `.env` and fill in your API keys.

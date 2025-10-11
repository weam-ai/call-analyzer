# Sales Call Analyzer

AI-powered sales call analysis with audio transcription, content scraping, and deep LLM insights.

## 🎧 Overview

The Sales Call Analyzer provides comprehensive AI-powered call analytics through three main services:

- **🎙 Audio Service** – Upload audio files for transcription and analysis
- **👻 Phantom Service** – Extract transcripts from URLs using headless browser technology
- **📝 Transcript Service** – Analyze pre-provided transcripts directly

## 🚀 Features

- **Multi-Service Analysis**: Support for audio files, URL scraping, and direct transcript input
- **AI-Powered Transcription**: Automatic audio-to-text conversion using Google Gemini API
- **Deep LLM Analysis**: Comprehensive insights including sentiment, key points, and recommendations
- **Modern UI**: Beautiful, responsive interface built with Next.js and Tailwind CSS
- **Real-time Processing**: Live status updates and progress tracking
- **Cost Tracking**: Monitor API usage and token costs
- **Secure Authentication**: JWT-based user authentication and authorization

## 🏗️ Architecture

### Backend (Node.js)
- **Express.js** REST API
- **MongoDB** with Mongoose ODM
- **Google Gemini API** for AI processing
- **Playwright** for web scraping
- **JWT** authentication
- **Winston** logging
- **Multer** file upload handling

### Frontend (Next.js)
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Radix UI** components
- **React Hook Form** for form handling
- **Axios** for API communication

## 📁 Project Structure

```
sales_call_analyzer/
├── Nodejs/                 # Backend API
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── database/       # Database setup
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   └── package.json
├── Nextjs/                 # Frontend application
│   ├── src/
│   │   ├── app/           # Next.js app directory
│   │   ├── components/    # React components
│   │   ├── lib/           # Utility libraries
│   │   └── types/         # TypeScript types
│   └── package.json
└── README.md
```

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- MongoDB
- Google Gemini API key

### Backend Setup

1. Navigate to the backend directory:
```bash
cd Nodejs
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
PORT=5001
MONOGODB_URI=mongodb://localhost:27017/sales_call_analyzer
GEMINI_API_KEY=your_gemini_api_key
```

5. Start the backend server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd Nextjs
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Configure environment variables in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

5. Start the frontend development server:
```bash
npm run dev
```

## 🔧 API Services

### Audio Service
- Upload audio files (MP3, WAV, M4A, AAC, OGG, FLAC)
- Automatic transcription using Gemini API
- File size and duration validation
- Optional additional context from URLs

### Phantom Service
- Extract transcripts from web pages
- Uses Playwright for headless browser automation
- Supports various transcript formats
- Optional additional content scraping

### Transcript Service
- Direct transcript analysis
- Support for various transcript formats
- Optional additional context integration
- Real-time validation and processing

## 📊 Analysis Features

- **Call Summary**: Comprehensive overview of the conversation
- **Sentiment Analysis**: Overall sentiment with confidence scores
- **Key Insights**: Important points and observations
- **Action Items**: Specific next steps and tasks
- **Participant Analysis**: Speaker identification and speaking time
- **Recommendations**: Improvement suggestions
- **Risk Factors**: Potential issues and concerns
- **Opportunities**: Growth and development areas

## 🔐 Security

- JWT-based authentication
- File upload validation
- Rate limiting
- CORS protection
- Input sanitization
- Error handling

## 📈 Monitoring

- Comprehensive logging with Winston
- API usage tracking
- Cost monitoring
- Performance metrics
- Error tracking

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB database
2. Configure environment variables
3. Deploy to your preferred platform (Heroku, AWS, etc.)
4. Set up process management (PM2)

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to Vercel, Netlify, or your preferred platform
3. Configure environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the repository.

---

Built with ❤️ using Node.js, Next.js, and AI technology.

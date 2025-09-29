# Audio Upload and Analysis with Gemini Files API

This implementation provides comprehensive audio file upload and analysis capabilities using Google's Gemini Files API. It allows users to upload audio files, transcribe them, and perform detailed sales call analysis.

## Features

- **Audio File Upload**: Support for multiple audio formats (MP3, WAV, M4A, AAC, OGG, FLAC, etc.)
- **Gemini Files API Integration**: Uses Google's Files API for efficient file handling
- **Automatic Transcription**: Converts audio to text using Gemini's multimodal capabilities
- **Comprehensive Analysis**: Detailed sales call analysis with ratings and insights
- **File Management**: Upload, list, and delete files with metadata tracking
- **RESTful API**: Complete REST API for frontend integration

## Supported Audio Formats

- MP3 (audio/mpeg)
- WAV (audio/wav)
- M4A (audio/mp4)
- AAC (audio/aac)
- OGG (audio/ogg)
- FLAC (audio/flac)
- WMA (audio/x-ms-wma)
- AIFF (audio/aiff)
- AU (audio/basic)

## File Size Limits

- Maximum file size: 100MB
- Files are automatically deleted after 48 hours (Gemini Files API limitation)

## API Endpoints

### Upload and Analysis

#### POST `/api/audio-analysis/upload`
Upload an audio file and start analysis.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Headers: Authorization: Bearer {token}

**Form Data:**
- `audioFile` (file, required): Audio file to upload
- `additionalContent` (string, optional): Additional context for analysis
- `websiteUrl` (string, optional): Website URL for context
- `analysisType` (string, optional): Type of analysis (comprehensive, basic, transcript-only)

**Response:**
```json
{
  "success": true,
  "message": "Audio file uploaded and analysis started",
  "data": {
    "analysisId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "status": "processing",
    "serviceType": "audio_upload",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### GET `/api/audio-analysis/:id`
Get analysis by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "userId": "64f8a1b2c3d4e5f6a7b8c9d1",
    "serviceType": "audio_upload",
    "status": "completed",
    "results": {
      "callDescription": "Sales call between sales rep and prospect",
      "summary": "Detailed call summary...",
      "callRating": 7,
      "callRatingBreakdown": {
        "engagementQuality": 8,
        "responsiveness": 7,
        "discoverySkills": 6,
        "valueProposition": 8,
        "objectionHandling": 0,
        "closingAttempts": 9,
        "followUpPlanning": 8,
        "overallCallFlow": 7
      },
      "prospectDemographics": {
        "teamSize": "10-50 employees",
        "workVolume": "High",
        "location": "United States",
        "previousExperience": "Some experience with similar tools",
        "likelihoodOfClosing": "70%",
        "website": "https://example.com",
        "businessSummary": "Technology company focused on..."
      },
      "salesPerformance": {
        "responsiveness": "Good",
        "satisfaction": "High",
        "engagement": "High"
      },
      "keyInsights": [
        "Prospect showed strong interest in premium features",
        "Budget flexibility was mentioned",
        "Decision timeline is 2-3 weeks"
      ],
      "recommendations": [
        "Follow up with detailed proposal within 48 hours",
        "Schedule product demo for next week",
        "Address pricing concerns proactively"
      ],
      "otherNotableFindings": [
        "Prospect mentioned competitor evaluation",
        "Technical requirements were clearly defined"
      ],
      "salesOpportunities": {
        "productServiceGap": ["Premium support not discussed"],
        "upsellingOpportunities": [
          {
            "opportunity": "Premium analytics package",
            "relevance": 4,
            "likelihood": 3,
            "revenueImpact": 4
          }
        ],
        "crossSellingOpportunities": [
          {
            "opportunity": "Integration services",
            "relevance": 3,
            "likelihood": 2,
            "revenueImpact": 3
          }
        ]
      }
    },
    "processing": {
      "upload": {
        "fileName": "files/abc123def456",
        "uri": "gs://generativeai-files/abc123def456",
        "mimeType": "audio/mpeg",
        "sizeBytes": 5242880,
        "state": "ACTIVE"
      },
      "transcript": {
        "text": "Speaker 1: Hello, thank you for taking the time...",
        "confidence": 0.85,
        "language": "en",
        "wordCount": 1250
      },
      "llmAnalysis": {
        "prompt": "Comprehensive audio analysis prompt",
        "response": "{...}",
        "model": "gemini-2.5-flash",
        "processingTime": 45000
      }
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "metadata": {
      "completedAt": "2024-01-15T10:31:30.000Z"
    }
  }
}
```

#### GET `/api/audio-analysis`
Get all analyses for the authenticated user.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 100)
- `serviceType` (string, optional): Filter by service type
- `status` (string, optional): Filter by status

#### DELETE `/api/audio-analysis/:id`
Delete analysis and associated files.

#### POST `/api/audio-analysis/:id/retry`
Retry a failed analysis.

#### GET `/api/audio-analysis/:id/export`
Export analysis data.

**Query Parameters:**
- `format` (string, optional): Export format (json, csv)

### File Management

#### GET `/api/audio-analysis/files/list`
List uploaded files.

**Query Parameters:**
- `pageSize` (number, optional): Number of files to return (default: 10, max: 100)

#### GET `/api/audio-analysis/files/:fileName/metadata`
Get file metadata.

#### POST `/api/audio-analysis/cleanup`
Cleanup old files.

### Statistics

#### GET `/api/audio-analysis/stats/overview`
Get analysis statistics.

## Usage Examples

### JavaScript/Node.js

```javascript
const FormData = require('form-data');
const axios = require('axios');

// Upload audio file
const formData = new FormData();
formData.append('audioFile', fs.createReadStream('audio.mp3'));
formData.append('additionalContent', 'Sales call with potential client');
formData.append('websiteUrl', 'https://client-website.com');
formData.append('analysisType', 'comprehensive');

const response = await axios.post(
  'http://localhost:5000/api/audio-analysis/upload',
  formData,
  {
    headers: {
      ...formData.getHeaders(),
      'Authorization': `Bearer ${authToken}`
    }
  }
);

console.log('Analysis ID:', response.data.data.analysisId);
```

### cURL

```bash
# Upload audio file
curl -X POST \
  http://localhost:5000/api/audio-analysis/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "audioFile=@audio.mp3" \
  -F "additionalContent=Sales call with client" \
  -F "websiteUrl=https://client-website.com" \
  -F "analysisType=comprehensive"

# Get analysis results
curl -X GET \
  http://localhost:5000/api/audio-analysis/ANALYSIS_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Frontend (React/JavaScript)

```javascript
const uploadAudioFile = async (file, additionalContent = '') => {
  const formData = new FormData();
  formData.append('audioFile', file);
  formData.append('additionalContent', additionalContent);
  formData.append('analysisType', 'comprehensive');

  const response = await fetch('/api/audio-analysis/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: formData
  });

  return response.json();
};

// Usage
const fileInput = document.getElementById('audioFile');
const file = fileInput.files[0];

uploadAudioFile(file, 'Sales call analysis')
  .then(result => {
    console.log('Upload successful:', result);
    // Poll for completion
    pollAnalysisStatus(result.data.analysisId);
  })
  .catch(error => {
    console.error('Upload failed:', error);
  });
```

## Testing

### Run the Test Script

1. Place a test audio file named `test.m4a` in the Node.js directory
2. Start the server: `npm start`
3. Run the test: `node test-audio-upload.js`

The test script will:
1. Register/login a test user
2. Upload the audio file
3. Wait for analysis completion
4. Display detailed results
5. Show statistics

### Manual Testing

1. Start the server
2. Register/login via `/api/auth/register` or `/api/auth/login`
3. Upload an audio file via `/api/audio-analysis/upload`
4. Check analysis status via `/api/audio-analysis/:id`
5. View results when analysis completes

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400 Bad Request`: Invalid input or file format
- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: Analysis or file not found
- `413 Payload Too Large`: File size exceeds limit
- `415 Unsupported Media Type`: Unsupported audio format
- `500 Internal Server Error`: Server error

## Configuration

### Environment Variables

```env
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=development
PORT=5000
```

### File Upload Limits

- Maximum file size: 100MB (configurable in multer)
- Supported formats: MP3, WAV, M4A, AAC, OGG, FLAC, WMA, AIFF, AU
- Files are stored temporarily and deleted after 48 hours

## Security Considerations

- All endpoints require authentication
- File uploads are validated for type and size
- Temporary files are cleaned up automatically
- Rate limiting is applied to prevent abuse
- CORS is configured for security

## Performance Notes

- Large audio files may take several minutes to process
- Transcription and analysis are performed asynchronously
- Files are automatically deleted after 48 hours to save storage
- Consider implementing progress tracking for long-running analyses

## Troubleshooting

### Common Issues

1. **File Upload Fails**
   - Check file format is supported
   - Verify file size is under 100MB
   - Ensure authentication token is valid

2. **Analysis Stuck in Processing**
   - Check server logs for errors
   - Verify Gemini API key is valid
   - Try retrying the analysis

3. **Transcription Quality Issues**
   - Ensure audio quality is good
   - Check if speakers are clearly audible
   - Consider using higher quality audio files

4. **API Rate Limits**
   - Implement exponential backoff
   - Consider caching results
   - Monitor API usage

### Debug Mode

Enable debug logging by setting:
```env
LOG_LEVEL=debug
```

This will provide detailed logs of the upload and analysis process.

## Future Enhancements

- Real-time progress tracking
- Batch file upload support
- Custom analysis templates
- Integration with CRM systems
- Advanced audio preprocessing
- Multi-language support
- Speaker identification and separation


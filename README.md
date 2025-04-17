# Voice Gender Recognition App

A full-stack application that predicts gender based on voice characteristics using machine learning. The project consists of a React Native mobile app frontend and a Flask backend server with a trained machine learning model. The app also provides voice transcription and similarity scoring capabilities using AssemblyAI.

## Project Structure

```
VoiceGenderApp/
├── FlaskServer/           # Backend server
│   ├── app.py            # Main Flask application
│   ├── utils.py          # Utility functions for audio processing
│   ├── models/           # Trained ML model
│   │   └── model.h5      # Saved model weights
│   ├── uploads/          # Temporary storage for uploaded audio files
│   └── samples/          # Sample audio files
│
├── ReactNativeApp/       # Frontend mobile application
│   ├── app/              # Main application code
│   ├── assets/           # Static assets
│   └── ...              # Configuration files
│
└── VoiceBasedGenderRecognition.ipynb  # Jupyter notebook for model training
```

## Features

- Voice recording and analysis
- Real-time gender prediction
- Voice transcription using AssemblyAI
- Transcription similarity scoring
- Modern and intuitive mobile interface
- Secure file handling
- Cross-platform support (iOS and Android)

## Technology Stack

### Backend
- Python 3.x
- Flask
- Machine Learning (TensorFlow/Keras)
- Audio processing libraries
- Jupyter Notebook for model training
- AssemblyAI API for transcription

### Frontend
- React Native with Expo SDK 52
- TypeScript
- NativeWind (Tailwind CSS for React Native)
- Expo AV (Audio/Video handling)
- Expo Router for navigation
- Expo File System for file operations

## Model Training

The machine learning model was trained using a Jupyter notebook (`VoiceBasedGenderRecognition.ipynb`). The notebook contains:
- Data preprocessing
- Feature extraction from audio files
- Model architecture definition
- Training process
- Model evaluation
- Saving the trained weights as `model.h5`

The saved model weights are used by the Flask backend for making predictions.

## Prerequisites

- Node.js and npm
- Python 3.x
- Expo CLI
- Flask
- Jupyter Notebook
- AssemblyAI API key
- Required Python packages (for backend)
- Required npm packages (for frontend)

## Installation

### Backend Setup

1. Navigate to the FlaskServer directory:
```bash
cd FlaskServer
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Set up your AssemblyAI API key:
```bash
export ASSEMBLYAI_API_KEY='your-api-key-here'
```

4. Start the Flask server:
```bash
python app.py
```

The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the ReactNativeApp directory:
```bash
cd ReactNativeApp
```

2. Install dependencies:
```bash
npm install
```

3. Start the Expo development server:
```bash
npx expo start
```

4. Use Expo Go app on your mobile device to scan the QR code, or run on an emulator

## Usage

1. Launch the mobile app or open the web app
2. Record a voice sample or select an existing audio file
3. Submit the audio for analysis
4. View the results:
   - Gender prediction with confidence score
   - Transcription similarity score (if enabled)

## API Endpoints

- `GET /`: Home endpoint
- `GET /text`: Get sample text for transcription

- `POST /predict`: Accepts WAV audio file and returns:
  - Gender prediction
  - Confidence score
- `POST /transcribe`: Accepts WAV audio file and returns:
  - Transcription (if enabled)
  - Similarity score

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to all contributors who have helped shape this project
- Special thanks to the open-source community for the tools and libraries used
- AssemblyAI for providing the transcription API 
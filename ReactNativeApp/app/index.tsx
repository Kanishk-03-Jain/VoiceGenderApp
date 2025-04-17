import React, { useState, useEffect } from 'react';
import { Text, View, Button, ActivityIndicator, StyleSheet, Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';

const BASE_URL = 'http://192.168.1.4:5000';

export default function Index() {
  const [prediction, setPrediction] = useState<string | null>(null);
  const [transcription_score, setTranscription_score] = useState<string | null>(null);
  const [transcription_text, setTranscription_text] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    return () => {
      if (recording && isRecording) {
        recording.stopAndUnloadAsync().catch(console.error);
      }
    };
  }, [recording, isRecording]);

  useEffect(() => {
    getTranscriptionText();
  }, []);

  async function startRecording() {
    try {
      console.log('Requesting permissions...');
      const permissionResponse = await Audio.requestPermissionsAsync();
      console.log('Permission response:', permissionResponse);
      
      if (permissionResponse.status !== 'granted') {
        Alert.alert('Permission required', 'Please grant microphone access to record audio');
        return;
      }
      
      console.log('Setting audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      console.log('Starting recording...');
      // Use a format supported on web platform
      const { recording } = await Audio.Recording.createAsync({
        isMeteringEnabled: true,
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.MAX,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });
      
      console.log('Recording started successfully');
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Recording error:', err);
      Alert.alert('Failed to start recording', 'Please try again');
    }
  }

  async function stopRecording() {
    if (!recording) return;

    try {
      console.log('Stopping recording...');
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log('Recording stopped, URI:', uri);
      setRecording(null);
      
      if (uri) {
        await uploadAudioFile(uri);
      } else {
        console.error('No URI returned from recording');
        Alert.alert('Error', 'Failed to get recording file');
      }
    } catch (err) {
      console.error('Stop recording error:', err);
      Alert.alert('Failed to stop recording', 'Please try again');
    }
  }

  async function getTranscriptionText() {
    try {
      const response = await fetch(`${BASE_URL}/text`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Transcription text:', data);
      setTranscription_text(data.text);
    } catch (error) { 
      console.error('Error fetching transcription text:', error);
    }
  }

  async function uploadAudioFile(fileUri?: string) {
    try {
      setIsLoading(true);
      
      // Use provided URI or default to the pre-recorded file
      const uri = fileUri || require('../assets/female.wav');
      console.log('File URI:', uri);
      
      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        // For web platform, we need to fetch the file first
        const response = await fetch(uri);
        const blob = await response.blob();
        
        // Convert WebM to WAV if needed
        if (blob.type === 'audio/webm') {
          // Create an audio context
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const arrayBuffer = await blob.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const wavBlob = await convertToWav(audioBuffer);
          formData.append('file', wavBlob, 'audio.wav');
        } else {
          formData.append('file', blob, 'audio.wav');
        }
      } else {
        // For mobile platforms
        formData.append('file', {
          uri,
          name: 'audio.wav',
          type: 'audio/wav',
        } as any);
      }
      
      console.log('Sending request to server...');
      const gender_response = await fetch('http://192.168.1.4:5000/predict', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!gender_response.ok) {
        const errorText = await gender_response.text();
        throw new Error(`HTTP error! status: ${gender_response.status}, message: ${errorText}`);
      }
      
      const result = await gender_response.json();
      console.log('Prediction result:', result);
      setPrediction(result.gender + ", confidence: " + result.confidence || "No prediction returned.");
      const transcription_response = await fetch('http://192.168.1.4:5000/transcribe', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });
      if (!transcription_response.ok) {
        const errorText = await transcription_response.text();
        throw new Error(`HTTP error! status: ${transcription_response.status}, message: ${errorText}`);
      }
      const transcription_result = await transcription_response.json();
      console.log('Transcription result:', transcription_result);
      setTranscription_score(transcription_result.similarity);
    } catch (error) {
      console.error('Upload error:', error);
      setPrediction("Error occurred: " + (error instanceof Error ? error.message : String(error)));
      setTranscription_score("Error occurred: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice Gender Predictor</Text>

      <Text style={styles.title}>Sample Text: {transcription_text}</Text>

      <View style={styles.buttonContainer}>
        {!isRecording ? (
          <Button 
            title="Start Recording" 
            onPress={startRecording}
            color="#4CAF50"
          />
        ) : (
          <Button 
            title="Stop Recording" 
            onPress={stopRecording}
            color="#f44336"
          />
        )}
      </View>

      {isRecording && (
        <View style={styles.recordingContainer}>
          <Text style={styles.recordingText}>Recording in progress...</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button 
          title="Use Sample WAV File" 
          onPress={() => uploadAudioFile()}
          color="#2196F3"
        />
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}

      {prediction && !isLoading && (
        <View style={styles.predictionContainer}>
          <Text style={styles.predictionLabel}>Prediction Result:</Text>
          <Text style={styles.predictionText}>{prediction}</Text>
        </View>
      )}

      {transcription_score && !isLoading && (
        <View style={styles.predictionContainer}>
          <Text style={styles.predictionLabel}>Transcription Similarity Score:</Text>
          <Text style={styles.predictionText}>{transcription_score}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 24,
  },
  recordingContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  recordingText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#666',
  },
  predictionContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    maxWidth: 300,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
    elevation: 5,
  },
  predictionLabel: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  predictionText: {
    fontSize: 16,
    color: '#666',
  },
});

function convertToWav(audioBuffer: AudioBuffer): Promise<Blob> {
  return new Promise((resolve) => {
    const numOfChan = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numOfChan * 2;
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);
    const channels = [];
    let offset = 0;
    let pos = 0;

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numOfChan, true);
    view.setUint32(24, audioBuffer.sampleRate, true);
    view.setUint32(28, audioBuffer.sampleRate * 2 * numOfChan, true);
    view.setUint16(32, numOfChan * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, length, true);

    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }

    while (pos < audioBuffer.length) {
      for (let i = 0; i < numOfChan; i++) {
        const sample = Math.max(-1, Math.min(1, channels[i][pos]));
        view.setInt16(44 + offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
      pos++;
    }

    resolve(new Blob([buffer], { type: 'audio/wav' }));
  });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

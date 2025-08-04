import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';

// Suppress specific console errors for server issues
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  // Don't log JSON parse errors from server responses
  if (
    args.some((arg) => 
      typeof arg === 'string' && 
      (arg.includes('JSON Parse error') || 
       arg.includes('Internal Server Error') ||
       arg.includes('Response Text: Internal Server Error'))
    )
  ) {
    return; // Suppress these specific errors
  }
  originalConsoleError(...args);
};

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}

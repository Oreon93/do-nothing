import React, { useRef, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

const DEFAULT_SECONDS = 300; // 5 minutes

export const SessionTimer: React.FC = () => {
  const [seconds, setSeconds] = useState(DEFAULT_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const start = () => setIsRunning(true);
  const stop = () => setIsRunning(false);
  const reset = () => {
    setIsRunning(false);
    setSeconds(DEFAULT_SECONDS);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.timer}>{formatTime(seconds)}</Text>
      <View style={styles.buttonRow}>
        <Button title={isRunning ? 'Pause' : 'Start'} onPress={isRunning ? stop : start} />
        <Button title="Reset" onPress={reset} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  timer: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 24,
    letterSpacing: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
});

export default SessionTimer; 
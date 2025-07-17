import { Audio } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { usePreferences } from './PreferencesContext';

// Define constants outside the component
const DURATION_OPTIONS = [
  { label: 'Test (5s)', value: 0.0833 },
  { label: '5m', value: 5 },
  { label: '10m', value: 10 },
  { label: '15m', value: 15 },
  { label: '20m', value: 20 },
  { label: '30m', value: 30 },
];
const CIRCLE_RADIUS = 54;
const CIRCLE_CIRCUM = 2 * Math.PI * CIRCLE_RADIUS;
const ORB_HUE = '#cfe4e3';
const COMMON_SOUNDS = {
  Bell: require('../assets/sounds/bell.mp3'),
  Birds: require('../assets/sounds/birds.mp3'),
  Harp: require('../assets/sounds/harp.mp3'),
  None: null,
};

// Motivational quotes for doing nothing, peace, and mindfulness
const MOTIVATIONAL_QUOTES = [
  "Peace comes from within. Do not seek it without. – Buddha",
  "Sometimes the most productive thing you can do is relax. – Mark Black",
  "Almost everything will work again if you unplug it for a few minutes, including you. – Anne Lamott",
  "Don’t just do something, sit there. – Sylvia Boorstein",
  "The time to relax is when you don’t have time for it. – Sydney J. Harris",
  "Doing nothing is better than being busy doing nothing. – Lao Tzu",
  "There is more to life than increasing its speed. – Mahatma Gandhi",
  "Rest and be thankful. – William Wordsworth",
  "Sometimes sitting and doing nothing is the best something you can do. – Karen Salmansohn",
  "To do nothing at all is the most difficult thing in the world, the most difficult and the most intellectual. – Oscar Wilde",
  "It is nice finding that place where you can just go and relax. – Moises Arias",
  "The greatest weapon against stress is our ability to choose one thought over another. – William James",
  "Silence is sometimes the best answer.",
  "The quieter you become, the more you can hear. – Ram Dass",
  "Take rest; a field that has rested gives a bountiful crop. – Ovid",
  "Sometimes you need to step outside, get some air, and remind yourself of who you are and who you want to be.",
  "Doing nothing often leads to the very best of something. – Winnie the Pooh",
  "There is virtue in work and there is virtue in rest. Use both and overlook neither. – Alan Cohen",
  "Sometimes the best way to recharge is to unplug.",
  "The best cure for the body is a quiet mind. – Napoleon Bonaparte",
  "You don’t always need a plan. Sometimes you just need to breathe, trust, let go, and see what happens.",
  "Within you, there is a stillness and a sanctuary to which you can retreat at any time. – Hermann Hesse",
  "The mind is like water. When it’s turbulent, it’s difficult to see. When it’s calm, everything becomes clear.",
  "Sometimes the most important thing in a whole day is the rest we take between two deep breaths. – Etty Hillesum",
  "Slow down and everything you are chasing will come around and catch you. – John De Paola",
  "Take time to do what makes your soul happy.",
  "In the midst of movement and chaos, keep stillness inside of you. – Deepak Chopra",
  "There is a calmness to a life lived in gratitude, a quiet joy. – Ralph H. Blum",
  "The best time to relax is when you don’t have time for it.",
  "Sometimes you just need to be alone, with yourself, and do nothing.",
  "Rest is not idleness, and to lie sometimes on the grass under trees on a summer’s day, listening to the murmur of water, or watching the clouds float across the sky, is by no means a waste of time. – John Lubbock",
  "Stillness is where creativity and solutions to problems are found. – Eckhart Tolle",
  "Sometimes you need to slow down to move fast.",
  "Let silence take you to the core of life. – Rumi",
  "The art of resting is a part of the art of working. – John Steinbeck",
  "Be gentle with yourself, you’re doing the best you can.",
  "Take a deep breath. Let it go.",
  "You owe yourself the love that you so freely give to others.",
  "Breathe. Let go. And remind yourself that this very moment is the only one you know you have for sure. – Oprah Winfrey",
];

type SessionTimerProps = {
  initialDuration?: number;
  onSessionComplete?: () => void;
  onSessionStart?: () => void;
  onSessionStop?: () => void;
  sound?: keyof typeof COMMON_SOUNDS;
};

function SessionTimer({
  initialDuration = 0.0833,
  onSessionComplete,
  onSessionStart,
  onSessionStop,
  sound = 'Bell',
}: SessionTimerProps) {
  const [duration, setDuration] = useState(initialDuration);
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [isActive, setIsActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  // Animation states
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [progressValue] = useState(new Animated.Value(0)); // 0 = empty, 1 = full
  const [contentOpacity] = useState(new Animated.Value(1)); // Controls text/button visibility
  // Replace backgroundFade and finalFadeToWhite with a single Animated.Value for background phase
  const [backgroundPhase] = useState(new Animated.Value(0)); // 0: white, 1: black, 2: white
  const [progressBarColor] = useState(new Animated.Value(0)); // 0 = black, 1 = white
  const [completionTextOpacity] = useState(new Animated.Value(0)); // Completion text visibility
  
  const fontFamily = Platform.select({
    ios: 'Quicksand',
    android: 'sans-serif-thin',
    default: 'System',
  });

  const { showMotivation } = usePreferences ? usePreferences() : { showMotivation: true };
  // Motivational message state
  const [motivationalMsg, setMotivationalMsg] = useState('');
  const [motivationalOpacity] = useState(new Animated.Value(0));
  const motivationalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const motivationalStepRef = useRef(0); // 0: fade in, 1: visible, 2: fade out, 3: hidden

  // Helper to pick a new random quote
  function pickRandomQuote(prev?: string) {
    let quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    // Avoid repeating the same quote
    while (quote === prev && MOTIVATIONAL_QUOTES.length > 1) {
      quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    }
    return quote;
  }

  // Motivational message animation loop
  useEffect(() => {
    if (!showMotivation || isComplete || !isActive) {
      Animated.timing(motivationalOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
      if (motivationalTimerRef.current) clearTimeout(motivationalTimerRef.current);
      return;
    }
    let step = 0;
    let quote = pickRandomQuote();
    setMotivationalMsg(quote);
    motivationalOpacity.setValue(0);
    function runStep() {
      if (!isActive || isComplete) return;
      if (step === 0) {
        // Fade in
        Animated.timing(motivationalOpacity, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: true,
        }).start();
        motivationalTimerRef.current = setTimeout(() => {
          step = 1;
          runStep();
        }, 5000);
      } else if (step === 1) {
        // Stay visible
        motivationalTimerRef.current = setTimeout(() => {
          step = 2;
          runStep();
        }, 10000);
      } else if (step === 2) {
        // Fade out
        Animated.timing(motivationalOpacity, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
        }).start();
        motivationalTimerRef.current = setTimeout(() => {
          step = 3;
          runStep();
        }, 5000);
      } else if (step === 3) {
        // Hidden, pick new quote after 10s
        motivationalTimerRef.current = setTimeout(() => {
          step = 0;
          quote = pickRandomQuote(quote);
          setMotivationalMsg(quote);
          runStep();
        }, 10000);
      }
    }
    runStep();
    return () => {
      if (motivationalTimerRef.current) clearTimeout(motivationalTimerRef.current);
    };
  }, [showMotivation, isActive, isComplete]);

  // Fade out motivational message with completion text
  useEffect(() => {
    if (isComplete) {
      Animated.timing(motivationalOpacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [isComplete]);

  // Pulse animation for breathing orb
  useEffect(() => {
    let minScale = isActive ? 1 : 0.97;
    let maxScale = isActive ? 1.35 : 1;
    let pulseDuration = isComplete ? 600 : 2000;
    
    if (isComplete) {
      minScale = 1.1;
      maxScale = 1.6;
    }
    
    pulseAnim.setValue(minScale);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: maxScale,
          duration: pulseDuration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: minScale,
          duration: pulseDuration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim, isActive, isComplete]);

  // Update progress bar during timer
  useEffect(() => {
    if (isActive) {
      const progress = 1 - (timeLeft / (duration * 60));
      Animated.timing(progressValue, {
        toValue: progress,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [timeLeft, duration, isActive]);

  // Show progress bar when timer starts
  useEffect(() => {
    // The progress bar opacity is now always 1, so this effect is no longer needed.
  }, [isActive]);

  // Timer countdown logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time: number) => {
          if (time <= 1) {
            setIsActive(false);
            // Set progress bar to full before starting completion sequence
            progressValue.setValue(1);
            // Start completion sequence
            startCompletionSequence(sound);
            onSessionComplete?.();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, onSessionComplete, sound]);

  // Main completion sequence
  const startCompletionSequence = async (sound: keyof typeof COMMON_SOUNDS) => {
    let fadeToWhiteTimeout: number = 2200 + 800 + 2200 + 3000; // fallback: total animation time before fade to white, plus 3s hold
    let soundObj: Audio.Sound | null = null;
    let fadeOutDuration = 1000; // 1s fade out
    if (sound !== 'None') {
      try {
        soundObj = new Audio.Sound();
        await soundObj.loadAsync(COMMON_SOUNDS[sound] || COMMON_SOUNDS['Bell']);
        const status = await soundObj.getStatusAsync();
        if (status.isLoaded && status.durationMillis) {
          // Play sound immediately
          await soundObj.setVolumeAsync(1);
          await soundObj.playAsync();
          // Calculate when to start fade to white: (duration - 2000ms)
          fadeToWhiteTimeout = Math.max(0, status.durationMillis - 2000);
          fadeToWhiteTimeout += 3000;
        } else {
          // Play sound anyway
          await soundObj.setVolumeAsync(1);
          await soundObj.playAsync();
          fadeToWhiteTimeout = 2000;
          fadeToWhiteTimeout += 3000;
        }
      } catch (e) {
        soundObj = null;
        fadeToWhiteTimeout = 2000;
        fadeToWhiteTimeout += 3000;
      }
    } else {
      fadeToWhiteTimeout = 1000;
      fadeToWhiteTimeout += 3000;
    }

    // Start content fade out
    Animated.timing(contentOpacity, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      // Fade background to black and progress bar color to white in parallel
      Animated.parallel([
        Animated.timing(backgroundPhase, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: false,
        }),
        Animated.timing(progressBarColor, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: false,
        })
      ]).start(() => {
        // Progress bar reverse and completion text
        Animated.parallel([
          Animated.timing(progressValue, {
            toValue: 0,
            duration: 2200,
            useNativeDriver: false,
          }),
          Animated.timing(completionTextOpacity, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsComplete(true);
          // Schedule fade to white and sound fade-out
          setTimeout(() => {
            if (soundObj) {
              // Fade out sound
              let currentVolume = 1;
              const fadeStep = 0.1;
              const fadeInterval = setInterval(async () => {
                currentVolume -= fadeStep;
                if (currentVolume <= 0) currentVolume = 0;
                try {
                  const s = await soundObj!.getStatusAsync();
                  if (s.isLoaded) {
                    await soundObj!.setVolumeAsync(currentVolume);
                  }
                } catch {}
                if (currentVolume <= 0) {
                  clearInterval(fadeInterval);
                  try {
                    await soundObj!.stopAsync();
                    await soundObj!.unloadAsync();
                  } catch {}
                }
              }, fadeOutDuration / (1 / fadeStep));
            }
            finalFadeAndReset(fadeOutDuration);
          }, fadeToWhiteTimeout);
        });
      });
    });
  };

  // Final fade to white and reset everything
  const finalFadeAndReset = (fadeDuration = 1000) => {
    Animated.parallel([
      Animated.timing(backgroundPhase, {
        toValue: 2,
        duration: fadeDuration,
        useNativeDriver: false,
      }),
      Animated.timing(progressBarColor, {
        toValue: 1,
        duration: fadeDuration,
        useNativeDriver: false,
      }),
    ]).start(() => {
      // Reset all states
      resetToInitialState();
      // Fade everything back in
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundPhase, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ]).start();
    });
  };

  // Update resetToInitialState to accept an optional duration argument
  const resetToInitialState = (newDuration?: number) => {
    setIsComplete(false);
    setTimeLeft((newDuration ?? duration) * 60);
    progressValue.setValue(0);
    backgroundPhase.setValue(0);
    progressBarColor.setValue(0);
    completionTextOpacity.setValue(0);
  };

  // Update handleDurationChange to use the new value
  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
    resetToInitialState(newDuration);
  };

  // Handle start button
  const handleStart = () => {
    setIsActive(true);
    setIsComplete(false);
    onSessionStart?.();
  };

  // Handle stop button
  const handleStop = () => {
    setIsActive(false);
    onSessionStop?.();
  };

  // Handle reset button
  const handleReset = () => {
    setIsActive(false);
    resetToInitialState();
    setTimeLeft(duration * 60);
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const secs = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  // Interpolated values
  // 1. Fix background fade to black: ensure backgroundColor is correctly interpolated
  const backgroundColor = backgroundPhase.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['#ffffff', '#111216', '#ffffff'],
  });

  const progressStroke = progressBarColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['#222222', '#ffffff'],
  });

  const progressDashOffset = progressValue.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCLE_CIRCUM, 0],
  });

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  return (
    <Animated.View style={[styles.wrapper, { backgroundColor }]}>
      {/* Title */}
      <Animated.Text style={[styles.title, { fontFamily, opacity: contentOpacity }]}>
        Do nothing.
      </Animated.Text>

      {/* Duration Selector */}
      {!isActive && timeLeft !== 0 && (
        <Animated.View style={[styles.durationRow, { opacity: contentOpacity }]}>
          <Text style={[styles.durationLabel, { fontFamily }]}>Duration:</Text>
          <View style={styles.durationOptions}>
            {DURATION_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.label}
                onPress={() => handleDurationChange(opt.value)}
                style={[
                  styles.durationButton,
                  duration === opt.value && styles.durationButtonActive,
                ]}
              >
                <Text style={[
                  styles.durationButtonText,
                  duration === opt.value && styles.durationButtonTextActive,
                  { fontFamily }
                ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Timer Display with pulsing orb */}
      <View style={styles.timerDisplayWrapper}>
        {/* Orb */}
        {Platform.OS === 'web' ? (
          <Animated.View
            style={[
              styles.pulseOrb,
              {
                transform: [{ scale: pulseAnim }],
                filter: 'blur(17px)',
                backgroundColor: ORB_HUE,
                opacity: contentOpacity,
              },
            ]}
          />
        ) : (
          <Animated.View style={[styles.pulseOrb, { transform: [{ scale: pulseAnim }], opacity: contentOpacity }]}>
            <Svg width={180} height={180} style={{ position: 'absolute', top: 0, left: 0 }}>
              <Defs>
                <RadialGradient id="orbGradient" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#f8fafc" stopOpacity="0.9" />
                  <Stop offset="100%" stopColor="#e0e7ef" stopOpacity="0.3" />
                </RadialGradient>
              </Defs>
              <Circle cx={90} cy={90} r={90} fill="url(#orbGradient)" />
            </Svg>
            <Animated.View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: ORB_HUE,
                opacity: pulseAnim.interpolate({
                  inputRange: [0.97, 1.25],
                  outputRange: [0, 0.18],
                  extrapolate: 'clamp',
                }) * contentOpacity,
                borderRadius: 90,
              }}
            />
          </Animated.View>
        )}

        {/* Timer Text */}
        <View style={styles.timerDisplay}>
          <Animated.Text style={[styles.timerText, { fontFamily, opacity: contentOpacity }]}>
            {formatTime(timeLeft)}
          </Animated.Text>
          <Animated.Text style={[styles.statusText, { fontFamily, opacity: contentOpacity }]}>
            {isActive ? 'Doing nothing...' : (!isComplete && timeLeft !== 0 ? 'Ready to begin' : '')}
          </Animated.Text>
        </View>

        {/* Completion Text */}
        <Animated.View style={[styles.completionDisplay, { opacity: completionTextOpacity }]}> 
          <Text style={[styles.timesUpText, { fontFamily }]}>Time's up!</Text>
        </Animated.View>

        {/* Progress Circle */}
        <Animated.View style={[styles.progressCircleWrapper, { opacity: 1 }]}> 
          <View style={{ transform: [{ rotate: '-90deg' }] }}> 
            <Svg width={180} height={180} viewBox="0 0 120 120"> 
              <AnimatedCircle 
                cx={60} 
                cy={60} 
                r={CIRCLE_RADIUS} 
                fill="none" 
                stroke={progressStroke} 
                strokeWidth={2} 
                strokeLinecap="round" 
                strokeDasharray={CIRCLE_CIRCUM} 
                strokeDashoffset={progressDashOffset} 
              /> 
            </Svg> 
          </View> 
        </Animated.View>
      </View>

      {/* Congratulatory message below the timer */}
      <Animated.View style={{ opacity: completionTextOpacity, alignItems: 'center', marginBottom: 16 }}>
          <Text style={[styles.completionText, { fontFamily }]}>Well done - you did nothing for {duration} minutes.</Text>
      </Animated.View>

      {/* Motivational message above stop button */}
      {showMotivation && isActive && !isComplete && motivationalMsg && (
        <Animated.View style={{ opacity: motivationalOpacity, alignItems: 'center', marginBottom: 8, minHeight: 30 }}>
          <Text style={{ fontSize: 16, color: '#444', fontStyle: 'italic', textAlign: 'center', paddingHorizontal: 16 }}>{motivationalMsg}</Text>
        </Animated.View>
      )}

      {/* Control Buttons */}
      <Animated.View style={[styles.buttonRow, { opacity: contentOpacity }]}>
        {!isActive && timeLeft !== 0 && (
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Text style={[styles.startButtonText, { fontFamily }]}> 
              {timeLeft !== duration * 60 ? 'Continue doing nothing' : 'Start doing nothing'}
            </Text>
          </TouchableOpacity>
        )}
        
        {isActive && (
          <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
            <Text style={[styles.stopButtonText, { fontFamily }]}>Stop</Text>
          </TouchableOpacity>
        )}
        
        {!isActive && timeLeft !== duration * 60 && timeLeft !== 0 && (
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={[styles.resetButtonText, { fontFamily }]}>Reset</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    marginBottom: 16,
    letterSpacing: 1.5,
    color: '#222',
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  durationLabel: {
    fontSize: 16,
    fontWeight: '400',
    marginRight: 8,
    color: '#222',
  },
  durationOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  durationButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 2,
    shadowColor: '#b0bfc0',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  durationButtonActive: {
    backgroundColor: ORB_HUE,
  },
  durationButtonText: {
    fontWeight: '400',
    fontSize: 15,
    color: '#222',
  },
  durationButtonTextActive: {
    color: '#222',
  },
  timerDisplayWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    width: 180,
    height: 180,
    position: 'relative',
    marginTop: 40,
  },
  pulseOrb: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: ORB_HUE,
    zIndex: 0,
  },
  timerDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    width: 180,
    height: 180,
    zIndex: 2,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '300',
    marginBottom: 2,
    letterSpacing: 2,
    color: '#222',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '300',
    color: '#222',
  },
  completionDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    width: 180,
    height: 180,
    zIndex: 3,
  },
  timesUpText: {
    fontSize: 24,
    fontWeight: '300',
    marginBottom: 8,
    letterSpacing: 1.5,
    textAlign: 'center',
    color: '#fff',
  },
  completionText: {
    fontSize: 15,
    fontWeight: '300',
    textAlign: 'center',
    color: '#fff',
  },
  progressCircleWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 180,
    height: 180,
    zIndex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 16,
  },
  startButton: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    marginHorizontal: 4,
    shadowColor: '#b0bfc0',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  startButtonText: {
    fontWeight: '400',
    fontSize: 16,
    letterSpacing: 1,
    color: '#222',
  },
  stopButton: {
    backgroundColor: '#222',
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    marginHorizontal: 4,
    shadowColor: '#b0bfc0',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  stopButtonText: {
    fontWeight: '400',
    fontSize: 16,
    letterSpacing: 1,
    color: '#fff',
  },
  resetButton: {
    backgroundColor: ORB_HUE,
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    marginHorizontal: 4,
    shadowColor: '#b0bfc0',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  resetButtonText: {
    fontWeight: '400',
    fontSize: 16,
    letterSpacing: 1,
    color: '#222',
  },
});

export default SessionTimer;
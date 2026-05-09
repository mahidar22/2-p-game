import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Dimensions,
  Animated,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../styles/theme';

const { width, height } = Dimensions.get('window');

const CAR_TYPES = [
  { id: 'formula', emoji: '🏎️', label: 'Formula', topSpeed: 10, acceleration: 0.8, handling: 0.6, braking: 0.7, color: '#FF6B6B' },
  { id: 'muscle', emoji: '🚗', label: 'Muscle', topSpeed: 8, acceleration: 0.9, handling: 0.5, braking: 0.6, color: '#FFD700' },
  { id: 'sports', emoji: '🏁', label: 'Sports', topSpeed: 9, acceleration: 0.7, handling: 0.8, braking: 0.8, color: '#4ECDC4' },
  { id: 'rally', emoji: '🚙', label: 'Rally', topSpeed: 7, acceleration: 0.85, handling: 0.9, braking: 0.75, color: '#2ECC71' },
  { id: 'super', emoji: '⚡', label: 'Super', topSpeed: 11, acceleration: 0.6, handling: 0.7, braking: 0.65, color: '#9B59B6' },
  { id: 'retro', emoji: '🚕', label: 'Retro', topSpeed: 6, acceleration: 0.95, handling: 0.85, braking: 0.9, color: '#E67E22' },
];

const TRACK_TYPES = [
  { id: 'oval', label: 'Speed Oval', emoji: '🏟️', laps: 5, segments: 12, difficulty: 'Easy', color: '#4ECDC4' },
  { id: 'circuit', label: 'Grand Circuit', emoji: '🏁', laps: 4, segments: 16, difficulty: 'Medium', color: '#FFD700' },
  { id: 'mountain', label: 'Mountain Pass', emoji: '⛰️', laps: 3, segments: 20, difficulty: 'Hard', color: '#FF6B6B' },
  { id: 'night', label: 'Night City', emoji: '🌃', laps: 4, segments: 14, difficulty: 'Medium', color: '#9B59B6' },
  { id: 'desert', label: 'Desert Storm', emoji: '🏜️', laps: 3, segments: 18, difficulty: 'Hard', color: '#E67E22' },
];

const SEGMENT_TYPES = [
  { type: 'straight', emoji: '━', label: 'Straight', speedBonus: 1.0, slipChance: 0.02, icon: '➡️' },
  { type: 'gentle_turn', emoji: '╮', label: 'Gentle Turn', speedBonus: 0.85, slipChance: 0.08, icon: '↗️' },
  { type: 'sharp_turn', emoji: '╗', label: 'Sharp Turn', speedBonus: 0.65, slipChance: 0.18, icon: '↩️' },
  { type: 'hairpin', emoji: '⤵', label: 'Hairpin', speedBonus: 0.45, slipChance: 0.30, icon: '🔄' },
  { type: 'chicane', emoji: '⟿', label: 'Chicane', speedBonus: 0.55, slipChance: 0.25, icon: '〰️' },
  { type: 'hill', emoji: '⛰', label: 'Hill', speedBonus: 0.75, slipChance: 0.10, icon: '📈' },
  { type: 'boost', emoji: '⚡', label: 'Boost Pad', speedBonus: 1.5, slipChance: 0.05, icon: '🚀' },
  { type: 'oil', emoji: '🛢️', label: 'Oil Slick', speedBonus: 0.70, slipChance: 0.40, icon: '💦' },
];

const WEATHER_TYPES = [
  { id: 'sunny', emoji: '☀️', label: 'Sunny', gripModifier: 1.0, speedModifier: 1.0, visibility: 1.0 },
  { id: 'cloudy', emoji: '☁️', label: 'Cloudy', gripModifier: 0.95, speedModifier: 1.0, visibility: 0.95 },
  { id: 'rain', emoji: '🌧️', label: 'Rain', gripModifier: 0.70, speedModifier: 0.90, visibility: 0.80 },
  { id: 'storm', emoji: '⛈️', label: 'Storm', gripModifier: 0.55, speedModifier: 0.80, visibility: 0.60 },
  { id: 'fog', emoji: '🌫️', label: 'Fog', gripModifier: 0.85, speedModifier: 0.85, visibility: 0.50 },
];

export default function SlotCarsGame({ navigation }) {
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [raceNumber, setRaceNumber] = useState(1);
  const [maxRaces] = useState(3);
  const [gameActive, setGameActive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gamePhase, setGamePhase] = useState('setup');

  // Track & weather
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [trackSegments, setTrackSegments] = useState([]);
  const [weather, setWeather] = useState(WEATHER_TYPES[0]);

  // Player 1
  const [p1Car, setP1Car] = useState(null);
  const [p1Speed, setP1Speed] = useState(0);
  const [p1Position, setP1Position] = useState(0);
  const [p1Lap, setP1Lap] = useState(0);
  const [p1Throttle, setP1Throttle] = useState(false);
  const [p1Braking, setP1Braking] = useState(false);
  const [p1SlipOff, setP1SlipOff] = useState(false);
  const [p1BestLap, setP1BestLap] = useState(null);
  const [p1LapStart, setP1LapStart] = useState(0);
  const [p1Nitro, setP1Nitro] = useState(3);
  const [p1NitroActive, setP1NitroActive] = useState(false);
  const [p1TotalTime, setP1TotalTime] = useState(0);
  const [p1Finished, setP1Finished] = useState(false);
  const [p1SlipCount, setP1SlipCount] = useState(0);

  // Player 2
  const [p2Car, setP2Car] = useState(null);
  const [p2Speed, setP2Speed] = useState(0);
  const [p2Position, setP2Position] = useState(0);
  const [p2Lap, setP2Lap] = useState(0);
  const [p2Throttle, setP2Throttle] = useState(false);
  const [p2Braking, setP2Braking] = useState(false);
  const [p2SlipOff, setP2SlipOff] = useState(false);
  const [p2BestLap, setP2BestLap] = useState(null);
  const [p2LapStart, setP2LapStart] = useState(0);
  const [p2Nitro, setP2Nitro] = useState(3);
  const [p2NitroActive, setP2NitroActive] = useState(false);
  const [p2TotalTime, setP2TotalTime] = useState(0);
  const [p2Finished, setP2Finished] = useState(false);
  const [p2SlipCount, setP2SlipCount] = useState(0);

  // Race state
  const [raceTime, setRaceTime] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [racePosition, setRacePosition] = useState({ p1: 1, p2: 2 });

  // Refs for current values in intervals
  const p1SpeedRef = useRef(0);
  const p2SpeedRef = useRef(0);
  const p1PositionRef = useRef(0);
  const p2PositionRef = useRef(0);
  const p1LapRef = useRef(0);
  const p2LapRef = useRef(0);
  const p1ThrottleRef = useRef(false);
  const p2ThrottleRef = useRef(false);
  const p1BrakingRef = useRef(false);
  const p2BrakingRef = useRef(false);
  const p1SlipOffRef = useRef(false);
  const p2SlipOffRef = useRef(false);
  const p1FinishedRef = useRef(false);
  const p2FinishedRef = useRef(false);
  const p1NitroActiveRef = useRef(false);
  const p2NitroActiveRef = useRef(false);
  const p1CarRef = useRef(null);
  const p2CarRef = useRef(null);
  const weatherRef2 = useRef(WEATHER_TYPES[0]);
  const trackSegmentsRef = useRef([]);
  const selectedTrackRef = useRef(null);
  const raceTimeRef = useRef(0);
  const p1LapStartRef = useRef(0);
  const p2LapStartRef = useRef(0);
  const p1BestLapRef = useRef(null);
  const p2BestLapRef = useRef(null);
  const gamePhaseRef = useRef('setup');
  const raceEndedRef = useRef(false);

  // Sync refs
  useEffect(() => { p1SpeedRef.current = p1Speed; }, [p1Speed]);
  useEffect(() => { p2SpeedRef.current = p2Speed; }, [p2Speed]);
  useEffect(() => { p1PositionRef.current = p1Position; }, [p1Position]);
  useEffect(() => { p2PositionRef.current = p2Position; }, [p2Position]);
  useEffect(() => { p1LapRef.current = p1Lap; }, [p1Lap]);
  useEffect(() => { p2LapRef.current = p2Lap; }, [p2Lap]);
  useEffect(() => { p1ThrottleRef.current = p1Throttle; }, [p1Throttle]);
  useEffect(() => { p2ThrottleRef.current = p2Throttle; }, [p2Throttle]);
  useEffect(() => { p1BrakingRef.current = p1Braking; }, [p1Braking]);
  useEffect(() => { p2BrakingRef.current = p2Braking; }, [p2Braking]);
  useEffect(() => { p1SlipOffRef.current = p1SlipOff; }, [p1SlipOff]);
  useEffect(() => { p2SlipOffRef.current = p2SlipOff; }, [p2SlipOff]);
  useEffect(() => { p1FinishedRef.current = p1Finished; }, [p1Finished]);
  useEffect(() => { p2FinishedRef.current = p2Finished; }, [p2Finished]);
  useEffect(() => { p1NitroActiveRef.current = p1NitroActive; }, [p1NitroActive]);
  useEffect(() => { p2NitroActiveRef.current = p2NitroActive; }, [p2NitroActive]);
  useEffect(() => { p1CarRef.current = p1Car; }, [p1Car]);
  useEffect(() => { p2CarRef.current = p2Car; }, [p2Car]);
  useEffect(() => { weatherRef2.current = weather; }, [weather]);
  useEffect(() => { trackSegmentsRef.current = trackSegments; }, [trackSegments]);
  useEffect(() => { selectedTrackRef.current = selectedTrack; }, [selectedTrack]);
  useEffect(() => { raceTimeRef.current = raceTime; }, [raceTime]);
  useEffect(() => { p1LapStartRef.current = p1LapStart; }, [p1LapStart]);
  useEffect(() => { p2LapStartRef.current = p2LapStart; }, [p2LapStart]);
  useEffect(() => { p1BestLapRef.current = p1BestLap; }, [p1BestLap]);
  useEffect(() => { p2BestLapRef.current = p2BestLap; }, [p2BestLap]);
  useEffect(() => { gamePhaseRef.current = gamePhase; }, [gamePhase]);

  // Animations
  const countdownAnim = useRef(new Animated.Value(1)).current;
  const p1ShakeAnim = useRef(new Animated.Value(0)).current;
  const p2ShakeAnim = useRef(new Animated.Value(0)).current;
  const nitroGlowP1 = useRef(new Animated.Value(0)).current;
  const nitroGlowP2 = useRef(new Animated.Value(0)).current;
  const lapFlashAnim = useRef(new Animated.Value(0)).current;

  const gameLoopRef = useRef(null);
  const raceTimerRef = useRef(null);
  const weatherTimerRef = useRef(null);

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  const clearAllTimers = () => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (raceTimerRef.current) clearInterval(raceTimerRef.current);
    if (weatherTimerRef.current) clearInterval(weatherTimerRef.current);
  };

  // Generate track
  const generateTrack = (track) => {
    const segments = [];
    for (let i = 0; i < track.segments; i++) {
      let type;
      const rand = Math.random();

      if (track.id === 'oval') {
        type = rand < 0.6 ? SEGMENT_TYPES[0] : rand < 0.85 ? SEGMENT_TYPES[1] : SEGMENT_TYPES[6];
      } else if (track.id === 'mountain') {
        type = rand < 0.2 ? SEGMENT_TYPES[0] : rand < 0.35 ? SEGMENT_TYPES[2] :
          rand < 0.50 ? SEGMENT_TYPES[3] : rand < 0.65 ? SEGMENT_TYPES[5] :
          rand < 0.80 ? SEGMENT_TYPES[4] : rand < 0.90 ? SEGMENT_TYPES[7] : SEGMENT_TYPES[6];
      } else if (track.id === 'night') {
        type = rand < 0.3 ? SEGMENT_TYPES[0] : rand < 0.50 ? SEGMENT_TYPES[1] :
          rand < 0.65 ? SEGMENT_TYPES[2] : rand < 0.80 ? SEGMENT_TYPES[4] :
          rand < 0.90 ? SEGMENT_TYPES[7] : SEGMENT_TYPES[6];
      } else if (track.id === 'desert') {
        type = rand < 0.25 ? SEGMENT_TYPES[0] : rand < 0.40 ? SEGMENT_TYPES[1] :
          rand < 0.55 ? SEGMENT_TYPES[2] : rand < 0.70 ? SEGMENT_TYPES[3] :
          rand < 0.85 ? SEGMENT_TYPES[5] : SEGMENT_TYPES[7];
      } else {
        type = rand < 0.35 ? SEGMENT_TYPES[0] : rand < 0.55 ? SEGMENT_TYPES[1] :
          rand < 0.70 ? SEGMENT_TYPES[2] : rand < 0.80 ? SEGMENT_TYPES[4] :
          rand < 0.90 ? SEGMENT_TYPES[5] : SEGMENT_TYPES[6];
      }

      segments.push({ ...type, id: i });
    }
    setTrackSegments(segments);
    trackSegmentsRef.current = segments;
    return segments;
  };

  // Nitro glow animations
  useEffect(() => {
    if (p1NitroActive) {
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(nitroGlowP1, { toValue: 1, duration: 200, useNativeDriver: false }),
        Animated.timing(nitroGlowP1, { toValue: 0, duration: 200, useNativeDriver: false }),
      ]));
      loop.start();
      return () => loop.stop();
    }
  }, [p1NitroActive]);

  useEffect(() => {
    if (p2NitroActive) {
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(nitroGlowP2, { toValue: 1, duration: 200, useNativeDriver: false }),
        Animated.timing(nitroGlowP2, { toValue: 0, duration: 200, useNativeDriver: false }),
      ]));
      loop.start();
      return () => loop.stop();
    }
  }, [p2NitroActive]);

  // Race timer
  useEffect(() => {
    if (gamePhase !== 'racing') return;
    raceTimerRef.current = setInterval(() => {
      setRaceTime((prev) => {
        const newTime = prev + 0.1;
        raceTimeRef.current = newTime;
        return newTime;
      });
    }, 100);
    return () => {
      if (raceTimerRef.current) clearInterval(raceTimerRef.current);
    };
  }, [gamePhase]);

  // Weather changes
  useEffect(() => {
    if (gamePhase !== 'racing') return;
    weatherTimerRef.current = setInterval(() => {
      if (Math.random() < 0.15) {
        const newWeather = WEATHER_TYPES[Math.floor(Math.random() * WEATHER_TYPES.length)];
        setWeather(newWeather);
        weatherRef2.current = newWeather;
      }
    }, 10000);
    return () => {
      if (weatherTimerRef.current) clearInterval(weatherTimerRef.current);
    };
  }, [gamePhase]);

  // Slip off handler
  const triggerSlipOff = useCallback((player) => {
    if (player === 1) {
      setP1SlipOff(true);
      p1SlipOffRef.current = true;
      setP1Speed(0);
      p1SpeedRef.current = 0;
      setP1SlipCount((prev) => prev + 1);

      Animated.sequence([
        Animated.timing(p1ShakeAnim, { toValue: 15, duration: 50, useNativeDriver: false }),
        Animated.timing(p1ShakeAnim, { toValue: -15, duration: 50, useNativeDriver: false }),
        Animated.timing(p1ShakeAnim, { toValue: 8, duration: 50, useNativeDriver: false }),
        Animated.timing(p1ShakeAnim, { toValue: 0, duration: 50, useNativeDriver: false }),
      ]).start();

      setTimeout(() => {
        setP1SlipOff(false);
        p1SlipOffRef.current = false;
      }, 2000);
    } else {
      setP2SlipOff(true);
      p2SlipOffRef.current = true;
      setP2Speed(0);
      p2SpeedRef.current = 0;
      setP2SlipCount((prev) => prev + 1);

      Animated.sequence([
        Animated.timing(p2ShakeAnim, { toValue: 15, duration: 50, useNativeDriver: false }),
        Animated.timing(p2ShakeAnim, { toValue: -15, duration: 50, useNativeDriver: false }),
        Animated.timing(p2ShakeAnim, { toValue: 8, duration: 50, useNativeDriver: false }),
        Animated.timing(p2ShakeAnim, { toValue: 0, duration: 50, useNativeDriver: false }),
      ]).start();

      setTimeout(() => {
        setP2SlipOff(false);
        p2SlipOffRef.current = false;
      }, 2000);
    }
  }, []);

  // Main game loop
  useEffect(() => {
    if (gamePhase !== 'racing') return;

    raceEndedRef.current = false;

    gameLoopRef.current = setInterval(() => {
      if (raceEndedRef.current) return;

      const segments = trackSegmentsRef.current;
      const track = selectedTrackRef.current;
      if (!segments.length || !track) return;

      const currentWeather = weatherRef2.current;

      // --- Player 1 ---
      if (!p1FinishedRef.current && !p1SlipOffRef.current) {
        const car1 = p1CarRef.current;
        if (car1) {
          let newSpeed = p1SpeedRef.current;
          const segIndex = Math.floor(p1PositionRef.current) % segments.length;
          const currentSeg = segments[segIndex];

          if (p1ThrottleRef.current) {
            const nitroBoost = p1NitroActiveRef.current ? 1.5 : 1;
            newSpeed += car1.acceleration * 0.15 * nitroBoost;
          } else {
            newSpeed -= 0.05;
          }

          if (p1BrakingRef.current) {
            newSpeed -= car1.braking * 0.3;
          }

          const maxSegSpeed = car1.topSpeed * currentSeg.speedBonus * currentWeather.speedModifier;
          newSpeed = Math.min(maxSegSpeed, Math.max(0, newSpeed));

          const slipChance = currentSeg.slipChance * (1 - car1.handling * 0.7) *
            (newSpeed / car1.topSpeed) * (1 / currentWeather.gripModifier);

          if (Math.random() < slipChance * 0.1) {
            triggerSlipOff(1);
            p1SpeedRef.current = 0;
            setP1Speed(0);
          } else {
            p1SpeedRef.current = newSpeed;
            setP1Speed(newSpeed);

            const newPos = p1PositionRef.current + (newSpeed * 0.02);
            p1PositionRef.current = newPos;
            setP1Position(newPos);

            const newLap = Math.floor(newPos / segments.length);
            if (newLap > p1LapRef.current) {
              p1LapRef.current = newLap;
              setP1Lap(newLap);

              const lapTime = raceTimeRef.current - p1LapStartRef.current;
              p1LapStartRef.current = raceTimeRef.current;
              setP1LapStart(raceTimeRef.current);

              const roundedLap = Math.round(lapTime * 10) / 10;
              if (!p1BestLapRef.current || roundedLap < p1BestLapRef.current) {
                p1BestLapRef.current = roundedLap;
                setP1BestLap(roundedLap);
              }

              lapFlashAnim.setValue(1);
              Animated.timing(lapFlashAnim, { toValue: 0, duration: 600, useNativeDriver: false }).start();

              if (newLap >= track.laps) {
                p1FinishedRef.current = true;
                setP1Finished(true);
                setP1TotalTime(raceTimeRef.current);
                setScores((prev) => ({
                  ...prev,
                  player1: prev.player1 + (p2FinishedRef.current ? 100 : 200),
                }));
              }
            }
          }
        }
      }

      // --- Player 2 ---
      if (!p2FinishedRef.current && !p2SlipOffRef.current) {
        const car2 = p2CarRef.current;
        if (car2) {
          let newSpeed = p2SpeedRef.current;
          const segIndex = Math.floor(p2PositionRef.current) % segments.length;
          const currentSeg = segments[segIndex];

          if (p2ThrottleRef.current) {
            const nitroBoost = p2NitroActiveRef.current ? 1.5 : 1;
            newSpeed += car2.acceleration * 0.15 * nitroBoost;
          } else {
            newSpeed -= 0.05;
          }

          if (p2BrakingRef.current) {
            newSpeed -= car2.braking * 0.3;
          }

          const maxSegSpeed = car2.topSpeed * currentSeg.speedBonus * currentWeather.speedModifier;
          newSpeed = Math.min(maxSegSpeed, Math.max(0, newSpeed));

          const slipChance = currentSeg.slipChance * (1 - car2.handling * 0.7) *
            (newSpeed / car2.topSpeed) * (1 / currentWeather.gripModifier);

          if (Math.random() < slipChance * 0.1) {
            triggerSlipOff(2);
            p2SpeedRef.current = 0;
            setP2Speed(0);
          } else {
            p2SpeedRef.current = newSpeed;
            setP2Speed(newSpeed);

            const newPos = p2PositionRef.current + (newSpeed * 0.02);
            p2PositionRef.current = newPos;
            setP2Position(newPos);

            const newLap = Math.floor(newPos / segments.length);
            if (newLap > p2LapRef.current) {
              p2LapRef.current = newLap;
              setP2Lap(newLap);

              const lapTime = raceTimeRef.current - p2LapStartRef.current;
              p2LapStartRef.current = raceTimeRef.current;
              setP2LapStart(raceTimeRef.current);

              const roundedLap = Math.round(lapTime * 10) / 10;
              if (!p2BestLapRef.current || roundedLap < p2BestLapRef.current) {
                p2BestLapRef.current = roundedLap;
                setP2BestLap(roundedLap);
              }

              if (newLap >= track.laps) {
                p2FinishedRef.current = true;
                setP2Finished(true);
                setP2TotalTime(raceTimeRef.current);
                setScores((prev) => ({
                  ...prev,
                  player2: prev.player2 + (p1FinishedRef.current ? 100 : 200),
                }));
              }
            }
          }
        }
      }

      // Update positions
      if (p1PositionRef.current > p2PositionRef.current) {
        setRacePosition({ p1: 1, p2: 2 });
      } else {
        setRacePosition({ p1: 2, p2: 1 });
      }

      // Check race end
      if (p1FinishedRef.current && p2FinishedRef.current && !raceEndedRef.current) {
        raceEndedRef.current = true;
        setTimeout(() => endRace(), 500);
      }
    }, 50);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gamePhase, triggerSlipOff]);

  const useNitro = (player) => {
    if (player === 1 && p1Nitro > 0 && !p1NitroActive && !p1SlipOff) {
      setP1Nitro((prev) => prev - 1);
      setP1NitroActive(true);
      p1NitroActiveRef.current = true;
      setTimeout(() => {
        setP1NitroActive(false);
        p1NitroActiveRef.current = false;
      }, 3000);
    } else if (player === 2 && p2Nitro > 0 && !p2NitroActive && !p2SlipOff) {
      setP2Nitro((prev) => prev - 1);
      setP2NitroActive(true);
      p2NitroActiveRef.current = true;
      setTimeout(() => {
        setP2NitroActive(false);
        p2NitroActiveRef.current = false;
      }, 3000);
    }
  };

  const startCountdown = () => {
    if (!selectedTrack || !p1Car || !p2Car) {
      Alert.alert('⚠️ Setup Incomplete!', 'Select track and both cars!');
      return;
    }

    generateTrack(selectedTrack);
    setGamePhase('countdown');
    setCountdown(3);
    setGameStarted(true);

    let count = 3;
    const countdownInterval = setInterval(() => {
      count -= 1;
      setCountdown(count);

      countdownAnim.setValue(2);
      Animated.timing(countdownAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }).start();

      if (count <= 0) {
        clearInterval(countdownInterval);
        setGamePhase('racing');
        setGameActive(true);
      }
    }, 1000);
  };

  const endRace = () => {
    clearAllTimers();
    setGameActive(false);
    setGamePhase('finished');

    const p1Time = p1TotalTime || raceTimeRef.current;
    const p2Time = p2TotalTime || raceTimeRef.current;

    const lapBonusP1 = p1BestLapRef.current ? Math.round(100 / p1BestLapRef.current) * 10 : 0;
    const lapBonusP2 = p2BestLapRef.current ? Math.round(100 / p2BestLapRef.current) * 10 : 0;
    const cleanBonusP1 = p1SlipCount === 0 ? 50 : 0;
    const cleanBonusP2 = p2SlipCount === 0 ? 50 : 0;

    setScores((prev) => ({
      player1: prev.player1 + lapBonusP1 + cleanBonusP1,
      player2: prev.player2 + lapBonusP2 + cleanBonusP2,
    }));

    let winner = '';
    if (p1FinishedRef.current && p2FinishedRef.current) {
      const t1 = p1TotalTime || raceTimeRef.current;
      const t2 = p2TotalTime || raceTimeRef.current;
      winner = t1 < t2 ? '🏆 Player 1 Wins!' : t2 < t1 ? '🏆 Player 2 Wins!' : "🤝 Photo Finish!";
    } else if (p1FinishedRef.current) {
      winner = '🏆 Player 1 Wins!';
    } else if (p2FinishedRef.current) {
      winner = '🏆 Player 2 Wins!';
    } else {
      winner = p1PositionRef.current > p2PositionRef.current ? '🏆 Player 1 Leads!' : '🏆 Player 2 Leads!';
    }

    setTimeout(() => {
      Alert.alert(
        `🏁 Race ${raceNumber} Complete!`,
        `${winner}\n\nP1: ${p1Time.toFixed(1)}s | Best: ${p1BestLapRef.current || '-'}s | Slips: ${p1SlipCount}\nP2: ${p2Time.toFixed(1)}s | Best: ${p2BestLapRef.current || '-'}s | Slips: ${p2SlipCount}`,
        raceNumber < maxRaces
          ? [
              { text: '🔄 Next Race', onPress: nextRace },
              { text: '🚪 End', onPress: () => navigation.goBack() },
            ]
          : [
              { text: '🔄 New Series', onPress: resetGame },
              { text: '🚪 Exit', onPress: () => navigation.goBack() },
            ]
      );
    }, 300);
  };

  const resetRaceState = () => {
    setP1Speed(0); setP1Position(0); setP1Lap(0); setP1Finished(false);
    setP1BestLap(null); setP1LapStart(0); setP1Nitro(3); setP1NitroActive(false);
    setP1TotalTime(0); setP1SlipOff(false); setP1SlipCount(0);
    setP2Speed(0); setP2Position(0); setP2Lap(0); setP2Finished(false);
    setP2BestLap(null); setP2LapStart(0); setP2Nitro(3); setP2NitroActive(false);
    setP2TotalTime(0); setP2SlipOff(false); setP2SlipCount(0);
    setRaceTime(0); setCountdown(3);
    setP1Throttle(false); setP2Throttle(false);
    setP1Braking(false); setP2Braking(false);

    // Reset refs
    p1SpeedRef.current = 0; p2SpeedRef.current = 0;
    p1PositionRef.current = 0; p2PositionRef.current = 0;
    p1LapRef.current = 0; p2LapRef.current = 0;
    p1SlipOffRef.current = false; p2SlipOffRef.current = false;
    p1FinishedRef.current = false; p2FinishedRef.current = false;
    p1NitroActiveRef.current = false; p2NitroActiveRef.current = false;
    p1ThrottleRef.current = false; p2ThrottleRef.current = false;
    p1BrakingRef.current = false; p2BrakingRef.current = false;
    raceTimeRef.current = 0;
    p1LapStartRef.current = 0; p2LapStartRef.current = 0;
    p1BestLapRef.current = null; p2BestLapRef.current = null;
    raceEndedRef.current = false;
  };

  const nextRace = () => {
    setRaceNumber((prev) => prev + 1);
    setGamePhase('setup');
    setGameActive(false);
    setGameStarted(false);
    resetRaceState();
    setSelectedTrack(null); setP1Car(null); setP2Car(null);
    setWeather(WEATHER_TYPES[0]);
    weatherRef2.current = WEATHER_TYPES[0];
    p1CarRef.current = null; p2CarRef.current = null;
    selectedTrackRef.current = null;
  };

  const resetGame = () => {
    setScores({ player1: 0, player2: 0 });
    setRaceNumber(1);
    setGamePhase('setup');
    setGameActive(false);
    setGameStarted(false);
    resetRaceState();
    setSelectedTrack(null); setP1Car(null); setP2Car(null);
    setWeather(WEATHER_TYPES[0]);
    weatherRef2.current = WEATHER_TYPES[0];
    p1CarRef.current = null; p2CarRef.current = null;
    selectedTrackRef.current = null;
  };

  const getCurrentSegment = (position) => {
    if (trackSegments.length === 0) return SEGMENT_TYPES[0];
    return trackSegments[Math.floor(position) % trackSegments.length];
  };

  const getSpeedPercent = (speed, car) => {
    if (!car) return 0;
    return Math.round((speed / car.topSpeed) * 100);
  };

  const getSpeedColor = (percent) => {
    if (percent > 80) return '#FF6B6B';
    if (percent > 50) return '#FFD700';
    return '#4ECDC4';
  };

  const getTrackProgress = (position) => {
    if (!selectedTrack || trackSegments.length === 0) return 0;
    const totalSegments = trackSegments.length * selectedTrack.laps;
    return Math.min(100, (position / totalSegments) * 100);
  };

  // Handle throttle with refs
  const handleP1ThrottleIn = () => {
    setP1Throttle(true);
    p1ThrottleRef.current = true;
  };
  const handleP1ThrottleOut = () => {
    setP1Throttle(false);
    p1ThrottleRef.current = false;
  };
  const handleP2ThrottleIn = () => {
    setP2Throttle(true);
    p2ThrottleRef.current = true;
  };
  const handleP2ThrottleOut = () => {
    setP2Throttle(false);
    p2ThrottleRef.current = false;
  };
  const handleP1BrakeIn = () => {
    setP1Braking(true);
    p1BrakingRef.current = true;
  };
  const handleP1BrakeOut = () => {
    setP1Braking(false);
    p1BrakingRef.current = false;
  };
  const handleP2BrakeIn = () => {
    setP2Braking(true);
    p2BrakingRef.current = true;
  };
  const handleP2BrakeOut = () => {
    setP2Braking(false);
    p2BrakingRef.current = false;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏎️ Slot Cars</Text>
        <Text style={styles.raceInfo}>Race {raceNumber}/{maxRaces}</Text>
      </View>

      {/* Scoreboard */}
      <View style={styles.scoreboard}>
        <View style={styles.scoreTeam}>
          <Text style={[styles.teamLabel, racePosition.p1 === 1 && styles.leading]}>
            {racePosition.p1 === 1 ? '🥇' : '🥈'} P1
          </Text>
          <Text style={[styles.teamScore, { color: '#FF6B6B' }]}>{scores.player1}</Text>
        </View>
        <View style={styles.raceInfoCenter}>
          {gamePhase === 'countdown' && (
            <Animated.Text style={[styles.countdownText, { transform: [{ scale: countdownAnim }] }]}>
              {countdown > 0 ? countdown : '🏁 GO!'}
            </Animated.Text>
          )}
          {gamePhase === 'racing' && (
            <>
              <Text style={styles.raceTimeText}>⏱️ {raceTime.toFixed(1)}s</Text>
              <Text style={styles.weatherText}>{weather.emoji} {weather.label}</Text>
            </>
          )}
          {gamePhase === 'setup' && <Text style={styles.setupText}>⚙️ Setup</Text>}
          {gamePhase === 'finished' && <Text style={styles.finishText}>🏁 Finished</Text>}
        </View>
        <View style={styles.scoreTeam}>
          <Text style={[styles.teamLabel, racePosition.p2 === 1 && styles.leading]}>
            {racePosition.p2 === 1 ? '🥇' : '🥈'} P2
          </Text>
          <Text style={[styles.teamScore, { color: '#4ECDC4' }]}>{scores.player2}</Text>
        </View>
      </View>

      {/* Setup Phase */}
      {gamePhase === 'setup' && (
        <View style={styles.setupContainer}>
          <Text style={styles.sectionTitle}>🏟️ Select Track:</Text>
          <View style={styles.optionGrid}>
            {TRACK_TYPES.map((track) => (
              <TouchableOpacity
                key={track.id}
                style={[
                  styles.optionCard,
                  { borderColor: track.color },
                  selectedTrack?.id === track.id && { backgroundColor: track.color + '33', borderWidth: 3 },
                ]}
                onPress={() => {
                  setSelectedTrack(track);
                  selectedTrackRef.current = track;
                }}
              >
                <Text style={styles.optionEmoji}>{track.emoji}</Text>
                <Text style={styles.optionName}>{track.label}</Text>
                <Text style={styles.optionDetail}>{track.laps}L • {track.difficulty}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>🔴 P1 Car:</Text>
          <View style={styles.carGrid}>
            {CAR_TYPES.map((car) => (
              <TouchableOpacity
                key={car.id}
                style={[
                  styles.carCard,
                  { borderColor: car.color },
                  p1Car?.id === car.id && { backgroundColor: car.color + '33', borderWidth: 3 },
                ]}
                onPress={() => {
                  setP1Car(car);
                  p1CarRef.current = car;
                }}
              >
                <Text style={styles.carEmoji}>{car.emoji}</Text>
                <Text style={styles.carName}>{car.label}</Text>
                <Text style={styles.carStat}>S{car.topSpeed} A{Math.round(car.acceleration * 10)} H{Math.round(car.handling * 10)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>🔵 P2 Car:</Text>
          <View style={styles.carGrid}>
            {CAR_TYPES.map((car) => (
              <TouchableOpacity
                key={car.id}
                style={[
                  styles.carCard,
                  { borderColor: car.color },
                  p2Car?.id === car.id && { backgroundColor: car.color + '33', borderWidth: 3 },
                ]}
                onPress={() => {
                  setP2Car(car);
                  p2CarRef.current = car;
                }}
              >
                <Text style={styles.carEmoji}>{car.emoji}</Text>
                <Text style={styles.carName}>{car.label}</Text>
                <Text style={styles.carStat}>S{car.topSpeed} A{Math.round(car.acceleration * 10)} H{Math.round(car.handling * 10)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.startRaceBtn} onPress={startCountdown}>
            <Text style={styles.startRaceBtnText}>🏁 START RACE!</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Racing Phase */}
      {(gamePhase === 'racing' || gamePhase === 'countdown' || gamePhase === 'finished') && (
        <>
          {/* Track View */}
          <View style={styles.trackContainer}>
            <View style={styles.trackMap}>
              <Text style={styles.trackLabel}>
                {selectedTrack?.emoji} {selectedTrack?.label}
              </Text>

              <View style={styles.segmentRow}>
                {trackSegments.slice(0, 12).map((seg, i) => {
                  const p1Here = Math.floor(p1Position) % trackSegments.length === i;
                  const p2Here = Math.floor(p2Position) % trackSegments.length === i;
                  return (
                    <View
                      key={i}
                      style={[
                        styles.segment,
                        { backgroundColor: p1Here ? '#FF6B6B' : p2Here ? '#4ECDC4' : '#2A2A4A' },
                        (p1Here || p2Here) && styles.segmentActive,
                      ]}
                    >
                      <Text style={styles.segIcon}>{seg.icon}</Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>P1 {p1Car?.emoji}</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${getTrackProgress(p1Position)}%`, backgroundColor: '#FF6B6B' }]} />
                  </View>
                  <Text style={styles.lapText}>L{Math.min(p1Lap + 1, selectedTrack?.laps || 1)}/{selectedTrack?.laps}</Text>
                </View>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>P2 {p2Car?.emoji}</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${getTrackProgress(p2Position)}%`, backgroundColor: '#4ECDC4' }]} />
                  </View>
                  <Text style={styles.lapText}>L{Math.min(p2Lap + 1, selectedTrack?.laps || 1)}/{selectedTrack?.laps}</Text>
                </View>
              </View>
            </View>

            <View style={styles.segInfoRow}>
              <View style={[styles.segInfo, { borderColor: '#FF6B6B' }]}>
                <Text style={styles.segInfoLabel}>P1 Segment:</Text>
                <Text style={styles.segInfoEmoji}>
                  {getCurrentSegment(p1Position).icon} {getCurrentSegment(p1Position).label}
                </Text>
                {p1SlipOff && <Text style={styles.slipText}>💫 SLIP! Recovering...</Text>}
                {p1Finished && <Text style={styles.finishedText}>🏁 FINISHED</Text>}
              </View>
              <View style={[styles.segInfo, { borderColor: '#4ECDC4' }]}>
                <Text style={styles.segInfoLabel}>P2 Segment:</Text>
                <Text style={styles.segInfoEmoji}>
                  {getCurrentSegment(p2Position).icon} {getCurrentSegment(p2Position).label}
                </Text>
                {p2SlipOff && <Text style={styles.slipText}>💫 SLIP! Recovering...</Text>}
                {p2Finished && <Text style={styles.finishedText}>🏁 FINISHED</Text>}
              </View>
            </View>
          </View>

          {/* Speed Meters */}
          <View style={styles.speedMeters}>
            <Animated.View style={[styles.speedMeter, { transform: [{ translateX: p1ShakeAnim }] }]}>
              <Text style={styles.speedMeterLabel}>P1 {p1Car?.emoji}</Text>
              <View style={styles.speedBarContainer}>
                <Animated.View
                  style={[
                    styles.speedBar,
                    {
                      width: `${getSpeedPercent(p1Speed, p1Car)}%`,
                      backgroundColor: getSpeedColor(getSpeedPercent(p1Speed, p1Car)),
                    },
                  ]}
                />
              </View>
              <View style={styles.speedInfo}>
                <Text style={styles.speedValue}>{Math.round(p1Speed * 30)} km/h</Text>
                <View style={styles.nitroRow}>
                  {[...Array(3)].map((_, i) => (
                    <Text key={i} style={styles.nitroIcon}>{i < p1Nitro ? '🚀' : '▫️'}</Text>
                  ))}
                </View>
              </View>
              {p1Finished && <Text style={styles.finishedBadge}>🏁 {p1TotalTime.toFixed(1)}s</Text>}
              {p1BestLap !== null && <Text style={styles.bestLapText}>⏱️ Best: {p1BestLap}s</Text>}
            </Animated.View>

            <Animated.View style={[styles.speedMeter, { transform: [{ translateX: p2ShakeAnim }] }]}>
              <Text style={styles.speedMeterLabel}>P2 {p2Car?.emoji}</Text>
              <View style={styles.speedBarContainer}>
                <Animated.View
                  style={[
                    styles.speedBar,
                    {
                      width: `${getSpeedPercent(p2Speed, p2Car)}%`,
                      backgroundColor: getSpeedColor(getSpeedPercent(p2Speed, p2Car)),
                    },
                  ]}
                />
              </View>
              <View style={styles.speedInfo}>
                <Text style={styles.speedValue}>{Math.round(p2Speed * 30)} km/h</Text>
                <View style={styles.nitroRow}>
                  {[...Array(3)].map((_, i) => (
                    <Text key={i} style={styles.nitroIcon}>{i < p2Nitro ? '🚀' : '▫️'}</Text>
                  ))}
                </View>
              </View>
              {p2Finished && <Text style={styles.finishedBadge}>🏁 {p2TotalTime.toFixed(1)}s</Text>}
              {p2BestLap !== null && <Text style={styles.bestLapText}>⏱️ Best: {p2BestLap}s</Text>}
            </Animated.View>
          </View>

          {/* Controls */}
          {gamePhase === 'racing' && (
            <View style={styles.controlsContainer}>
              <View style={[styles.playerControls, { borderColor: '#FF6B6B' }]}>
                <Text style={styles.controlsLabel}>🔴 P1</Text>
                <View style={styles.controlRow}>
                  <TouchableOpacity
                    style={[styles.brakeBtn, p1Braking && styles.btnPressed]}
                    onPressIn={handleP1BrakeIn}
                    onPressOut={handleP1BrakeOut}
                  >
                    <Text style={styles.brakeBtnText}>🛑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.throttleBtn, p1Throttle && styles.throttlePressed]}
                    onPressIn={handleP1ThrottleIn}
                    onPressOut={handleP1ThrottleOut}
                    disabled={p1SlipOff || p1Finished}
                  >
                    <Text style={styles.throttleBtnText}>
                      {p1SlipOff ? '💫' : p1Finished ? '🏁' : '⚡ GAS'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.nitroBtn, (p1Nitro <= 0 || p1NitroActive) && styles.btnDisabled]}
                    onPress={() => useNitro(1)}
                    disabled={p1Nitro <= 0 || p1NitroActive || p1SlipOff || p1Finished}
                  >
                    <Text style={styles.nitroBtnText}>🚀</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.playerControls, { borderColor: '#4ECDC4' }]}>
                <Text style={styles.controlsLabel}>🔵 P2</Text>
                <View style={styles.controlRow}>
                  <TouchableOpacity
                    style={[styles.brakeBtn, p2Braking && styles.btnPressed]}
                    onPressIn={handleP2BrakeIn}
                    onPressOut={handleP2BrakeOut}
                  >
                    <Text style={styles.brakeBtnText}>🛑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.throttleBtn2, p2Throttle && styles.throttle2Pressed]}
                    onPressIn={handleP2ThrottleIn}
                    onPressOut={handleP2ThrottleOut}
                    disabled={p2SlipOff || p2Finished}
                  >
                    <Text style={styles.throttleBtnText}>
                      {p2SlipOff ? '💫' : p2Finished ? '🏁' : '⚡ GAS'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.nitroBtn, (p2Nitro <= 0 || p2NitroActive) && styles.btnDisabled]}
                    onPress={() => useNitro(2)}
                    disabled={p2Nitro <= 0 || p2NitroActive || p2SlipOff || p2Finished}
                  >
                    <Text style={styles.nitroBtnText}>🚀</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>P1 Slips</Text>
          <Text style={[styles.statValue, { color: '#FF6B6B' }]}>{p1SlipCount}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>P1 Laps</Text>
          <Text style={styles.statValue}>{p1Lap}/{selectedTrack?.laps || '-'}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>P2 Laps</Text>
          <Text style={styles.statValue}>{p2Lap}/{selectedTrack?.laps || '-'}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>P2 Slips</Text>
          <Text style={[styles.statValue, { color: '#4ECDC4' }]}>{p2SlipCount}</Text>
        </View>
      </View>

      {/* Game Over */}
      {gamePhase === 'finished' && (
        <View style={styles.gameOverButtons}>
          {raceNumber < maxRaces ? (
            <TouchableOpacity style={styles.nextBtn} onPress={nextRace}>
              <Text style={styles.nextBtnText}>🔄 Next Race</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.nextBtn} onPress={resetGame}>
              <Text style={styles.nextBtnText}>🔄 New Series</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.exitBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.exitBtnText}>🚪 Exit</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1A',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: SPACING.sm || 8,
    backgroundColor: '#12122A',
  },
  backBtn: { fontSize: 16, color: '#FFF', fontWeight: 'bold' },
  title: { fontSize: 19, fontWeight: 'bold', color: '#FFF' },
  raceInfo: { fontSize: 13, color: '#FFD700', fontWeight: 'bold' },

  scoreboard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg || 20,
    paddingVertical: 6,
    backgroundColor: '#16163A',
    borderBottomWidth: 2,
    borderBottomColor: '#E94560',
  },
  scoreTeam: { alignItems: 'center', width: 75 },
  teamLabel: { fontSize: 12, color: '#AAA', fontWeight: 'bold' },
  leading: { color: '#FFD700' },
  teamScore: { fontSize: 22, fontWeight: 'bold' },
  raceInfoCenter: { alignItems: 'center' },
  countdownText: { fontSize: 36, fontWeight: 'bold', color: '#FFD700' },
  raceTimeText: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  weatherText: { fontSize: 11, color: '#87CEEB' },
  setupText: { fontSize: 16, color: '#AAA', fontWeight: 'bold' },
  finishText: { fontSize: 16, color: '#FFD700', fontWeight: 'bold' },

  setupContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 6,
    marginTop: 8,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  optionCard: {
    width: (width - 60) / 3,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#1A1A3A',
    alignItems: 'center',
  },
  optionEmoji: { fontSize: 22 },
  optionName: { fontSize: 9, fontWeight: 'bold', color: '#FFF', marginTop: 2 },
  optionDetail: { fontSize: 8, color: '#888' },

  carGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  carCard: {
    width: (width - 60) / 3,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#1A1A3A',
    alignItems: 'center',
  },
  carEmoji: { fontSize: 20 },
  carName: { fontSize: 9, fontWeight: 'bold', color: '#FFF', marginTop: 2 },
  carStat: { fontSize: 7, color: '#888' },

  startRaceBtn: {
    backgroundColor: '#E94560',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    marginHorizontal: 8,
  },
  startRaceBtnText: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },

  trackContainer: {
    marginHorizontal: 10,
    marginVertical: 4,
    backgroundColor: '#0D1B2A',
    borderRadius: BORDER_RADIUS.md || 10,
    borderWidth: 2,
    borderColor: '#2A2A5A',
    padding: 8,
  },
  trackMap: {},
  trackLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 3,
    marginBottom: 8,
  },
  segment: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A6A',
  },
  segmentActive: { borderWidth: 2, borderColor: '#FFF' },
  segIcon: { fontSize: 12 },

  progressContainer: { gap: 4 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressLabel: { fontSize: 10, color: '#AAA', width: 35 },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: '#333',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 5 },
  lapText: { fontSize: 10, color: '#AAA', width: 35, textAlign: 'right' },

  segInfoRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  segInfo: {
    flex: 1,
    backgroundColor: '#1A1A3A',
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  segInfoLabel: { fontSize: 8, color: '#888' },
  segInfoEmoji: { fontSize: 11, fontWeight: 'bold', color: '#FFF', marginTop: 2 },
  slipText: { fontSize: 9, color: '#FF6B6B', marginTop: 2, fontWeight: 'bold' },
  finishedText: { fontSize: 9, color: '#FFD700', marginTop: 2, fontWeight: 'bold' },

  speedMeters: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  speedMeter: {
    flex: 1,
    backgroundColor: '#16163A',
    borderRadius: 8,
    padding: 8,
  },
  speedMeterLabel: { fontSize: 11, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  speedBarContainer: {
    height: 14,
    backgroundColor: '#333',
    borderRadius: 7,
    overflow: 'hidden',
    marginBottom: 4,
  },
  speedBar: { height: '100%', borderRadius: 7 },
  speedInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speedValue: { fontSize: 12, fontWeight: 'bold', color: '#FFF' },
  nitroRow: { flexDirection: 'row', gap: 2 },
  nitroIcon: { fontSize: 12 },
  finishedBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginTop: 4,
  },
  bestLapText: {
    fontSize: 9,
    color: '#4ECDC4',
    textAlign: 'center',
    marginTop: 2,
  },

  controlsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  playerControls: {
    flex: 1,
    backgroundColor: '#0D1B2A',
    borderRadius: 10,
    padding: 8,
    borderWidth: 2,
  },
  controlsLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  controlRow: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
  },
  brakeBtn: {
    width: 40,
    height: 46,
    backgroundColor: '#8B0000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#AA0000',
  },
  brakeBtnText: { fontSize: 18 },
  btnPressed: { backgroundColor: '#FF0000', borderColor: '#FF4444' },
  throttleBtn: {
    flex: 1,
    height: 46,
    backgroundColor: '#1E6A1E',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2E8A2E',
  },
  throttlePressed: { backgroundColor: '#2ECC71', borderColor: '#4AE68A' },
  throttleBtn2: {
    flex: 1,
    height: 46,
    backgroundColor: '#1A5276',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2980B9',
  },
  throttle2Pressed: { backgroundColor: '#3498DB', borderColor: '#5DADE2' },
  throttleBtnText: { fontSize: 13, fontWeight: 'bold', color: '#FFF' },
  nitroBtn: {
    width: 40,
    height: 46,
    backgroundColor: '#8B4513',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D2691E',
  },
  nitroBtnText: { fontSize: 18 },
  btnDisabled: { opacity: 0.3 },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 6,
    paddingHorizontal: SPACING.md || 10,
    backgroundColor: '#16163A',
  },
  statBox: { alignItems: 'center' },
  statLabel: { fontSize: 9, color: '#888', marginBottom: 2 },
  statValue: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },

  gameOverButtons: {
    paddingHorizontal: SPACING.lg || 20,
    paddingBottom: SPACING.md || 12,
    gap: 8,
  },
  nextBtn: {
    backgroundColor: '#E94560',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  exitBtn: {
    backgroundColor: '#533483',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  exitBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
});

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontFamily } from '@/constants/theme';

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  color: string;
}

interface BinaryBit {
  id: number;
  x: number;
  y: Animated.Value;
  opacity: Animated.Value;
  value: string;
}

const PARTICLE_COLORS = ['#FFD700', '#00FF7F', '#8B5CF6', '#FF8C42', '#4ECDC4'];

export function MiningAnimation({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [binaryBits, setBinaryBits] = useState<BinaryBit[]>([]);
  const nextId = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const binaryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const rotAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ring1Anim = useRef(new Animated.Value(0)).current;
  const ring2Anim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const innerRotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.timing(rotAnim, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
      ).start();
      Animated.loop(
        Animated.timing(innerRotAnim, { toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: true })
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.95, duration: 800, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(ring1Anim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(ring1Anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.delay(750),
          Animated.timing(ring2Anim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(ring2Anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
        ])
      ).start();

      // Particles
      intervalRef.current = setInterval(() => {
        const id = nextId.current++;
        const angle = Math.random() * Math.PI * 2;
        const distance = 60 + Math.random() * 40;
        const xEnd = Math.cos(angle) * distance;
        const yEnd = Math.sin(angle) * distance;
        const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];

        const p: Particle = {
          id,
          x: new Animated.Value(0),
          y: new Animated.Value(0),
          opacity: new Animated.Value(1),
          scale: new Animated.Value(1),
          color,
        };
        setParticles((prev) => [...prev.slice(-12), p]);

        Animated.parallel([
          Animated.timing(p.x, { toValue: xEnd, duration: 900, useNativeDriver: true }),
          Animated.timing(p.y, { toValue: yEnd, duration: 900, useNativeDriver: true }),
          Animated.timing(p.opacity, { toValue: 0, duration: 900, useNativeDriver: true }),
          Animated.timing(p.scale, { toValue: 0, duration: 900, useNativeDriver: true }),
        ]).start(() => {
          setParticles((prev) => prev.filter((pp) => pp.id !== id));
        });
      }, 200);

      // Binary bits floating upward
      binaryIntervalRef.current = setInterval(() => {
        const bid = nextId.current++;
        const xPos = -50 + Math.random() * 100;
        const yAnim = new Animated.Value(20);
        const opAnim = new Animated.Value(1);
        const bit: BinaryBit = {
          id: bid,
          x: xPos,
          y: yAnim,
          opacity: opAnim,
          value: Math.random() > 0.5 ? '1' : '0',
        };
        setBinaryBits((prev) => [...prev.slice(-8), bit]);
        Animated.parallel([
          Animated.timing(yAnim, { toValue: -70, duration: 2000, easing: Easing.linear, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opAnim, { toValue: 0.8, duration: 500, useNativeDriver: true }),
            Animated.timing(opAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
          ]),
        ]).start(() => {
          setBinaryBits((prev) => prev.filter((b) => b.id !== bid));
        });
      }, 300);
    } else {
      rotAnim.stopAnimation();
      innerRotAnim.stopAnimation();
      pulseAnim.stopAnimation();
      ring1Anim.stopAnimation();
      ring2Anim.stopAnimation();
      glowAnim.stopAnimation();
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (binaryIntervalRef.current) clearInterval(binaryIntervalRef.current);
      setParticles([]);
      setBinaryBits([]);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (binaryIntervalRef.current) clearInterval(binaryIntervalRef.current);
    };
  }, [active]);

  const rotation = rotAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const innerRotation = innerRotAnim.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  const ring1Scale = ring1Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] });
  const ring1Opacity = ring1Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.8, 0.4, 0] });
  const ring2Scale = ring2Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] });
  const ring2Opacity = ring2Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.3, 0] });

  return (
    <View style={styles.container}>
      {/* Ripple rings */}
      {active && (
        <>
          <Animated.View style={[styles.ring, { transform: [{ scale: ring1Scale }], opacity: ring1Opacity, borderColor: Colors.primary }]} />
          <Animated.View style={[styles.ring, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity, borderColor: Colors.accent }]} />
        </>
      )}

      {/* Binary floating bits */}
      {binaryBits.map((b) => (
        <Animated.Text
          key={b.id}
          style={[
            styles.binaryBit,
            {
              left: 80 + b.x,
              transform: [{ translateY: b.y }],
              opacity: b.opacity,
              color: b.value === '1' ? Colors.accent : Colors.primary,
            },
          ]}
        >
          {b.value}
        </Animated.Text>
      ))}

      {/* Particles */}
      {particles.map((p) => (
        <Animated.View
          key={p.id}
          style={[
            styles.particle,
            {
              backgroundColor: p.color,
              transform: [{ translateX: p.x }, { translateY: p.y }, { scale: p.scale }],
              opacity: p.opacity,
            },
          ]}
        />
      ))}

      {/* Core orb */}
      <Animated.View style={[styles.orbWrap, { transform: [{ scale: active ? pulseAnim : new Animated.Value(1) }] }]}>
        {/* Outer rotating gradient ring */}
        <Animated.View style={[styles.orbRotate, { transform: [{ rotate: active ? rotation : '0deg' }] }]}>
          <LinearGradient
            colors={active ? ['#FFD700', '#FF8C42', '#8B5CF6', '#00FF7F', '#FFD700'] : ['#222255', '#333370']}
            style={styles.orbGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Inner counter-rotating ring */}
        {active && (
          <Animated.View style={[styles.orbInnerRing, { transform: [{ rotate: innerRotation }] }]}>
            <LinearGradient
              colors={['transparent', Colors.accent + '44', 'transparent']}
              style={styles.orbInnerRingGrad}
            />
          </Animated.View>
        )}

        <Animated.View style={[styles.orbGlow, { opacity: active ? glowAnim : new Animated.Value(0), backgroundColor: active ? Colors.primary : 'transparent' }]} />

        {/* CashPoP coin icon center */}
        <View style={styles.orbCenter}>
          <LinearGradient colors={active ? ['#FFD700', '#FF8C42'] : ['#333', '#555']} style={styles.coinGrad}>
            <Text style={styles.coinText}>Rp</Text>
          </LinearGradient>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
  },
  binaryBit: {
    position: 'absolute',
    fontSize: 14,
    fontFamily: FontFamily.number,
    fontWeight: 'bold',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  orbWrap: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  orbRotate: { ...StyleSheet.absoluteFillObject, borderRadius: 50, overflow: 'hidden' },
  orbGrad: { flex: 1 },
  orbInnerRing: { position: 'absolute', width: 80, height: 80, borderRadius: 40, overflow: 'hidden' },
  orbInnerRingGrad: { flex: 1 },
  orbGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.3,
  },
  orbCenter: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  coinGrad: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  coinText: { fontSize: 16, fontFamily: FontFamily.title, color: '#000' },
});

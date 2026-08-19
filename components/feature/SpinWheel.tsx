import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, FontFamily, Radius, Spacing } from '@/constants/theme';
import { SPIN_PRIZES } from '@/constants/config';

const { width } = Dimensions.get('window');
const WHEEL_SIZE = Math.min(width - 80, 300);
const CENTER = WHEEL_SIZE / 2;
const RADIUS = CENTER - 10;
const SEGMENT_ANGLE = (2 * Math.PI) / SPIN_PRIZES.length;

interface Props {
  onSpin: (prizeIndex: number) => void;
  canSpin: boolean;
}

function polarToXY(angle: number, r: number, cx: number, cy: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function describeSlice(i: number, total: number, r: number, cx: number, cy: number) {
  const startAngle = (i / total) * 2 * Math.PI - Math.PI / 2;
  const endAngle = ((i + 1) / total) * 2 * Math.PI - Math.PI / 2;
  const s = polarToXY(startAngle, r, cx, cy);
  const e = polarToXY(endAngle, r, cx, cy);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y} Z`;
}

function WheelSVG({ rotation }: { rotation: Animated.Value }) {
  const rotDeg = rotation.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });
  const size = WHEEL_SIZE;
  const cx = CENTER;
  const cy = CENTER;

  return (
    <Animated.View style={{ width: size, height: size, transform: [{ rotate: rotDeg }] }}>
      <View style={{ width: size, height: size }}>
        {SPIN_PRIZES.map((prize, i) => {
          const startAngle = (i / SPIN_PRIZES.length) * 360 - 90;
          const midAngle = startAngle + 360 / SPIN_PRIZES.length / 2;
          const radMid = (midAngle * Math.PI) / 180;
          const lx = cx + (RADIUS * 0.65) * Math.cos(radMid);
          const ly = cy + (RADIUS * 0.65) * Math.sin(radMid);
          const wedgeAngle = 360 / SPIN_PRIZES.length;

          return (
            <View
              key={i}
              style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}
              pointerEvents="none"
            >
              {/* Segment */}
              <View
                style={[
                  styles.segment,
                  {
                    width: size,
                    height: size,
                    transform: [{ rotate: `${startAngle}deg` }],
                  },
                ]}
              >
                <View
                  style={[
                    styles.wedge,
                    {
                      width: size,
                      height: size / 2,
                      backgroundColor: prize.color,
                      opacity: 0.85,
                      transformOrigin: `${cx}px ${size / 2}px`,
                      transform: [{ rotate: `${wedgeAngle}deg` }],
                    },
                  ]}
                />
              </View>

              {/* Label positioned at mid-angle */}
              <View
                style={[
                  styles.labelWrap,
                  {
                    position: 'absolute',
                    left: lx - 30,
                    top: ly - 12,
                    width: 60,
                    alignItems: 'center',
                  },
                ]}
              >
                <Text style={styles.segLabel} numberOfLines={1}>{prize.label}</Text>
              </View>
            </View>
          );
        })}

        {/* Center circle */}
        <View style={[styles.centerCircle, { left: CENTER - 22, top: CENTER - 22 }]}>
          <LinearGradient colors={['#FFD700', '#FF8C42']} style={styles.centerGrad}>
            <MaterialIcons name="stars" size={18} color="#000" />
          </LinearGradient>
        </View>
      </View>
    </Animated.View>
  );
}

export function SpinWheel({ onSpin, canSpin }: Props) {
  const rotAnim = useRef(new Animated.Value(0)).current;
  const [isSpinning, setIsSpinning] = useState(false);
  const [prizeIndex, setPrizeIndex] = useState<number | null>(null);
  const currentRot = useRef(0);

  const handleSpin = () => {
    if (!canSpin || isSpinning) return;
    setIsSpinning(true);
    setPrizeIndex(null);

    // Weighted random
    const totalWeight = SPIN_PRIZES.reduce((s, p) => s + p.weight, 0);
    let rand = Math.random() * totalWeight;
    let selectedIndex = 0;
    for (let i = 0; i < SPIN_PRIZES.length; i++) {
      rand -= SPIN_PRIZES[i].weight;
      if (rand <= 0) { selectedIndex = i; break; }
    }

    // Calculate target rotation
    const segSize = 360 / SPIN_PRIZES.length;
    const targetSegAngle = selectedIndex * segSize;
    const extraSpins = 5 * 360;
    const targetAngle = currentRot.current + extraSpins + (360 - targetSegAngle - segSize / 2 + 360) % 360;

    Animated.timing(rotAnim, {
      toValue: targetAngle,
      duration: 4500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      currentRot.current = targetAngle % 360;
      setIsSpinning(false);
      setPrizeIndex(selectedIndex);
      onSpin(selectedIndex);
    });
  };

  const normalizedRot = rotAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });

  return (
    <View style={styles.container}>
      {/* Pointer */}
      <View style={styles.pointer}>
        <MaterialIcons name="arrow-drop-down" size={36} color={Colors.primary} />
      </View>

      {/* Wheel outer ring */}
      <View style={[styles.outerRing, { width: WHEEL_SIZE + 16, height: WHEEL_SIZE + 16, borderRadius: (WHEEL_SIZE + 16) / 2 }]}>
        <Animated.View style={[styles.wheelWrap, { width: WHEEL_SIZE, height: WHEEL_SIZE, borderRadius: WHEEL_SIZE / 2, transform: [{ rotate: normalizedRot }] }]}>
          {SPIN_PRIZES.map((prize, i) => {
            const startAngle = (i / SPIN_PRIZES.length) * 360 - 90;
            const midAngle = startAngle + 360 / SPIN_PRIZES.length / 2;
            const radMid = (midAngle * Math.PI) / 180;
            const lx = CENTER + (RADIUS * 0.62) * Math.cos(radMid);
            const ly = CENTER + (RADIUS * 0.62) * Math.sin(radMid);

            return (
              <View key={i} style={[StyleSheet.absoluteFillObject]}>
                {/* Segment background */}
                <View
                  style={{
                    position: 'absolute',
                    left: lx - 28,
                    top: ly - 14,
                    width: 56,
                    alignItems: 'center',
                  }}
                >
                  <View style={[styles.segBg, { backgroundColor: prize.color }]} />
                  <Text style={styles.segText} numberOfLines={1}>{prize.label}</Text>
                </View>
              </View>
            );
          })}

          {/* Colored segments using border trick */}
          <View style={[styles.colorWheel, { width: WHEEL_SIZE, height: WHEEL_SIZE, borderRadius: WHEEL_SIZE / 2 }]}>
            {SPIN_PRIZES.map((prize, i) => {
              const angle = (360 / SPIN_PRIZES.length) * i;
              return (
                <View
                  key={i}
                  style={[
                    styles.colorSegment,
                    {
                      backgroundColor: i % 2 === 0 ? prize.color + 'CC' : prize.color + '99',
                      transform: [{ rotate: `${angle}deg` }],
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Labels on top */}
          {SPIN_PRIZES.map((prize, i) => {
            const startAngle = (i / SPIN_PRIZES.length) * 360 - 90;
            const midAngle = startAngle + 360 / SPIN_PRIZES.length / 2;
            const radMid = (midAngle * Math.PI) / 180;
            const lx = CENTER + (RADIUS * 0.62) * Math.cos(radMid);
            const ly = CENTER + (RADIUS * 0.62) * Math.sin(radMid);

            return (
              <View
                key={`label_${i}`}
                style={{
                  position: 'absolute',
                  left: lx - 30,
                  top: ly - 12,
                  width: 60,
                  alignItems: 'center',
                  zIndex: 10,
                }}
              >
                <Text style={styles.finalLabel} numberOfLines={1}>{prize.label}</Text>
              </View>
            );
          })}

          {/* Center */}
          <View style={[styles.center, { left: CENTER - 24, top: CENTER - 24 }]}>
            <LinearGradient colors={['#FFD700', '#FF8C42']} style={styles.centerInner}>
              <MaterialIcons name="stars" size={22} color="#000" />
            </LinearGradient>
          </View>
        </Animated.View>
      </View>

      {/* Spin Button */}
      <TouchableOpacity
        style={[styles.spinBtn, (!canSpin || isSpinning) && styles.spinBtnDisabled]}
        onPress={handleSpin}
        disabled={!canSpin || isSpinning}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={canSpin && !isSpinning ? ['#FFD700', '#FF8C42'] : ['#333', '#444']}
          style={styles.spinBtnGrad}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        >
          <MaterialIcons name={isSpinning ? 'hourglass-top' : 'casino'} size={22} color={canSpin && !isSpinning ? '#000' : '#888'} />
          <Text style={[styles.spinBtnText, { color: canSpin && !isSpinning ? '#000' : '#888' }]}>
            {isSpinning ? 'Memutar...' : canSpin ? 'PUTAR SEKARANG' : 'Sudah Digunakan'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {!canSpin && (
        <View style={styles.lockedInfo}>
          <MaterialIcons name="lock-clock" size={14} color={Colors.textMuted} />
          <Text style={styles.lockedText}>Spin tersedia besok</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: Spacing.md },
  pointer: { zIndex: 10, marginBottom: -8 },
  outerRing: { borderWidth: 3, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgCard },
  wheelWrap: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  colorWheel: { position: 'absolute', overflow: 'hidden' },
  colorSegment: {
    position: 'absolute',
    width: WHEEL_SIZE,
    height: WHEEL_SIZE / 2,
    top: 0,
    left: 0,
    transformOrigin: `${WHEEL_SIZE / 2}px ${WHEEL_SIZE / 2}px`,
  },
  segBg: { position: 'absolute', width: 50, height: 26, borderRadius: 4, opacity: 0.3 },
  segText: { fontSize: 10, fontFamily: FontFamily.number, color: '#fff', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  finalLabel: {
    fontSize: 10,
    fontFamily: FontFamily.number,
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  center: { position: 'absolute', width: 48, height: 48, borderRadius: 24, overflow: 'hidden', zIndex: 20 },
  centerInner: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
  segment: { position: 'absolute' },
  wedge: { position: 'absolute', top: 0, left: 0 },
  labelWrap: {},
  segLabel: { fontSize: 9, fontFamily: FontFamily.number, color: '#fff', textAlign: 'center' },
  centerCircle: { position: 'absolute', width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  centerGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  spinBtn: { width: '80%', borderRadius: Radius.lg, overflow: 'hidden' },
  spinBtnDisabled: { opacity: 0.6 },
  spinBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  spinBtnText: { fontSize: FontSize.base, fontFamily: FontFamily.button, letterSpacing: 0.5 },
  lockedInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lockedText: { fontSize: FontSize.sm, fontFamily: FontFamily.body, color: Colors.textMuted },
});

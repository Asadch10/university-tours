import { useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet, Animated, Easing } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

/** Branded splash: fades in the crest, then moves on to the auth screen. */
export function SplashScreen({ navigation }: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 550, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 550, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    const t = setTimeout(() => navigation.replace('Auth'), 2000);
    return () => clearTimeout(t);
  }, [fade, rise, navigation]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }], alignItems: 'center' }}>
        <View style={styles.badge}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.title}>University Campus{'\n'}Private Tours</Text>
        <Text style={styles.subtitle}>Book a private tour with a real student</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.maroon900, alignItems: 'center', justifyContent: 'center', padding: spacing(6) },
  badge: {
    height: 116,
    width: 116,
    borderRadius: 28,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(6),
  },
  logo: { height: 96, width: 96 },
  title: { color: colors.white, fontSize: 26, fontWeight: '800', textAlign: 'center', lineHeight: 32 },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', marginTop: spacing(2) },
});

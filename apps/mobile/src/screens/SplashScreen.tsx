import { useEffect, useRef } from 'react';
import { Image, Text, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { font, colors, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useStyles } from '../theme-context';
import type { Palette } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

/** Simple splash: fades in the logo on a plain white background, then goes to auth. */
export function SplashScreen({ navigation }: Props) {
  const styles = useStyles(makeStyles);
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
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }], alignItems: 'center' }}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.brandName}>Campus Private Tours</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const makeStyles = (tc: Palette) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tc.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing(6),
    // Nudge the logo block a little above the exact centre.
    paddingBottom: spacing(28),
  },
  logo: { height: 200, width: 200 },
  brandName: {
    marginTop: spacing(4),
    fontSize: font(18),
    fontWeight: '800',
    color: tc.maroon900,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

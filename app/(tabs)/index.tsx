import { StyleSheet, View } from 'react-native';
import { usePreferences } from '../../components/PreferencesContext';
import SessionTimer from '../../components/SessionTimer';

export default function HomeScreen() {
  const { sound, playSound } = usePreferences();
  return (
    <View style={styles.container}>
      <SessionTimer sound={playSound ? (sound as 'Bell' | 'Birds' | 'Harp' | 'None') : 'None'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
});

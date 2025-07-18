import DateTimePicker from '@react-native-community/datetimepicker';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { usePreferences } from '../../components/PreferencesContext';
import { BUTTON_BG, ORB_HUE, ORB_HUE_DARK } from '../../constants/Colors';

const COMMON_TIMES = [
  { label: 'Morning: 9am', hour: 9, minute: 0 },
  { label: 'Lunch: 1pm', hour: 13, minute: 0 },
  { label: 'Afternoon: 3pm', hour: 15, minute: 0 },
  { label: 'Evening: 7pm', hour: 19, minute: 0 },
];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SOUNDS = ["Bell", "Birds", "Harp", "None"];

// Reminder messages
const REMINDER_MESSAGES = [
  "Time to do nothing!",
  "Pause and do nothing for a bit.",
  "Your daily nothing break is here.",
  "Take a moment to do nothing.",
  "It's nothing o'clock!",
  "Ready to do nothing?",
  "A gentle reminder: do nothing now.",
  "Unplug and do nothing for a while.",
  "Your nothing session awaits.",
  "Breathe, relax, and do nothing."
];

function formatTime(date: Date) {
  let h = date.getHours();
  let m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export default function PreferencesScreen() {
  const [reminderOn, setReminderOn] = useState(true);
  const [reminderTime, setReminderTime] = useState(new Date(2023, 0, 1, 15, 0)); // default 3pm
  const [showRemindersEdit, setShowRemindersEdit] = useState(false);
  const [reminderMode, setReminderMode] = useState<'simple' | 'advanced'>('simple');
  const isAdvanced = reminderMode === 'advanced';
  const [showPicker, setShowPicker] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [days, setDays] = useState([true, true, true, true, true, false, false]); // Mon-Fri
  const [advancedTimes, setAdvancedTimes] = useState([
    new Date(2023, 0, 1, 15, 0), // Mon
    new Date(2023, 0, 1, 15, 0), // Tue
    new Date(2023, 0, 1, 15, 0), // Wed
    new Date(2023, 0, 1, 15, 0), // Thu
    new Date(2023, 0, 1, 15, 0), // Fri
    new Date(2023, 0, 1, 15, 0), // Sat
    new Date(2023, 0, 1, 15, 0), // Sun
  ]);
  const [pickerDayIdx, setPickerDayIdx] = useState<number | null>(null); // for advanced mode
  const [webTime, setWebTime] = useState('15:00');
  const [webDayTimes, setWebDayTimes] = useState([
    '15:00','15:00','15:00','15:00','15:00','15:00','15:00'
  ]);
  // Experience section state
  const { playSound, setPlaySound, sound, setSound, showMotivation, setShowMotivation, vibrate, setVibrate } = usePreferences();
  const [showCommunity, setShowCommunity] = useState(true);

  // Notification preferences: [{ enabled: boolean, time: Date|null }]
  const [notificationPrefs, setNotificationPrefs] = useState<{ enabled: boolean; time: Date | null }[]>(
    DAYS.map((_, i) => ({ enabled: days[i], time: advancedTimes[i] }))
  );

  // Add a pendingTime state for simple mode
  const [pendingTime, setPendingTime] = useState<Date | null>(null);

  const fontFamily = Platform.select({
    ios: 'Quicksand',
    android: 'Poppins-Light',
    default: 'Poppins-Thin',
  });

  // Main picker (for daily reminder)
  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (event?.type === 'dismissed') return;
    if (selectedDate) {
      const newPrefs = DAYS.map(() => ({ enabled: true, time: new Date(selectedDate) }));
      setNotificationPrefs(newPrefs);
      setDays([true, true, true, true, true, true, true]);
      scheduleReminders(newPrefs);
      setShowRemindersEdit(false);
      setReminderTime(new Date(selectedDate));
      setPendingTime(null);
      Alert.alert('Preferences saved', `Reminder set for ${formatTime(new Date(selectedDate))} every day.`);
    }
  };
  // Web fallback for main picker
  // For web, add AM/PM select and handle 12-hour input
  const [webAmPm, setWebAmPm] = useState(reminderTime.getHours() >= 12 ? 'PM' : 'AM');
  const [webDayAmPm, setWebDayAmPm] = useState([
    ...Array(7).fill('PM')
  ]);

  const handleWebTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let [h, m] = e.target.value.split(':').map(Number);
    let hour = h;
    if (webAmPm === 'PM' && h < 12) hour += 12;
    if (webAmPm === 'AM' && h === 12) hour = 0;
    setWebTime(e.target.value);
    setReminderTime(new Date(2023, 0, 1, hour, m));
    setShowPicker(false);
  };
  const handleWebAmPmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setWebAmPm(e.target.value);
    let [h, m] = webTime.split(':').map(Number);
    let hour = h;
    if (e.target.value === 'PM' && h < 12) hour += 12;
    if (e.target.value === 'AM' && h === 12) hour = 0;
    setReminderTime(new Date(2023, 0, 1, hour, m));
  };

  // Advanced picker (for per-day time)
  const handleAdvancedTimeChange = (dayIdx: number) => (event: any, selectedDate?: Date) => {
    if (event?.type === 'dismissed') {
      setPickerDayIdx(null);
      return;
    }
    setPickerDayIdx(null);
    if (selectedDate) {
      setAdvancedTimes(times => times.map((t, i) => i === dayIdx ? selectedDate : t));
    }
  };
  // Web fallback for advanced picker
  const handleWebDayTimeChange = (i: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let [h, m] = e.target.value.split(':').map(Number);
    let hour = h;
    if (webDayAmPm[i] === 'PM' && h < 12) hour += 12;
    if (webDayAmPm[i] === 'AM' && h === 12) hour = 0;
    setWebDayTimes(times => times.map((t, idx) => idx === i ? e.target.value : t));
    setAdvancedTimes(times => times.map((t, idx) => idx === i ? new Date(2023, 0, 1, hour, m) : t));
    setPickerDayIdx(null);
  };
  const handleWebDayAmPmChange = (i: number) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setWebDayAmPm(arr => arr.map((v, idx) => idx === i ? e.target.value : v));
    let [h, m] = webDayTimes[i].split(':').map(Number);
    let hour = h;
    if (e.target.value === 'PM' && h < 12) hour += 12;
    if (e.target.value === 'AM' && h === 12) hour = 0;
    setAdvancedTimes(times => times.map((t, idx) => idx === i ? new Date(2023, 0, 1, hour, m) : t));
  };

  // Simple mode: show time options or just picker
  const handleSimplePickTime = () => {
    setShowPicker(true);
  };
  const handleSimpleSave = () => {
    setShowPicker(false);
    setShowRemindersEdit(false);
    // Apply the selected time to all enabled days
    const newPrefs = DAYS.map((_, i) => ({
      enabled: days[i],
      time: days[i] ? new Date(reminderTime) : null,
    }));
    setNotificationPrefs(newPrefs);
    console.log('Notification preferences (simple mode):', newPrefs);
  };

  // Request notification permissions on mount
  useEffect(() => {
    (async () => {
      if (Device.isDevice) {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          await Notifications.requestPermissionsAsync();
        }
      }
    })();
  }, []);

  // Helper to cancel all scheduled notifications
  async function cancelAllReminders() {
    if (Platform.OS === 'web') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Helper to schedule reminders
  async function scheduleReminders(prefs: { enabled: boolean; time: Date | null }[]) {
    if (Platform.OS === 'web') return;
    try {
      await cancelAllReminders();
      const now = new Date();
      const scheduled = [];
      // Check if all days are enabled and all times are the same
      const allEnabled = prefs.every(p => p.enabled);
      const firstTime = prefs[0]?.time;
      const allSameTime = firstTime && prefs.every(p => p.time && p.time.getHours() === firstTime.getHours() && p.time.getMinutes() === firstTime.getMinutes());
      if (allEnabled && allSameTime) {
        // Schedule a single daily notification
        const hour = firstTime.getHours();
        const minute = firstTime.getMinutes();
        const message = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
        await Notifications.scheduleNotificationAsync({
          content: {
            title: message,
            body: "Tap to open Do Nothing.",
            sound: true,
          },
          trigger: Platform.OS === 'android' ? {
            hour,
            minute,
            repeats: true,
            channelId: 'default',
            type: 'daily',
          } : {
            hour,
            minute,
            repeats: true,
          },
        });
        scheduled.push({ days: 'all', time: firstTime, message });
      } else {
        // Per-day scheduling
        for (let i = 0; i < prefs.length; i++) {
          const pref = prefs[i];
          if (pref.enabled && pref.time) {
            const hour = pref.time.getHours();
            const minute = pref.time.getMinutes();
            const weekday = i === 6 ? 1 : i + 2; // JS: 0=Sun, Expo: 1=Mon
            const message = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
            await Notifications.scheduleNotificationAsync({
              content: {
                title: message,
                body: "Tap to open Do Nothing.",
                sound: true,
              },
              trigger: Platform.OS === 'android' ? {
                weekday,
                hour,
                minute,
                repeats: true,
                channelId: 'default',
                type: 'weekly',
              } : {
                weekday,
                hour,
                minute,
                repeats: true,
              },
            });
            scheduled.push({ day: DAYS[i], time: pref.time, message });
          }
        }
      }
      console.log('Scheduled reminders:', scheduled);
    } catch (e) {
      console.error('Error scheduling reminders:', e);
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Failed to schedule reminders.');
      }
    }
  }

  const sendTestNotification = async () => {
    // Create channel on Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
      });
    }
    // Request permissions
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Failed to get notification permissions!');
        return;
      }
    }
    // Schedule notification
    try {
      const now = new Date();
      const fireTime = new Date(now.getTime() + 60000);
      console.log('Attempting to schedule test notification at', fireTime.toLocaleTimeString());
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification',
          body: 'This is a test notification from Do Nothing.',
          sound: true,
        },
        trigger: {
          type: 'timeInterval',
          seconds: 60,
          repeats: false,
          channelId: 'default',
        },
      });
      Alert.alert(
        'Test notification scheduled',
        `Current time: ${now.toLocaleTimeString()}\nNotification should arrive at: ${fireTime.toLocaleTimeString()} (in 60 seconds)`
      );
    } catch (e) {
      Alert.alert('Error', `Failed to schedule test notification.\n${e?.message || e}`);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollWrapper} style={{ flex: 1 }}>
      <View style={styles.wrapper}>
        {/* Reminders Section */}
        <Text style={[styles.title]}>Reminders</Text>
        {!showRemindersEdit ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 24 }}>
            <Text
              style={[
                styles.subtitle,
                { fontFamily, flex: 1, alignSelf: 'center', marginBottom: 0 }
              ]}
            >
              Daily reminder: {formatTime((notificationPrefs.find(p => p.enabled && p.time)?.time) || reminderTime)}
            </Text>
            <TouchableOpacity style={styles.primaryButton} 
              //style={{ width: 'auto', alignSelf: 'center', marginTop: 0 }}
              onPress={() => {
                // Find the first enabled notificationPrefs time, or fallback
                const firstEnabled = notificationPrefs.find(p => p.enabled && p.time);
                setPendingTime(firstEnabled?.time ? new Date(firstEnabled.time) : new Date(2023, 0, 1, 15, 0));
                setShowRemindersEdit(true);
              }}
            >
              <Text style={{ color: '#222', fontWeight: '400', fontSize: 16, fontFamily }}>Change</Text>
           
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.sectionBox}>
            <View style={styles.modeToggleRow}>
              <Text style={[styles.modeToggleText, { fontFamily }]}>Advanced mode</Text>
              <Switch
                value={isAdvanced}
                onValueChange={v => setReminderMode(v ? 'advanced' : 'simple')}
                trackColor={{ true: ORB_HUE, false: '#e5e7eb' }}
                thumbColor={isAdvanced ? ORB_HUE_DARK : '#ccc'}
              />
            </View>
            {reminderMode === 'simple' && (
              <>
                <Modal
                  visible={showPicker}
                  transparent={true}
                  animationType="slide"
                  onRequestClose={() => setShowPicker(false)}
                >
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', minWidth: 280 }}>
                      {Platform.OS === 'web' ? (
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <input
                            type="time"
                            value={(() => {
                              let h = reminderTime.getHours();
                              let m = reminderTime.getMinutes();
                              let ampm = h >= 12 ? 'PM' : 'AM';
                              h = h % 12;
                              if (h === 0) h = 12;
                              return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                            })()}
                            onChange={handleWebTimeChange}
                            style={{ fontSize: 18, padding: 8, borderRadius: 8, border: '1px solid #ccc', marginBottom: 12, fontFamily: fontFamily as string }}
                            autoFocus
                          />
                          <select value={webAmPm} onChange={handleWebAmPmChange} style={{ fontSize: 18, padding: 8, borderRadius: 8, border: '1px solid #ccc', marginBottom: 12, fontFamily: fontFamily as string }}>
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                        </div>
                      ) : (
                        <DateTimePicker
                          value={reminderTime}
                          mode="time"
                          is24Hour={false}
                          display="spinner"
                          onChange={handleTimeChange}
                        />
                      )}
                      <TouchableOpacity
                        style={{ marginTop: 16, backgroundColor: ORB_HUE, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 }}
                        onPress={() => setShowPicker(false)}
                      >
                        <Text style={{ color: '#222', fontWeight: '400', fontSize: 16, fontFamily }}>Close</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
                {!showPicker && (
                  <>
                    <View style={styles.row}>
                      {COMMON_TIMES.map((t) => (
                        <TouchableOpacity
                          key={t.label}
                          style={[
                            styles.timeButton,
                            pendingTime && pendingTime.getHours() === t.hour && pendingTime.getMinutes() === t.minute && styles.timeButtonActive,
                          ]}
                          onPress={() => setPendingTime(new Date(2023, 0, 1, t.hour, t.minute))}
                        >
                          <Text style={[styles.timeButtonText, { fontFamily }]}> {t.label} </Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity style={styles.timeButton} onPress={handleSimplePickTime}>
                        <Text style={[styles.timeButtonText, { fontFamily }]}>Pick time</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={[styles.saveButton, { opacity: pendingTime ? 1 : 0.5 }]}
                      disabled={!pendingTime}
                      onPress={async () => {
                        if (!pendingTime) {
                          Alert.alert('Please select a time before saving.');
                          return;
                        }
                        console.log('pendingTime at save:', pendingTime);
                        const newPrefs = DAYS.map(() => ({ enabled: true, time: new Date(pendingTime) }));
                        setNotificationPrefs(newPrefs);
                        setDays([true, true, true, true, true, true, true]);
                        scheduleReminders(newPrefs);
                        setShowRemindersEdit(false); // Exit edit mode immediately
                        setReminderTime(new Date(pendingTime));
                        setPendingTime(null);
                        console.log('Notification preferences (simple mode):', newPrefs);
                        Alert.alert('Preferences saved', `Reminder set for ${formatTime(new Date(pendingTime))} every day.`);
                      }}
                    >
                      <Text style={[styles.saveButtonText, { fontFamily }]}>Done</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
            {reminderMode === 'advanced' && (
              <View style={styles.advancedBox}>
                <Text style={[styles.advancedLabel, { fontFamily }]}>Customize your schedule</Text>
                {DAYS.map((d, i) => (
                  <View key={d} style={styles.advancedDayRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Switch
                        value={days[i]}
                        onValueChange={v => setDays(ds => ds.map((val, idx) => idx === i ? v : val))}
                        trackColor={{ true: ORB_HUE, false: '#e5e7eb' }}
                        thumbColor={days[i] ? ORB_HUE_DARK : '#ccc'}
                      />
                      <Text style={[styles.dayLabel, { fontFamily }]}>{d}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.advancedTimeButton}
                      onPress={() => setPickerDayIdx(i)}
                      disabled={!days[i]}
                    >
                      <Text style={[styles.advancedTimeButtonText, { fontFamily, color: days[i] ? '#222' : '#bbb' }]}> {formatTime(advancedTimes[i])} </Text>
                    </TouchableOpacity>
                    {pickerDayIdx === i && (
                      Platform.OS === 'web' ? (
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <input
                            type="time"
                            value={(() => {
                              let h = advancedTimes[i].getHours();
                              let m = advancedTimes[i].getMinutes();
                              let ampm = h >= 12 ? 'PM' : 'AM';
                              h = h % 12;
                              if (h === 0) h = 12;
                              return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                            })()}
                            onChange={handleWebDayTimeChange(i)}
                            style={{ fontSize: 18, padding: 8, borderRadius: 8, border: '1px solid #ccc', marginBottom: 12, fontFamily: fontFamily as string }}
                            autoFocus
                          />
                          <select value={webDayAmPm[i]} onChange={handleWebDayAmPmChange(i)} style={{ fontSize: 18, padding: 8, borderRadius: 8, border: '1px solid #ccc', marginBottom: 12, fontFamily: fontFamily as string }}>
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                        </div>
                      ) : (
                        <DateTimePicker
                          value={advancedTimes[i]}
                          mode="time"
                          is24Hour={false}
                          display="spinner"
                          onChange={handleAdvancedTimeChange(i)}
                        />
                      )
                    )}
                  </View>
                ))}
              </View>
            )}
            {reminderMode === 'advanced' && (
              <TouchableOpacity style={styles.saveButton} onPress={async () => {
                const newPrefs = DAYS.map((_, i) => ({
                  enabled: days[i],
                  time: days[i] ? new Date(advancedTimes[i]) : null,
                }));
                setNotificationPrefs(newPrefs);
                scheduleReminders(newPrefs);
                setShowRemindersEdit(false);
                console.log('Notification preferences (advanced mode):', newPrefs);
                Alert.alert('Preferences saved', 'Advanced reminder preferences saved.');
              }}>
                <Text style={[styles.saveButtonText, { fontFamily }]}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Experience Section */}
        <Text style={[styles.title, { marginTop: 32 }]}>Experience</Text>
        <View>
          <View style={styles.expRow}>
            <Text style={[styles.expLabel, { fontFamily }]}>Play a sound when timer finishes</Text>
            <Switch
              value={playSound}
              onValueChange={setPlaySound}
              trackColor={{ true: '#b3c2cc', false: '#e5e7eb' }}
              thumbColor={playSound ? '#b3c2cc' : '#fff'}
              style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
            />
          </View>
          {playSound && (
            <View style={styles.expRow}>
              <Text style={[styles.expLabel, { fontFamily }]}>Sound</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {SOUNDS.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.soundButton, sound === s && styles.soundButtonActive]}
                    onPress={() => setSound(s)}
                  >
                    <Text style={[styles.soundButtonText, { fontFamily }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          <View style={styles.expRow}>
            <Text style={[styles.expLabel, { fontFamily }]}>Vibrate when timer finishes</Text>
            <Switch
              value={vibrate}
              onValueChange={setVibrate}
              trackColor={{ true: '#b3c2cc', false: '#e5e7eb' }}
              thumbColor={vibrate ? '#b3c2cc' : '#fff'}
              style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
            />
          </View>
          <View style={styles.expRow}>
            <Text style={[styles.expLabel, { fontFamily }]}>Show motivational messages during session</Text>
            <Switch
              value={showMotivation}
              onValueChange={setShowMotivation}
              trackColor={{ true: '#b3c2cc', false: '#e5e7eb' }}
              thumbColor={showMotivation ? '#b3c2cc' : '#fff'}
              style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
            />
          </View>
          <View style={styles.expRow}>
            <Text style={[styles.expLabel, { fontFamily }]}>Show number of people doing nothing</Text>
            <Switch
              value={showCommunity}
              onValueChange={setShowCommunity}
              trackColor={{ true: '#b3c2cc', false: '#e5e7eb' }}
              thumbColor={showCommunity ? '#b3c2cc' : '#fff'}
              style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
            />
          </View>
        </View>
        
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollWrapper: {
    flexGrow: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: '100%',
  },
  wrapper: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    padding: 24,
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 500,
  },
  sectionBox: {
    backgroundColor: BUTTON_BG,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#b0bfc0',
    shadowOpacity: 0.10,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Poppins-Thin',
    fontWeight: '100',
    color: '#000',
    marginTop: 32,
    marginBottom: 8,
    letterSpacing: 2.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#222',
    marginBottom: 24,
    fontWeight: '400',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  timeButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    margin: 4,
    shadowColor: '#b0bfc0',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  timeButtonActive: {
    backgroundColor: ORB_HUE,
  },
  timeButtonText: {
    color: '#222',
    fontWeight: '400',
    fontSize: 15,
  },
  changeButtonText: {
    color: '#222',
    fontWeight: '400',
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: ORB_HUE,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 12,
    shadowColor: '#b0bfc0',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  remindersBox: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '50%',
    gap: 8,
    alignItems: 'center',
    verticalAlign: 'middle'
  },
  saveButtonText: {
    color: '#222',
    fontWeight: '400',
    fontSize: 16,
  },
  modeToggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  modeToggle: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    shadowColor: '#b0bfc0',
    shadowOpacity: 0.10,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  modeToggleActive: {
    backgroundColor: ORB_HUE,
  },
  modeToggleText: {
    color: '#222',
    fontWeight: '400',
    fontSize: 15,
  },
  advancedToggle: {
    marginTop: 8,
    marginBottom: 8,
    alignSelf: 'center',
  },
  advancedToggleText: {
    color: ORB_HUE_DARK,
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  advancedBox: {
    backgroundColor: BUTTON_BG,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  advancedLabel: {
    color: '#222',
    fontWeight: '400',
    fontSize: 15,
    marginBottom: 8,
  },
  advancedDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayLabel: {
    color: '#222',
    fontWeight: '400',
    fontSize: 15,
    marginLeft: 8,
  },
  advancedTimeButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#b0bfc0',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    minWidth: 90,
    alignItems: 'center',
  },
  advancedTimeButtonText: {
    color: '#222',
    fontWeight: '400',
    fontSize: 15,
  },
  expRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 12,
    gap: 8,
  },
  expLabel: {
    color: '#000',
    fontWeight: '400',
    fontSize: 15,
    flex: 1,
    textAlign: 'left',
  },
  soundButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 2,
    shadowColor: '#b0bfc0',
    shadowOpacity: 0.10,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  soundButtonActive: {
    backgroundColor: '#e4ebf3',
    shadowColor: '#b0bfc0',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: -1, height: 3 },
    elevation: 4,
  },
  soundButtonText: {
    color: '#222',
    fontWeight: '400',
    fontSize: 15,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  dayButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    margin: 2,
    shadowColor: '#b0bfc0',
    shadowOpacity: 0.10,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  dayButtonActive: {
    backgroundColor: ORB_HUE,
  },
  dayButtonText: {
    color: '#222',
    fontWeight: '400',
    fontSize: 14,
  },
  turnOffButton: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 16,
    shadowColor: '#b0bfc0',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  turnOffButtonText: {
    color: '#222',
    fontWeight: '400',
    fontSize: 16,
  },
  turnOnButton: {
    backgroundColor: ORB_HUE,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 32,
    shadowColor: '#b0bfc0',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  turnOnButtonText: {
    color: '#222',
    fontWeight: '800',
    fontSize: 16,
  },
  buttonGradient: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 10px 0 rgba(0,0,0,0.1)'
  },
  //#e4ebf3
  primaryButton: {
    backgroundColor: '#e4ebf3',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginHorizontal: 4,
    shadowColor: '#b0bfc0',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: -1, height: 3 },
    elevation: 4,
  },
}); 
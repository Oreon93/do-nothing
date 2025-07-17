import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { usePreferences } from '../../components/PreferencesContext';

const ORB_HUE = '#cfe4e3';
const ORB_HUE_DARK = '#a7cfc9';
const COMMON_TIMES = [
  { label: 'Morning: 9am', hour: 9, minute: 0 },
  { label: 'Lunch: 1pm', hour: 13, minute: 0 },
  { label: 'Afternoon: 3pm', hour: 15, minute: 0 },
  { label: 'Evening: 7pm', hour: 19, minute: 0 },
];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SOUNDS = ["Bell", "Birds", "Harp", "None"];

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
  const { playSound, setPlaySound, sound, setSound, showMotivation, setShowMotivation } = usePreferences();
  const [vibrate, setVibrate] = useState(false);
  const [showCommunity, setShowCommunity] = useState(true);

  const fontFamily = Platform.select({
    ios: 'Quicksand',
    android: 'sans-serif-thin',
    default: 'System',
  });

  // Main picker (for daily reminder)
  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) setReminderTime(selectedDate);
  };
  // Web fallback for main picker
  const handleWebTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWebTime(e.target.value);
    const [h, m] = e.target.value.split(':').map(Number);
    setReminderTime(new Date(2023, 0, 1, h, m));
    setShowPicker(false);
  };
  // Advanced picker (for per-day time)
  const handleAdvancedTimeChange = (dayIdx: number) => (event: any, selectedDate?: Date) => {
    setPickerDayIdx(null);
    if (selectedDate) {
      setAdvancedTimes(times => times.map((t, i) => i === dayIdx ? selectedDate : t));
    }
  };
  // Web fallback for advanced picker
  const handleWebDayTimeChange = (i: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setWebDayTimes(times => times.map((t, idx) => idx === i ? e.target.value : t));
    const [h, m] = e.target.value.split(':').map(Number);
    setAdvancedTimes(times => times.map((t, idx) => idx === i ? new Date(2023, 0, 1, h, m) : t));
    setPickerDayIdx(null);
  };

  // Simple mode: show time options or just picker
  const [showSimplePicker, setShowSimplePicker] = useState(false);
  const handleSimplePickTime = () => {
    setShowSimplePicker(true);
    setShowPicker(true);
  };
  const handleSimpleSave = () => {
    setShowSimplePicker(false);
    setShowPicker(false);
    setShowRemindersEdit(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollWrapper} style={{ flex: 1 }}>
      <View style={styles.wrapper}>
        {/* Reminders Section */}
        <Text style={[styles.title, { fontFamily }]}>Reminders</Text>
        {!showRemindersEdit ? (
          <View style={styles.sectionBox}>
            <Text style={[styles.subtitle, { fontFamily }]}>Daily reminder: {formatTime(reminderTime)}</Text>
            <TouchableOpacity style={styles.changeButton} onPress={() => setShowRemindersEdit(true)}>
              <Text style={[styles.changeButtonText, { fontFamily }]}>Change</Text>
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
            {reminderMode === 'simple' && !showSimplePicker && (
              <View style={styles.row}>
                {COMMON_TIMES.map((t) => (
                  <TouchableOpacity
                    key={t.label}
                    style={[
                      styles.timeButton,
                      reminderTime.getHours() === t.hour && reminderTime.getMinutes() === t.minute && styles.timeButtonActive,
                    ]}
                    onPress={() => setReminderTime(new Date(2023, 0, 1, t.hour, t.minute))}
                  >
                    <Text style={[styles.timeButtonText, { fontFamily }]}> {t.label} </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.timeButton} onPress={handleSimplePickTime}>
                  <Text style={[styles.timeButtonText, { fontFamily }]}>Pick time</Text>
                </TouchableOpacity>
              </View>
            )}
            {reminderMode === 'simple' && showSimplePicker && (
              <View style={{ alignItems: 'center', width: '100%' }}>
                {Platform.OS === 'web' ? (
                  <input
                    type="time"
                    value={webTime}
                    onChange={handleWebTimeChange}
                    style={{ fontSize: 18, padding: 8, borderRadius: 8, border: '1px solid #ccc', marginBottom: 12, fontFamily: fontFamily as string }}
                    autoFocus
                  />
                ) : (
                  <DateTimePicker
                    value={reminderTime}
                    mode="time"
                    is24Hour={false}
                    display="spinner"
                    onChange={handleTimeChange}
                  />
                )}
                <TouchableOpacity style={styles.saveButton} onPress={handleSimpleSave}>
                  <Text style={[styles.saveButtonText, { fontFamily }]}>Save</Text>
                </TouchableOpacity>
              </View>
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
                        <input
                          type="time"
                          value={webDayTimes[i]}
                          onChange={handleWebDayTimeChange(i)}
                          style={{ fontSize: 18, padding: 8, borderRadius: 8, border: '1px solid #ccc', marginBottom: 12, fontFamily: fontFamily as string }}
                          autoFocus
                        />
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
            <TouchableOpacity style={styles.saveButton} onPress={() => setShowRemindersEdit(false)}>
              <Text style={[styles.saveButtonText, { fontFamily }]}>Done</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Experience Section */}
        <Text style={[styles.title, { fontFamily, marginTop: 32 }]}>Experience</Text>
        <View style={styles.sectionBox}>
          <View style={styles.expRow}>
            <Text style={[styles.expLabel, { fontFamily }]}>Play a sound when timer finishes</Text>
            <Switch
              value={playSound}
              onValueChange={setPlaySound}
              trackColor={{ true: ORB_HUE, false: '#e5e7eb' }}
              thumbColor={playSound ? ORB_HUE_DARK : '#ccc'}
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
              trackColor={{ true: ORB_HUE, false: '#e5e7eb' }}
              thumbColor={vibrate ? ORB_HUE_DARK : '#ccc'}
            />
          </View>
          <View style={styles.expRow}>
            <Text style={[styles.expLabel, { fontFamily }]}>Show motivational messages during session</Text>
            <Switch
              value={showMotivation}
              onValueChange={setShowMotivation}
              trackColor={{ true: ORB_HUE, false: '#e5e7eb' }}
              thumbColor={showMotivation ? ORB_HUE_DARK : '#ccc'}
            />
          </View>
          <View style={styles.expRow}>
            <Text style={[styles.expLabel, { fontFamily }]}>Show number of people doing nothing</Text>
            <Switch
              value={showCommunity}
              onValueChange={setShowCommunity}
              trackColor={{ true: ORB_HUE, false: '#e5e7eb' }}
              thumbColor={showCommunity ? ORB_HUE_DARK : '#ccc'}
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
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 24,
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 500,
  },
  sectionBox: {
    backgroundColor: '#f8fafc',
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
    fontSize: 28,
    fontWeight: '300',
    color: '#222',
    marginTop: 32,
    marginBottom: 8,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
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
  changeButton: {
    backgroundColor: ORB_HUE,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 8,
    shadowColor: '#b0bfc0',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
    backgroundColor: '#f8fafc',
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
    marginBottom: 12,
    gap: 8,
  },
  expLabel: {
    color: '#222',
    fontWeight: '400',
    fontSize: 15,
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
    backgroundColor: ORB_HUE,
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
    fontWeight: '400',
    fontSize: 16,
  },
}); 
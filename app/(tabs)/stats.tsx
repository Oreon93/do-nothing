import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

// Placeholder for user stats and leaderboard data
const mockUserStats = {
  weekMinutes: 120,
  monthMinutes: 480,
  mostPopularHour: 15, // 3pm
  mostPopularDay: 'Wednesday',
};

const mockLeaderboard = [
  { name: 'Alice', minutes: 900 },
  { name: 'Bob', minutes: 850 },
  { name: 'You', minutes: 480 },
  { name: 'Charlie', minutes: 400 },
  { name: 'Dana', minutes: 350 },
];

function formatHour(hour: number) {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  let h = hour % 12;
  if (h === 0) h = 12;
  return `${h} ${ampm}`;
}

export default function StatsScreen() {
  // In a real app, fetch stats from storage/server
  const [userStats, setUserStats] = useState(mockUserStats);
  const [leaderboard, setLeaderboard] = useState(mockLeaderboard);

  // Placeholder: in the future, fetch and calculate real stats
  useEffect(() => {
    // TODO: Load stats from async storage or backend
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.pageTitle}>My Stats</Text>
      <View style={styles.statsBox}>
        <Text style={styles.statLabel}>This week:</Text>
        <Text style={styles.statValue}>{userStats.weekMinutes} min</Text>
        <Text style={styles.statLabel}>This month:</Text>
        <Text style={styles.statValue}>{userStats.monthMinutes} min</Text>
        <Text style={styles.statLabel}>Most popular time:</Text>
        <Text style={styles.statValue}>{userStats.mostPopularDay} at {formatHour(userStats.mostPopularHour)}</Text>
      </View>
      <Text style={styles.sectionTitle}>Global Leaderboard</Text>
      <View style={styles.leaderboardBox}>
        {leaderboard.map((entry, idx) => (
          <View key={entry.name} style={styles.leaderboardRow}>
            <Text style={[styles.leaderboardRank, entry.name === 'You' && styles.you]}>#{idx + 1}</Text>
            <Text style={[styles.leaderboardName, entry.name === 'You' && styles.you]}>{entry.name}</Text>
            <Text style={[styles.leaderboardMinutes, entry.name === 'You' && styles.you]}>{entry.minutes} min</Text>
          </View>
        ))}
      </View>
      <Text style={styles.note}>(Stats and leaderboard are for demo purposes. Real tracking coming soon!)</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 24,
    backgroundColor: '#fff',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '300',
    marginTop: 32,
    marginBottom: 8,
    letterSpacing: 1.5,
    color: '#222',
  },
  statsBox: {
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
  statLabel: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
    fontWeight: '400',
  },
  statValue: {
    fontSize: 20,
    color: '#222',
    fontWeight: '500',
    marginBottom: 4,
  },
  leaderboardBox: {
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
  leaderboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
    alignItems: 'center',
  },
  leaderboardRank: {
    fontSize: 16,
    fontWeight: '600',
    width: 32,
    color: '#888',
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '400',
    flex: 1,
    color: '#222',
  },
  leaderboardMinutes: {
    fontSize: 16,
    fontWeight: '400',
    width: 80,
    textAlign: 'right',
    color: '#222',
  },
  you: {
    color: '#1e7e6b',
    fontWeight: '700',
  },
  note: {
    fontSize: 13,
    color: '#aaa',
    marginTop: 12,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '400',
    marginTop: 24,
    marginBottom: 12,
    color: '#222',
  },
});

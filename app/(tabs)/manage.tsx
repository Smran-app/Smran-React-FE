import { Stack } from 'expo-router';
import { Plus, Settings2, ChevronRight, Bell, Clock, Smartphone } from 'lucide-react-native';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  getReminderProfiles,
  createReminderProfile,
  updateReminderProfile,
  ReminderProfileResponse,
  CreateReminderProfilePayload,
} from '@/api/reminder-profiles';
import { getCurrentUser } from '@/api/auth';

interface Device {
  id: string;
  name: string;
  type: 'phone' | 'tablet' | 'watch' | 'desktop';
}

interface ReminderProfile {
  id: string;
  name: string;
  description?: string;
  notifyBefore: number;
  snoozeDuration: number;
  notifyOn: 'all' | 'other';
  preferredDevices: string[];
  isCustom: boolean;
}

/** Map API response to UI shape */
function mapApiProfileToUi(api: ReminderProfileResponse): ReminderProfile {
  const notifyOn = api.settings.notify_on.mode === 'others' ? 'other' : 'all';
  return {
    id: api.id,
    name: api.name,
    description: api.description || '',
    notifyBefore: api.settings.notify_before?.amount ?? 0,
    snoozeDuration: api.settings.snooze_duration?.amount ?? 0,
    notifyOn,
    preferredDevices: api.settings.notify_on?.devices ?? [],
    isCustom: true,
  };
}

/** Map UI profile to API create/update payload */
function mapUiProfileToApiPayload(profile: ReminderProfile): CreateReminderProfilePayload {
  return {
    name: profile.name,
    description: profile.description ?? '',
    settings: {
      notify_on: {
        mode: profile.notifyOn === 'other' ? 'others' : 'all',
        devices: profile.preferredDevices ?? [],
      },
      notify_before: {
        unit: 'minutes',
        amount: profile.notifyBefore,
      },
      snooze_duration: {
        unit: 'minutes',
        amount: profile.snoozeDuration,
      },
    },
  };
}

/** Check if id is a UUID (from API) vs local temp id */
function isApiProfileId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export default function ManageScreen() {
  const [profiles, setProfiles] = useState<ReminderProfile[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ReminderProfile | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getReminderProfiles();
      setProfiles(list.map(mapApiProfileToUi));
    } catch (err: any) {
      console.error('Failed to fetch reminder profiles:', err);
      Alert.alert('Error', err?.message ?? 'Failed to load reminder profiles.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const user = await getCurrentUser();
        const devList = user?.devices ?? [];
        setDevices(
          devList.map((d: any) => ({
            id: d.id ?? d.device_id ?? String(d.id ?? ''),
            name: d.name ?? d.device_type ?? 'Device',
            type: (d.device_type ?? 'phone') as Device['type'],
          }))
        );
      } catch (err) {
        console.error('Failed to load devices:', err);
      }
    };
    loadDevices();
  }, []);

  const handleEditProfile = (profile: ReminderProfile) => {
    setEditingProfile({ ...profile });
    setModalVisible(true);
  };

  const handleCreateCustomProfile = () => {
    const newProfile: ReminderProfile = {
      id: `custom-${Date.now()}`,
      name: 'Custom Profile',
      notifyBefore: 30,
      snoozeDuration: 10,
      notifyOn: 'all',
      preferredDevices: [],
      isCustom: true,
    };
    setEditingProfile(newProfile);
    setModalVisible(true);
  };

  const toggleDevice = (deviceId: string) => {
    if (!editingProfile) return;
    const isSelected = editingProfile.preferredDevices.includes(deviceId);
    const updated = isSelected
      ? editingProfile.preferredDevices.filter(id => id !== deviceId)
      : [...editingProfile.preferredDevices, deviceId];
    setEditingProfile({ ...editingProfile, preferredDevices: updated });
  };

  const handleSaveProfile = async () => {
    if (!editingProfile) return;

    setSaving(true);
    try {
      const payload = mapUiProfileToApiPayload(editingProfile);

      if (isApiProfileId(editingProfile.id)) {
        const updated = await updateReminderProfile(editingProfile.id, payload);
        setProfiles(prev =>
          prev.map(p => (p.id === editingProfile.id ? mapApiProfileToUi(updated) : p))
        );
      } else {
        const created = await createReminderProfile(payload);
        setProfiles(prev => [mapApiProfileToUi(created), ...prev]);
      }

      setModalVisible(false);
      setEditingProfile(null);
    } catch (err: any) {
      console.error('Failed to save reminder profile:', err);
      Alert.alert('Error', err?.message ?? 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProfile = () => {
    if (!editingProfile) return;
    setProfiles(profiles.filter(p => p.id !== editingProfile.id));
    setModalVisible(false);
    setEditingProfile(null);
  };

  const canDeleteProfile = editingProfile && !isApiProfileId(editingProfile.id);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      

      <View style={styles.header}>
        <Text style={styles.title}>Reminder Profiles</Text>
        <Text style={styles.subtitle}>Customize notification settings</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#60A5FA" />
            <Text style={styles.loadingText}>Loading profiles...</Text>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Profiles</Text>
              <Pressable
                style={styles.addButton}
                onPress={handleCreateCustomProfile}
              >
                <Plus size={20} color="#1F2937" strokeWidth={2} />
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
            </View>

            {profiles.length === 0 ? (
              <View style={styles.emptyState}>
                <Settings2 size={48} color="#D1D5DB" strokeWidth={1.5} />
                <Text style={styles.emptyText}>No reminder profiles yet</Text>
                <Text style={styles.emptySubtext}>
                  Tap "Add" to create your first profile
                </Text>
              </View>
            ) : (
              profiles.map(profile => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  onPress={() => handleEditProfile(profile)}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable
              onPress={() => setModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>
              {isApiProfileId(editingProfile?.id ?? '') ? 'Edit Profile' : 'New Profile'}
            </Text>
            <Pressable
              onPress={handleSaveProfile}
              style={styles.modalSaveButton}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#60A5FA" />
              ) : (
                <Text style={styles.modalSaveText}>Save</Text>
              )}
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Profile Name</Text>
              <TextInput
                style={styles.input}
                value={editingProfile?.name ?? ''}
                onChangeText={text =>
                  editingProfile &&
                  setEditingProfile({ ...editingProfile, name: text })
                }
                placeholder="Enter profile name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description (optional)</Text>
              <TextInput
                style={styles.input}
                value={editingProfile?.description ?? ''}
                onChangeText={text =>
                  editingProfile &&
                  setEditingProfile({ ...editingProfile, description: text })
                }
                placeholder="e.g. For important reminders"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Bell size={20} color="#6B7280" strokeWidth={2} />
                <Text style={styles.label}>Notify Before</Text>
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.numberInput}
                  value={editingProfile?.notifyBefore.toString() ?? ''}
                  onChangeText={text =>
                    editingProfile &&
                    setEditingProfile({
                      ...editingProfile,
                      notifyBefore: parseInt(text) || 0,
                    })
                  }
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                />
                <Text style={styles.unit}>minutes</Text>
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Clock size={20} color="#6B7280" strokeWidth={2} />
                <Text style={styles.label}>Snooze Duration</Text>
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.numberInput}
                  value={editingProfile?.snoozeDuration.toString() ?? ''}
                  onChangeText={text =>
                    editingProfile &&
                    setEditingProfile({
                      ...editingProfile,
                      snoozeDuration: parseInt(text) || 0,
                    })
                  }
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                />
                <Text style={styles.unit}>minutes</Text>
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Smartphone size={20} color="#6B7280" strokeWidth={2} />
                <Text style={styles.label}>Notify On</Text>
              </View>
              <View style={styles.radioGroup}>
                <Pressable
                  style={[
                    styles.radioOption,
                    editingProfile?.notifyOn === 'all' && styles.radioOptionSelected,
                  ]}
                  onPress={() =>
                    editingProfile &&
                    setEditingProfile({ ...editingProfile, notifyOn: 'all' })
                  }
                >
                  <View style={styles.radio}>
                    {editingProfile?.notifyOn === 'all' && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <View>
                    <Text style={styles.radioLabel}>All Devices</Text>
                    <Text style={styles.radioDescription}>
                      Notify on this and all synced devices
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  style={[
                    styles.radioOption,
                    editingProfile?.notifyOn === 'other' && styles.radioOptionSelected,
                  ]}
                  onPress={() =>
                    editingProfile &&
                    setEditingProfile({ ...editingProfile, notifyOn: 'other' })
                  }
                >
                  <View style={styles.radio}>
                    {editingProfile?.notifyOn === 'other' && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <View>
                    <Text style={styles.radioLabel}>Other Devices Only</Text>
                    <Text style={styles.radioDescription}>
                      Notify on other saved devices only
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Smartphone size={20} color="#6B7280" strokeWidth={2} />
                <Text style={styles.label}>Preferred Devices</Text>
              </View>
              <Text style={styles.helperText}>
                Select specific devices to receive notifications
              </Text>
              <View style={styles.deviceList}>
                {devices.map(device => {
                  const isSelected = editingProfile?.preferredDevices?.includes(
                    device.id
                  );
                  return (
                    <Pressable
                      key={device.id}
                      style={[
                        styles.deviceOption,
                        isSelected && styles.deviceOptionSelected,
                      ]}
                      onPress={() => toggleDevice(device.id)}
                    >
                      <View style={styles.checkbox}>
                        {isSelected && <View style={styles.checkboxInner} />}
                      </View>
                      <Text style={styles.deviceName}>{device.name}</Text>
                      <Text style={styles.deviceType}>
                        {device.type.charAt(0).toUpperCase() + device.type.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {canDeleteProfile && (
              <Pressable
                style={styles.deleteButton}
                onPress={handleDeleteProfile}
              >
                <Text style={styles.deleteButtonText}>Delete Profile</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

interface ProfileCardProps {
  profile: ReminderProfile;
  onPress: () => void;
}

function ProfileCard({ profile, onPress }: ProfileCardProps) {
  return (
    <Pressable style={styles.profileCard} onPress={onPress}>
      <View style={styles.profileHeader}>
        <Text style={styles.profileName}>{profile.name}</Text>
        <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
      </View>
      <View style={styles.profileDetails}>
        <View style={styles.detailItem}>
          <Bell size={14} color="#6B7280" strokeWidth={2} />
          <Text style={styles.detailText}>{profile.notifyBefore} min before</Text>
        </View>
        <View style={styles.detailItem}>
          <Clock size={14} color="#6B7280" strokeWidth={2} />
          <Text style={styles.detailText}>{profile.snoozeDuration} min snooze</Text>
        </View>
        <View style={styles.detailItem}>
          <Smartphone size={14} color="#6B7280" strokeWidth={2} />
          <Text style={styles.detailText}>
            {profile.notifyOn === 'all' ? 'All devices' : 'Other devices'}
            {profile.preferredDevices?.length > 0 &&
              ` (${profile.preferredDevices.length} preferred)`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 70,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '300' as const,
    color: '#1F2937',
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#1F2937',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '500' as const,
    color: '#1F2937',
    letterSpacing: 0.3,
  },
  profileDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    letterSpacing: 0.2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#6B7280',
    marginTop: 16,
    letterSpacing: 0.3,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center' as const,
    paddingHorizontal: 32,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  modalCloseButton: {
    paddingVertical: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '500' as const,
    color: '#1F2937',
    letterSpacing: 0.3,
  },
  modalSaveButton: {
    paddingVertical: 8,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#60A5FA',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  formGroup: {
    marginBottom: 32,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#374151',
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FAFAFA',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  numberInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FAFAFA',
  },
  unit: {
    fontSize: 15,
    color: '#6B7280',
  },
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    backgroundColor: '#FAFAFA',
  },
  radioOptionSelected: {
    borderColor: '#60A5FA',
    backgroundColor: 'rgba(96, 165, 250, 0.05)',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#60A5FA',
  },
  radioLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#1F2937',
    letterSpacing: 0.2,
  },
  radioDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  deleteButton: {
    marginTop: 16,
    marginBottom: 32,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#EF4444',
    textAlign: 'center' as const,
    letterSpacing: 0.3,
  },
  helperText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  deviceList: {
    gap: 10,
  },
  deviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    backgroundColor: '#FAFAFA',
  },
  deviceOptionSelected: {
    borderColor: '#60A5FA',
    backgroundColor: 'rgba(96, 165, 250, 0.05)',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#60A5FA',
  },
  deviceName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#1F2937',
    letterSpacing: 0.2,
  },
  deviceType: {
    fontSize: 12,
    color: '#9CA3AF',
    letterSpacing: 0.3,
  },
});

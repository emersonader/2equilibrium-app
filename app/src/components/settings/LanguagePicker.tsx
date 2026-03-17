import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { Button } from '@/components/ui';
import { useUserStore } from '@/stores/userStore';
import { useTranslation } from 'react-i18next';

interface LanguageOption {
  code: string;
  label: string;
  flag: string;
  nativeLabel: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', flag: '🇺🇸', nativeLabel: 'English' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸', nativeLabel: 'Español' },
  { code: 'pt', label: 'Portuguese', flag: '🇧🇷', nativeLabel: 'Português' },
];

export function LanguagePicker() {
  const { t } = useTranslation();
  const { language, setLanguage } = useUserStore();
  const [showPicker, setShowPicker] = useState(false);

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  const handleSelect = (code: string) => {
    setLanguage(code);
    setShowPicker(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setShowPicker(true)}
        style={({ pressed }) => [
          styles.settingsItem,
          pressed && styles.settingsItemPressed,
        ]}
      >
        <View style={styles.settingsIconContainer}>
          <Ionicons name="language-outline" size={22} color={Colors.primary.orange} />
        </View>
        <View style={styles.settingsContent}>
          <Text style={styles.settingsTitle}>{t('language.title')}</Text>
          <Text style={styles.settingsSubtitle}>
            {currentLang.flag} {currentLang.nativeLabel}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.text.muted} />
      </Pressable>

      <Modal
        visible={showPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('language.selectLanguage')}</Text>

            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  language === lang.code && styles.languageOptionSelected,
                ]}
                onPress={() => handleSelect(lang.code)}
              >
                <Text style={styles.languageFlag}>{lang.flag}</Text>
                <View style={styles.languageLabels}>
                  <Text style={[
                    styles.languageNative,
                    language === lang.code && styles.languageNativeSelected,
                  ]}>
                    {lang.nativeLabel}
                  </Text>
                  <Text style={styles.languageEnglish}>{lang.label}</Text>
                </View>
                {language === lang.code && (
                  <Ionicons name="checkmark" size={20} color={Colors.primary.orange} />
                )}
              </TouchableOpacity>
            ))}

            <Button
              title={t('common.cancel')}
              variant="outline"
              onPress={() => setShowPicker(false)}
              style={styles.cancelButton}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  settingsItemPressed: {
    backgroundColor: Colors.background.secondary,
  },
  settingsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary.orangeLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  settingsSubtitle: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    ...Typography.h4,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background.secondary,
    gap: Spacing.md,
  },
  languageOptionSelected: {
    backgroundColor: Colors.primary.orangeLight + '20',
    borderWidth: 1,
    borderColor: Colors.primary.orange,
  },
  languageFlag: {
    fontSize: 28,
  },
  languageLabels: {
    flex: 1,
  },
  languageNative: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  languageNativeSelected: {
    color: Colors.primary.orange,
    fontWeight: '600',
  },
  languageEnglish: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  cancelButton: {
    marginTop: Spacing.lg,
  },
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const SettingsScreen = () => {
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [isReadingMode, setIsReadingMode] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [falarMenusEnabled, setFalarMenusEnabled] = useState(false);

  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const falarConfiguracoes = () => {
    const texto =
      "Configurações do aplicativo. " +
      "Ativar ou desativar notificações push. " +
      "Ajustar o tamanho da fonte do texto. " +
      "Ativar o modo de leitura para ter ajuda por voz. " +
      "Ativar ou desativar os áudios do aplicativo. " +
      "Ativar a leitura dos menus. " +
      "Redefinir todas as configurações para os padrões.";
    Speech.stop();
    Speech.speak(texto, { language: 'pt-BR' });
  };

  const toggleModoLeitura = async () => {
  const newMode = !isReadingMode;
  setIsReadingMode(newMode);
  await AsyncStorage.setItem('modoLeitura', newMode ? 'true' : 'false');

  if (!newMode) {
    // Se desativar, desliga também o "Falar os Menus"
    setFalarMenusEnabled(false);
    await AsyncStorage.setItem('falarMenus', 'false');
    Speech.stop();
    return;
  }

  // ✅ Sempre fala essa frase ao ativar
  Speech.stop();
  Speech.speak("Modo leitor de tela ativado", { language: 'pt-BR' });
};


  const toggleNotifications = async () => {
    const newStatus = !isNotificationsEnabled;
    setIsNotificationsEnabled(newStatus);
    if (newStatus) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log("Permissão para notificações não concedida");
      } else {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Notificações ativadas!",
            body: "Você receberá notificações.",
          },
          trigger: { seconds: 2 },
        });
      }
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
    await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(newStatus));
  };

  const toggleAudio = async () => {
    const newStatus = !isAudioEnabled;
    setIsAudioEnabled(newStatus);
    await AsyncStorage.setItem('audioEnabled', JSON.stringify(newStatus));
  };

  const toggleFalarMenus = async () => {
    const newStatus = !falarMenusEnabled;
    setFalarMenusEnabled(newStatus);
    await AsyncStorage.setItem('falarMenus', JSON.stringify(newStatus));
    if (newStatus) {
      Speech.speak("Falar os menus ativado", { language: 'pt-BR' });
    } else {
      Speech.stop();
    }
  };

  const changeFontSize = (increase: boolean) => {
    const newSize = increase ? fontSize + 2 : fontSize - 2;
    setFontSize(newSize);
    AsyncStorage.setItem('fontSize', JSON.stringify(newSize));
  };

  const resetSettings = async () => {
    await AsyncStorage.multiRemove([
      'notificationsEnabled',
      'fontSize',
      'modoLeitura',
      'audioEnabled',
      'falarMenus',
    ]);

    setIsNotificationsEnabled(false);
    setFontSize(16);
    setIsReadingMode(false);
    setIsAudioEnabled(true);
    setFalarMenusEnabled(false);

    Speech.stop();
  };

  useEffect(() => {
    const loadSettings = async () => {
      const n = await AsyncStorage.getItem('notificationsEnabled');
      const f = await AsyncStorage.getItem('fontSize');
      const r = await AsyncStorage.getItem('modoLeitura');
      const a = await AsyncStorage.getItem('audioEnabled');
      const fm = await AsyncStorage.getItem('falarMenus');

      if (n !== null) setIsNotificationsEnabled(JSON.parse(n));
      if (f !== null) setFontSize(JSON.parse(f));
      if (r !== null) setIsReadingMode(JSON.parse(r));
      if (a !== null) setIsAudioEnabled(JSON.parse(a));
      if (fm !== null && JSON.parse(r || 'false')) {
        const menus = JSON.parse(fm);
        setFalarMenusEnabled(menus);
        if (menus) {
          Speech.stop();
          Speech.speak("Configurações do aplicativo", { language: 'pt-BR' });
        }
      }
    };
    loadSettings();
  }, [isFocused]);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontSize }]}>Configurações do Aplicativo</Text>

      <View style={styles.option}>
        <Text style={[styles.label, { fontSize }]}>Ativar Notificações Push</Text>
        <Switch value={isNotificationsEnabled} onValueChange={toggleNotifications} />
      </View>

      <View style={styles.option}>
        <Text style={[styles.label, { fontSize, color: '#ffffffff' }]}>
          Modo Leitor de Tela (acessibilidade)
        </Text>
        <Switch value={isReadingMode} onValueChange={toggleModoLeitura} />
      </View>

      {isReadingMode && (
        <View style={styles.option}>
          <Text style={[styles.label, { fontSize }]}>Falar os Menus</Text>
          <Switch value={falarMenusEnabled} onValueChange={toggleFalarMenus} />
        </View>
      )}

      <View style={styles.option}>
        <Text style={[styles.label, { fontSize }]}>Tamanho da Fonte</Text>
        <View style={styles.fontControls}>
          <TouchableOpacity style={styles.adjustButton} onPress={() => changeFontSize(false)}>
            <Text style={styles.adjustText}>-</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.adjustButton} onPress={() => changeFontSize(true)}>
            <Text style={styles.adjustText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

        <TouchableOpacity style={styles.resetButton} onPress={resetSettings}>
          <Text style={styles.resetText}>Redefinir Configurações Padrão</Text>
        </TouchableOpacity>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('index')}>
          <Icon name="home" size={20} color="#fff" />
          <Text style={styles.homeButtonText}>Voltar ao Menu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#fff',
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 15,
  },
  label: {
    color: '#fff',
    flex: 1,
  },
  fontControls: {
    flexDirection: 'row',
    gap: 10,
  },
  adjustButton: {
    backgroundColor: '#444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  adjustText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  resetButton: {
    backgroundColor: '#ff6666',
    padding: 16,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 50,
    width: '90%',
  },
  resetText: {
    color: '#fff',
    fontWeight: 'bold',
    alignSelf:'center',
    fontSize: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: '#1E88E5',
    borderRadius: 8,
  },
  homeButtonText: {
    fontSize: 16,
    marginLeft: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default SettingsScreen;

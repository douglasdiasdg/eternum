import { Cinzel_700Bold, useFonts } from '@expo-google-fonts/cinzel';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  ImageBackground,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function HomeTab() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({ Cinzel_700Bold });

  const [isSearching, setIsSearching] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [falarMenusAtivo, setFalarMenusAtivo] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (hasSearched && !loading && results.length === 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [hasSearched, loading, results]);

  const { voltarParaBusca } = useLocalSearchParams();
  useEffect(() => {
    if (voltarParaBusca === 'true') {
      setIsSearching(true);
    }
  }, [voltarParaBusca]);

  // Ao montar, verifica se acessibilidade está ativada e fala menus se sim
  useEffect(() => {
    const checkFalarMenus = async () => {
      try {
        const falarMenusValue = await AsyncStorage.getItem('falarMenus');
        if (falarMenusValue === 'true') {
          setFalarMenusAtivo(true);
          Speech.speak("Você está na Tela Principal", {
            language: 'pt-BR',
            onDone: () => {
              Speech.speak('Menu, Memorial. Menu, Contato. Menu, Configurações', {
                language: 'pt-BR',
              });
            },
          });
        }
      } catch (e) {
        console.warn('Erro ao ler configuração falarMenus', e);
      }
    };
    checkFalarMenus();
  }, []);

  async function falarIntroducaoDeBusca() {
  try {
    setIsSearching(true); // primeiro exibe a tela

    const modoLeitura = await AsyncStorage.getItem('modoLeitura');
    if (modoLeitura === 'true') {
      // aguarda 500ms para garantir que a tela já mudou
      setTimeout(() => {
        Speech.speak('Busca de falecidos', {
          language: 'pt-BR',
          onDone: () => {
            Speech.speak(
              'Digite o nome do falecido ou parte dele, ou digite a data de falecimento e depois clique no botão pesquisar.',
              { language: 'pt-BR' }
            );
          },
        });
      }, 500);
    }
  } catch (error) {
    console.warn('Erro ao verificar modoLeitura:', error);
  }
}
  const convertDateToApi = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('/');
    if (parts.length !== 3) return '';
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const handleDateChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = '';
    if (cleaned.length <= 2) {
      formatted = cleaned;
    } else if (cleaned.length <= 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    } else {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    }
    setDate(formatted);
  };

  const handleSearch = async () => {
    if (!name.trim() && !date.trim()) {
      Alert.alert('Atenção', 'Preencha ao menos o nome ou a data de falecimento.');
      return;
    }

    setLoading(true);
    setResults([]);
    setHasSearched(true);
    Keyboard.dismiss();

    try {
      const response = await axios.get('https://obituario.umuarama.pr.gov.br/memorial_api.php', {
        params: { nome: name, data: convertDateToApi(date) },
        timeout: 10000,
      });
      router.push({
        pathname: '/resultados',
        params: { dados: JSON.stringify(response.data) },
      });
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      Alert.alert('Erro', 'Não foi possível buscar os dados. Verifique sua conexão ou tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToMenu = async () => {
  // Para a fala atual imediatamente
  Speech.stop();

  // Limpa os dados de busca
  setIsSearching(false);
  setName('');
  setDate('');
  setResults([]);
  setHasSearched(false);

  // Verifica se "Falar os Menus" está ativo
  const falarMenus = await AsyncStorage.getItem('falarMenus');
  const falarMenusAtivo = falarMenus === 'true';

  // Se estiver ativo, fala os menus da tela principal
  if (falarMenusAtivo) {
    Speech.speak("Você está na Tela Principal", {
      language: 'pt-BR',
      onDone: () => {
        Speech.speak('Menu, Memorial. Menu, Contato. Menu, Configurações', {
          language: 'pt-BR',
        });
      },
    });
  }
};


  if (!fontsLoaded) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Carregando fontes...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={{ uri: 'https://obituario.umuarama.pr.gov.br/img_1/back_0.jpg' }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.memorial}>MEMORIAL</Text>
          <Text style={styles.eternum}>ETERNUM</Text>
          <Text style={styles.subtitle}>
            "Preservando a memória daqueles {"\n"} que marcaram sua vida."
          </Text>
        </View>

        {!isSearching && (
          <>
            <View style={styles.buttonColumn}>
              <MenuButton
                title="Memorial"
                falaTexto="Memorial"
                falar={falarMenusAtivo}
                onPress={falarIntroducaoDeBusca}
              />
              <MenuButton
                title="Contato"
                falaTexto="Contato"
                falar={falarMenusAtivo}
                onPress={() => router.push('/contato')}
              />
              <MenuButton
                title="Configurações"
                falaTexto="Configurações"
                falar={falarMenusAtivo}
                onPress={() => router.push('/settingsScreen')}
              />
            </View>

            <Text style={styles.version}>
              Versão 1.0
            </Text>

            <Text style={styles.footer}>
              Todos os Direitos reservados.{"\n"}
              Designed by Douglas Dias Borges.
            </Text>
          </>
        )}

        {isSearching && (
          <View style={styles.searchSection}>
            <Text style={styles.searchHeader}>Busca de Falecido 🔍</Text>

            <TextInput
              style={styles.input}
              placeholder="Digite aqui o nome ou parte do nome"
              textAlign="center"
              placeholderTextColor="#ccc"
              value={name}
              onChangeText={setName}
              returnKeyType="done"
            />
            <Text style={styles.searchou}>Ou</Text>

            <TextInput
              style={styles.input}
              placeholder="Digite a data de falecimento"
              textAlign="center"
              placeholderTextColor="#ccc"
              keyboardType="numeric"
              value={date}
              onChangeText={handleDateChange}
              returnKeyType="done"
              maxLength={10}
            />

            <TouchableOpacity style={styles.buttonOuter} onPress={handleSearch}>
              <View style={styles.buttonInner}>
                <Text style={styles.buttonText}>Pesquisar</Text>
              </View>
            </TouchableOpacity>

            {loading && <Text style={styles.noResults}>Carregando...</Text>}

            {!loading && hasSearched && results.length === 0 && (
              <Animated.Text style={[styles.noResults, { opacity: fadeAnim }]}>
                Nenhum resultado encontrado.
              </Animated.Text>
            )}

            <FlatList
              data={results}
              keyExtractor={(item) => String(item.id)}
              style={styles.resultsList}
              contentContainerStyle={styles.resultsContainer}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() =>
                    router.push({
                      pathname: '/memorial/detalhe',
                      params: item,
                    })
                  }
                >
                  <Text style={styles.resultText}>{item.nome}</Text>
                  <Text style={styles.resultSub}>
                    Falecimento: {formatDateForDisplay(item.falec)}
                  </Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity style={styles.homeButton} onPress={handleBackToMenu}>
              <Icon name="home" size={24} color="#fff" />
              <Text style={styles.homeButtonText}>Voltar ao Menu</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ImageBackground>
  );
}

// ✅ MenuButton com fala integrada
function MenuButton({
  title,
  onPress,
  falaTexto,
  falar = false,
}: {
  title: string;
  onPress: () => void;
  falaTexto?: string;
  falar?: boolean;
}) {
  const handlePress = () => {
    if (falar && falaTexto) {
      Speech.stop();
      Speech.speak(falaTexto, {
        language: 'pt-BR',
        onDone: () => onPress(),
      });
    } else {
      onPress();
    }
  };

  return (
    <TouchableOpacity style={styles.buttonOuter} onPress={handlePress} activeOpacity={0.85}>
      <View style={styles.buttonInner}>
        <Text style={styles.buttonText}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  centered: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  memorial: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(161, 161, 161, 0.8)',
    textShadowOffset: { width: 2, height: -2 },
    textShadowRadius: 1.1,
    elevation: 8,
  },
  eternum: {
    fontSize: 60,
    fontFamily: 'Cinzel_700Bold',
    color: '#dfefff',
    textAlign: 'center',
    textShadowColor: 'rgba(161, 161, 161, 0.8)',
    textShadowOffset: { width: 3, height: -3 },
    textShadowRadius: 1.1,
    elevation: 8,
  },
  subtitle: {
    fontSize: 19,
    color: '#fffafa',
    textAlign: 'center',
  },
  buttonColumn: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
  },
  buttonOuter: {
    width: '90%',
    marginVertical: 12,
    alignSelf: 'center',
    borderRadius: 14,
    backgroundColor: '#dfefff',
    shadowColor: '#000',
    shadowOffset: { width: 3, height: -3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#b0d4e3',
  },
  buttonText: {
    color: '#4f4f4f',
    fontSize: 21,
    fontWeight: 'bold',
    textAlign: 'center',
    shadowOpacity: 0.4,
  },
  version: {
    marginTop: 'auto',
    textAlign: 'center',
    color: '#fff',
    fontSize: 14,
    paddingTop: 20,
  },
  footer: {
    marginTop: 'auto',
    textAlign: 'center',
    color: '#fff',
    fontSize: 14,
    paddingTop: 20,
  },
  searchSection: { flex: 1, marginTop: 50 },
  searchHeader: {
    fontSize: 26,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  searchou: {
    fontSize: 12,
    color: '#eee',
    textAlign: 'center',
    marginBottom: -5,
    top: -10,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    borderColor: '#87ceeb',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    width: '90%',
    color: '#fff',
  },
  resultsList: { marginTop: 20, width: '90%', alignSelf: 'center' },
  resultsContainer: { paddingBottom: 40 },
  resultItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  resultText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultSub: {
    color: '#fff',
    fontSize: 14,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(135,206,235,0.7)',
    borderRadius: 8,
    alignSelf: 'center',
  },
  homeButtonText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 18,
  },
  noResults: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});

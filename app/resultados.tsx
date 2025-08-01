import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect } from 'react';
import {
  FlatList,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function Resultados() {
  const router = useRouter();
  const { dados } = useLocalSearchParams<{ dados: string }>();
  const results = JSON.parse(dados || '[]');

  const formatDateForDisplay = (dateString: string) => {
    const parts = dateString?.split('-');
    if (parts?.length !== 3) return dateString;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // ⬇️ Leitura de tela
  useEffect(() => {
  let timeoutIds: NodeJS.Timeout[] = [];

  const lerResultados = async () => {
    const modoLeitura = await AsyncStorage.getItem('modoLeitura');
    if (modoLeitura !== 'true') return;

    Speech.stop();
    Speech.speak('Resultados da busca', { language: 'pt-BR', rate: 1 });

    if (results.length === 0) {
      const id = setTimeout(() => {
        Speech.speak('Nenhum resultado encontrado.', { language: 'pt-BR', rate: 1 });
      }, 1000);
      timeoutIds.push(id);
    } else {
      results.forEach((item: any, index: number) => {
        const delay = (index + 1) * 2500;
        const id = setTimeout(() => {
          Speech.speak(`${item.nome}, falecido em ${formatDateForDisplay(item.falec)}`, {
            language: 'pt-BR',
            rate: 1,
          });
        }, delay);
        timeoutIds.push(id);
      });
    }

    // Leitura do botão "Voltar para Pesquisa"
    const finalDelay = (results.length + 1) * 2500;
    const id = setTimeout(() => {
      Speech.speak('Botão: Voltar para Pesquisa', { language: 'pt-BR', rate: 1 });
    }, finalDelay);
    timeoutIds.push(id);
  };

  lerResultados();

  return () => {
    // Limpa timeouts se componente for desmontado
    timeoutIds.forEach(clearTimeout);
    Speech.stop(); // para garantir que nenhuma fala continue
  };
}, [results]);


const abrirMemorial = async (item: any) => {
  const modoLeitura = await AsyncStorage.getItem('modoLeitura');

  Speech.stop(); // sempre limpa qualquer fala anterior

  if (modoLeitura === 'true') {
    const frase = `Abrindo memorial de ${item.nome}`;
    Speech.speak(frase, {
      language: 'pt-BR',
      rate: 1,
      onDone: () => {
        router.push({
          pathname: '/memorial/detalhe',
          params: item,
        });
      },
    });
  } else {
    router.push({
      pathname: '/memorial/detalhe',
      params: item,
    });
  }
};

  return (
    <ImageBackground
      source={{ uri: 'https://obituario.umuarama.pr.gov.br/img_1/back_0.jpg' }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View style={styles.container}>
        <Text style={styles.header}>Resultados da busca</Text>

        {results.length === 0 ? (
          <Text style={styles.noResults}>Nenhum resultado encontrado.</Text>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => abrirMemorial(item)}
              >
                <Text style={styles.resultText}>{item.nome}</Text>
                <Text style={styles.resultSub}>
                  Falecimento: {formatDateForDisplay(item.falec)}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Speech.stop();
            router.replace({ pathname: '/', params: { voltarParaBusca: 'true' } });
          }}
        >
          <Icon name="search" size={20} color="#fff" />
          <Text style={styles.backButtonText}>Voltar para Pesquisa</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

// estilos (sem alterações)
const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 26,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  listContainer: {
    paddingBottom: 40,
  },
  resultItem: {
    width: '90%',
    alignSelf: 'center',
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
  noResults: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 30,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    alignSelf: 'center',
    backgroundColor: 'rgba(135,206,235,0.7)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 10,
  },
});

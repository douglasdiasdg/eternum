import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

type PersonItem = {
  sepultado_id: string | null;
  nome: string;
  hasMemorial: number | string;
  memorialId?: number | string | null;
};

export default function Sepultados() {
  const router = useRouter();
  const { localsep } = useLocalSearchParams<{ localsep: string }>();
  const [people, setPeople] = useState<PersonItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('https://obituario.umuarama.pr.gov.br/buscar_por_localsep.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ localsep }),
      });
      const result = await response.json();
      console.log('resultado sepultados por localsep:', result);
      setPeople(result);
    } catch (error) {
      console.error('Erro ao buscar:', error);
    } finally {
      setLoading(false);
    }
  }, [localsep]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [localsep, fetchData])
  );

  const renderItem = ({ item }: { item: PersonItem }) => {
    const hasMemorial = Boolean(Number(item.hasMemorial));
    const textContent = (
      <Text style={[styles.item, hasMemorial ? styles.hasMemorialText : null]}>
        {item.nome} {hasMemorial ? '📜' : ''}
      </Text>
    );

    if (hasMemorial && item.memorialId) {
      return (
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/memorial/detalhe',
              params: { id: String(item.memorialId), nome: item.nome },
            })
          }
          accessibilityRole="button"
          activeOpacity={0.7}
        >
          {textContent}
        </TouchableOpacity>
      );
    } else {
      return textContent;
    }
  };

  return (
    <ImageBackground
      source={require('./img_1/ceu_4.jpg')}
      style={styles.background}
    >
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Text style={styles.title}>
          Sepultados na {localsep ? localsep : 'Local não informado'}
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#87ceeb" style={styles.loader} />
        ) : (
          <FlatList
            data={people}
            keyExtractor={(item, index) =>
              item.sepultado_id
                ? `sep-${item.sepultado_id}`
                : item.memorialId
                ? `mem-${item.memorialId}`
                : `idx-${index}`
            }
            renderItem={renderItem}
            ListEmptyComponent={<Text style={styles.empty}>Ninguém encontrado neste local.</Text>}
            contentContainerStyle={styles.listContainer}
          />
        )}

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() =>
            router.replace({
              pathname: '/',
              params: { voltarParaBusca: 'true' },
            })
          }
        >
          <Icon name="search" size={24} color="#1c1c1c" />
          <Text style={styles.homeButtonText}>Voltar para Pesquisa</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    top: 10,
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
  },
  loader: {
    marginTop: 30,
  },
  listContainer: {
    paddingBottom: 80,
  },
  item: {
    fontSize: 18,
    color: '#eee',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  hasMemorialText: {
    fontWeight: 'bold',
  },
  empty: {
    color: '#ccc',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
  },
  homeButton: {
    position: 'absolute',
    bottom: 25,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgb(255,255,255)',
    borderRadius: 8,
  },
  homeButtonText: {
    color: '#1c1c1c',
    fontSize: 16,
    marginLeft: 8,
  },
});

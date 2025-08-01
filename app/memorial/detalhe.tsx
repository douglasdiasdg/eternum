import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  ImageBackground,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const BASE_URL = 'https://obituario.umuarama.pr.gov.br/fotos';

function getRemoteImageUri(id: string | string[]): string {
  const resolvedId = Array.isArray(id) ? id[0] : String(id ?? '');
  if (!resolvedId) return `${BASE_URL}/default.jpg`;
  return `${BASE_URL}/${encodeURIComponent(resolvedId)}.jpg`;
}

type RemoteImageProps = {
  id: string | string[];
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center' | 'repeat';
};

function RemoteImage({ id, style, resizeMode = 'cover' }: RemoteImageProps) {
  const [error, setError] = useState(false);
  const uri = getRemoteImageUri(id);

  return (
    <View style={[styles.imageWrapper, style]}>
      {!error ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode={resizeMode}
          onError={() => setError(true)}
          defaultSource={require('../fotos/default.jpg')}
        />
      ) : (
        <Image
          source={require('../fotos/default.jpg')}
          style={StyleSheet.absoluteFill}
          resizeMode={resizeMode}
        />
      )}
    </View>
  );
}

export default function MemorialDetalhe() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [bgError, setBgError] = useState(false);
  const [remoteData, setRemoteData] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);

  //
  // AUDIO
  //
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadAndPlay = async () => {
      try {
        let soundObj: Audio.Sound | null = null;
        try {
          const remoteUri =
            'https://obituario.umuarama.pr.gov.br/music/memorias.mp3';
          const { sound } = await Audio.Sound.createAsync(
            { uri: remoteUri },
            { shouldPlay: true, isLooping: true }
          );
          soundObj = sound;
        } catch (eRemote) {
          console.warn(
            'Falha ao carregar áudio remoto, usando local. Erro:',
            eRemote
          );
          const { sound } = await Audio.Sound.createAsync(
            require('../music/memorias.mp3'),
            { shouldPlay: true, isLooping: true }
          );
          soundObj = sound;
        }

        if (isMounted && soundObj) {
          soundRef.current = soundObj;
          await soundObj.playAsync();
        }
      } catch (error) {
        console.error('Erro ao carregar áudio:', error);
      }
    };

    loadAndPlay();

    return () => {
      isMounted = false;
      soundRef.current?.unloadAsync();
      Speech.stop();
    };
  }, []);

  //
  // VISITAS
  //
  const [visitCount, setVisitCount] = useState(0);

  useEffect(() => {
    if (!params.id) return;
    const incrementVisit = async () => {
      try {
        const response = await fetch(
          'https://obituario.umuarama.pr.gov.br/increment_visit.php',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: params.id }),
          }
        );

        const result = await response.json();
        if (result?.count !== undefined) {
          setVisitCount(result.count);
        }
      } catch (error) {
        console.error('Erro ao incrementar visitas:', error);
      }
    };

    incrementVisit();
  }, [params.id]);

  //
  // BUSCAR DETALHES DO FALECIDO POR ID
  //
  useEffect(() => {
    if (!params.id) return;
    const fetchDetail = async () => {
      try {
        setLoadingDetail(true);
        const resp = await fetch(
          `https://obituario.umuarama.pr.gov.br/obter_falecido.php?id=${encodeURIComponent(
            params.id
          )}`
        );
        const json = await resp.json();
        setRemoteData(json);
      } catch (e) {
        console.error('Erro ao buscar falecido:', e);
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchDetail();
  }, [params.id]);

  //
  // FORMATOS
  //
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não informada';
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return 'Data não informada';
    return `${day}/${month}/${year}`;
  };

  const calculateAge = (nasc: string, falec: string) => {
    if (!nasc || !falec) return '';
    const [by, bm, bd] = nasc.split('-').map(Number);
    const [dy, dm, dd] = falec.split('-').map(Number);
    if (!by || !bm || !bd || !dy || !dm || !dd) return '';

    let years = dy - by;
    let months = dm - bm;
    let days = dd - bd;

    if (days < 0) {
      months -= 1;
      days += 30;
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    let result = '';
    if (years > 0) result += `${years} ano${years > 1 ? 's' : ''}`;
    if (months > 0)
      result += (result ? ' e ' : '') + `${months} mês${months > 1 ? 'es' : ''}`;
    if (!result && days > 0) result = `${days} dia${days > 1 ? 's' : ''}`;
    return result;
  };

  // Converte "Q:xx L:xx" (ou variações) para "Quadra xx Lote xx"
  const formatLocalsepForSpeech = (loc: string) => {
    if (!loc) return 'Local de sepultura não informado';
    const q = /Q(?:uadra)?\s*[:\-]?\s*([A-Za-z0-9]+)/i.exec(loc);
    const l = /L(?:ote)?\s*[:\-]?\s*([A-Za-z0-9]+)/i.exec(loc);
    if (q && l) {
      return `Quadra ${q[1]} Lote ${l[1]}`;
    }
    return loc;
  };

  //
  // DADOS (UNIFICANDO REMOTO E PARAMS)
  //
  const data = {
    id: params?.id ?? remoteData?.id ?? '0',
    nome: remoteData?.nome ?? params?.nome ?? 'Nome não informado',
    nasc: remoteData?.nasc ?? params?.nasc ?? '',
    falec: remoteData?.falec ?? params?.falec ?? '',
    pai: remoteData?.pai ?? params?.pai ?? 'Pai não informado',
    mae: remoteData?.mae ?? params?.mae ?? 'Mãe não informada',
    localsep:
      remoteData?.localsep ?? params?.localsep ?? 'Local de sepultura não informado',
    historia: remoteData?.historia ?? params?.historia ?? '',
    email: remoteData?.email ?? params?.email ?? 'memorialeternum@gmail.com',
    sexo: remoteData?.sexo ?? params?.sexo ?? '',
  };

  const formattedNasc = formatDate(data.nasc);
  const formattedFalec = formatDate(data.falec);
  const idadeTexto = calculateAge(data.nasc, data.falec);

  //
  // LEITURA (REAÇÃO A MUDANÇA DE ID)
  //
  const hasSpokenRef = useRef(false);

 useEffect(() => {
  if (!params.id) return;
  if (!remoteData) return; // espera os dados completos

  // permite nova leitura ao trocar de memorial
  hasSpokenRef.current = false;

  const lerInformacoes = async () => {
    if (!data?.nome || hasSpokenRef.current) return;

    const modoLeituraAtivo = await AsyncStorage.getItem('modoLeitura');
    const localsepStored = await AsyncStorage.getItem('localsep');

    console.log('data.sexo:', data.sexo);

    if (modoLeituraAtivo === 'true') {
      hasSpokenRef.current = true;

      const localsepSpeech = formatLocalsepForSpeech(
        localsepStored ?? data.localsep
      );
      const generoFeminino = String(data.sexo).toUpperCase() === 'F';

      const textoFalecido = generoFeminino ? 'falecida' : 'falecido';
      const textoNascido = generoFeminino ? 'nascida' : 'nascido';
      const textoFilho = generoFeminino ? 'filha' : 'filho';

      let texto = `Memorial de ${data.nome}. `;

      if (data.nasc && data.falec) {
        texto += `${textoNascido} em ${formattedNasc}. ${textoFalecido} em ${formattedFalec}. `;
      } else if (data.nasc) {
        texto += `${textoNascido} em ${formattedNasc}. `;
      } else if (data.falec) {
        texto += `${textoFalecido} em ${formattedFalec}. `;
      }

      if (idadeTexto) {
        texto += `Idade: ${idadeTexto}. `;
      }

      texto += `${textoFilho} de ${data.pai} e ${data.mae}. `;
      texto += `Sepultado na ${localsepSpeech}. `;
      texto += `Línqui. Veja quem mais está sepultado aqui. `;

      if (data.historia) {
        texto += `História: ${data.historia}. `;
      }

      texto += `Botão: Deixe sua mensagem. `;
      texto += `Línqui. Quer fazer um memorial como este? Clique aqui. `;
      texto += `Botão: Voltar ao Menu.`;

      console.log('Texto para narração:', texto);

      try {
        if (soundRef.current) {
          await soundRef.current.setVolumeAsync(0.2);
        }

        Speech.speak(texto, {
          language: 'pt-BR',
          rate: 1,
          onDone: async () => {
            if (soundRef.current) {
              await soundRef.current.setVolumeAsync(1.0);
            }
          },
        });
      } catch (e) {
        console.error('Erro ao narrar:', e);
      }
    }
  };

  lerInformacoes();

  return () => {
    Speech.stop();
  };
}, [params.id, remoteData]);

  //
  // UI
  //
  const sendEmail = () => {
    const url = `mailto:${data.email}?subject=Homenagem para ${encodeURIComponent(
      data.nome
    )}`;
    Linking.openURL(url).catch(() =>
      alert('Não foi possível abrir o cliente de e-mail')
    );
  };

  return (
    <ImageBackground
      source={
        !bgError
          ? { uri: 'https://obituario.umuarama.pr.gov.br/img_1/ceu.jpg' }
          : require('../img_1/ceu.jpg')
      }
      style={styles.background}
      onError={() => {
        setBgError(true);
      }}
    >
      <View style={styles.overlay} />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topSection}>
          <RemoteImage id={data.id} style={styles.profileImage} />
          <Text style={styles.header}>{data.nome}</Text>
          <Text style={styles.subheader}>
            🌠 {formattedNasc} ✝ {formattedFalec}
          </Text>
          {idadeTexto ? (
            <Text style={styles.idade}>{idadeTexto}</Text>
          ) : null}
          <Text style={styles.visitCountText}>
            👁️ {visitCount} visita{visitCount !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.label}>
            Pai: <Text style={styles.info}>{data.pai}</Text>
          </Text>
          <Text style={styles.label}>
            Mãe: <Text style={styles.info}>{data.mae}</Text>
          </Text>
          <Text style={styles.label}>
            Sepultura:<Text style={styles.info}>{data.localsep}</Text>
          </Text>
          <Text
            style={styles.linkSepultura}
            onPress={async () => {
              // Armazene o valor de 'localsep' no AsyncStorage
              await AsyncStorage.setItem('localsep', data.localsep);
              router.push({
                pathname: '/sepultados',
                params: { localsep: data.localsep },
              });
            }}
          >
            (Veja quem mais está sepultado aqui)
          </Text>
        </View>

        <View style={styles.storyBox}>
          <Text style={styles.storyTitle}>História</Text>
          <Text style={styles.story}>{data.historia}</Text>
        </View>

        <TouchableOpacity style={styles.messageButton} onPress={sendEmail}>
          <Icon name="envelope" size={20} color="#fff" />
          <Text style={styles.messageButtonText}>
            Deixe sua mensagem
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/contato')}>
          <Text style={styles.contactLinkText}>
            <Icon name="heart" size={18} color="#4682B4" /> Quer fazer
            um memorial como este? Clique aqui.
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => router.push('/')}
      >
        <Icon name="home" size={30} color="#1c1c1c" />
        <Text style={styles.homeButtonText}>Voltar ao Menu</Text>
      </TouchableOpacity>
    </ImageBackground>
  );
}

//
// STYLES
//
const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(70, 130, 180, 0.1)',
  },
  container: {
    padding: 20,
    paddingBottom: 100,
    alignItems: 'center',
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  imageWrapper: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#fff',
    marginBottom: 15,
    overflow: 'hidden',
    backgroundColor: '#eee',
  },
  profileImage: {
    // Esse estilo é repassado para o wrapper; o Image interno usa absoluteFill
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 15,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#BDB76B',
    textAlign: 'center',
    marginTop: -5,
  },
  subheader: {
    fontSize: 16,
    color: '#4682B4',
    textAlign: 'center',
    marginTop: 4,
  },
  idade: {
    fontSize: 16,
    color: '#4682B4',
    marginTop: 6,
    textAlign: 'center',
    marginBottom: -10,
  },
  visitCountText: {
    fontSize: 14,
    color: '#191970',
    marginTop: 15,
    textAlign: 'center',
    marginBottom: -20,
  },
  infoBox: {
    backgroundColor: 'rgba(245,245,245,0.7)',
    padding: 16,
    borderRadius: 10,
    width: '100%',
    marginBottom: 15,
  },
  label: {
    color: '#191970',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  info: {
    color: '#191970',
    fontSize: 16,
    marginBottom: 10,
  },
  linkSepultura: {
    color: '#4682B4',
    textDecorationLine: 'underline',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  storyBox: {
    backgroundColor: 'rgba(245,245,245,0.7)',
    padding: 16,
    borderRadius: 10,
    width: '100%',
    marginBottom: 1,
  },
  storyTitle: {
    color: '#191970',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  story: {
    color: '#191970',
    fontSize: 16,
    lineHeight: 22,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(70,130,180,0.9)',
    borderRadius: 8,
    marginBottom: -1,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
    textAlign: 'center',
  },
  contactLinkText: {
    color: '#4682B4',
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
    paddingVertical: 8,
  },
  homeButton: {
    position: 'absolute',
    bottom: 15,
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

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function Contato() {
  const router = useRouter();

  // Narração da tela
  useEffect(() => {
    const narrarTexto = async () => {
      try {
        const leituraAtiva = await AsyncStorage.getItem('modoLeitura');
        if (leituraAtiva === 'true') {
          Speech.speak(
            'Você está na tela de contato. Criador e desenvolvedor. Douglas Dias Borges. ' +
              'Criando soluções que coné ctam memórias e histórias. '+
              'Botão: Autorização L G P D, para acessar o formulário de autorização de proteção de dados. Botão: E-mail, para enviar um e-mail para o desenvolvedor. Botão: UÁ TIZÁPI, para enviar uma mensagem direta. Ou use o botão voltar ao menu para retornar à página inicial.' ,
            {
              language: 'pt-BR',
              rate: 1.0,
              pitch: 1.0,
            }
          );
        }
      } catch (error) {
        console.error('Erro ao narrar tela de contato:', error);
      }
    };

    narrarTexto();

    return () => {
      Speech.stop();
    };
  }, []);

  const openWhatsApp = () => {
    const phoneNumber = '5544988378222';
    const url = `https://wa.me/${phoneNumber}`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp')
    );
  };

  const sendEmail = () => {
    const email = 'memorialeternum@gmail.com';
    const url = `mailto:${email}`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Erro', 'Não foi possível abrir o cliente de e-mail')
    );
  };

  return (
    <ImageBackground
      source={{ uri: 'https://obituario.umuarama.pr.gov.br/img_1/back_1.png' }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <View style={styles.content}>
        <Text style={styles.title}>Criador e Desenvolvedor</Text>

        <Image
          source={require('./fotos/adm.png')}
          style={styles.avatar}
        />

        <Text style={styles.subtitle}>Douglas Dias Borges</Text>
        <Text style={styles.description}>
          Criando soluções que conectam {"\n"} memórias e histórias.
        </Text>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.button3D3} onPress={() => router.push('/lgpd')}>
            <Icon name="shield" size={26} color="#d64a1fff" />
            <Text style={styles.buttonText}>Autorização LGPD</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.button3D2} onPress={sendEmail}>
            <Icon name="envelope" size={22} color="#87ceeb" />
            <Text style={styles.buttonText}>E-mail</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.button3D1} onPress={openWhatsApp}>
            <Icon name="whatsapp" size={28} color="#25D366" />
            <Text style={styles.buttonText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
          <Icon name="home" size={24} color="#fff" />
          <Text style={styles.backButtonText}>Voltar ao Menu</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    color: '#87ceeb',
    fontWeight: 'bold',
    marginBottom: 50,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#eee',
    marginTop: 10,
    marginBottom: 5,
    fontWeight: '600',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#87ceeb',
  },
  buttonsContainer: {
    alignContent: 'center',
    width: '90%',
    marginVertical: 20,
    textAlign: 'center',
    marginBottom: -2,
  },
  button3D1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dfefff',
    paddingVertical: 17,
    paddingHorizontal: 15,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: -3 },
    shadowOpacity: 0.7,
    shadowRadius: 4,
    marginHorizontal: 10,
  },
  button3D2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dfefff',
    paddingVertical: 19,
    paddingHorizontal: 15,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: -3 },
    shadowOpacity: 0.7,
    shadowRadius: 4,
    marginHorizontal: 10,
  },
  button3D3: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dfefff',
    paddingVertical: 17,
    paddingHorizontal: 15,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: -3 },
    shadowOpacity: 0.7,
    shadowRadius: 4,
    marginHorizontal: 10,
  },
  buttonText: {
    color: '#363636',
    fontStyle: 'italic',
    fontSize: 18,
    marginLeft: 10,
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 50,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(135, 206, 235, 0.65)',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: -3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
  },
  backButtonText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 18,
  },
});

""// Arquivo: lgpd.tsx - Formulário LGPD com PDF gerado (React Native + Expo)

import * as Print from 'expo-print';
import { useRouter } from 'expo-router'; // Adicionado para navegação
import { shareAsync } from 'expo-sharing';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';


export default function LGPD() {
  const [aceite, setAceite] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    dataNascimento: '',
    cep: '',
    endereco: '',
    numero: '',
    telefone: '',
    email: '',
  });
  const [cpfValido, setCpfValido] = useState(false);
  const [cepValido, setCepValido] = useState(false);
  const router = useRouter();


  const handleChange = async (field: string, value: string) => {
    if (field === 'cpf') {
      const formatted = value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      setForm({ ...form, cpf: formatted });
      setCpfValido(validarCPF(formatted));
    } else if (field === 'cep') {
      const digits = value.replace(/\D/g, '').substring(0, 8);
      const formatted = digits.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
      setForm({ ...form, cep: formatted });
      if (digits.length === 8) {
        try {
          const resp = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
          const data = await resp.json();
          if (!data.erro) {
            setForm((f) => ({
              ...f,
              endereco: `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`,
            }));
            setCepValido(true);
          } else {
            Alert.alert('CEP inválido', 'Não foi possível localizar esse CEP.');
            setCepValido(false);
          }
        } catch {
          Alert.alert('Erro', 'Não foi possível consultar CEP.');
          setCepValido(false);
        }
      } else {
        setCepValido(false);
      }
    } else if (field === 'telefone') {
      const digits = value.replace(/\D/g, '').slice(0, 11);
      const formatted = digits
        .replace(/(\d{2})(\d{1})(\d{4})(\d{0,4})/, '($1) $2 $3-$4')
        .trim();
      setForm({ ...form, telefone: formatted });
    } else if (field === 'dataNascimento') {
      const digits = value.replace(/\D/g, '').slice(0, 8);
      const formatted = digits.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3');
      setForm({ ...form, dataNascimento: formatted });
    } else {
      setForm({ ...form, [field]: value });
    }
  };

  const validarCPF = (cpf: string) => {
    const clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11 || /^(\d)\1+$/.test(clean)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += +clean[i] * (10 - i);
    let rev = (sum * 10) % 11;
    if (rev === 10) rev = 0;
    if (rev !== +clean[9]) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += +clean[i] * (11 - i);
    rev = (sum * 10) % 11;
    if (rev === 10) rev = 0;
    return rev === +clean[10];
  };

  const gerarPDF = async () => {
    if (!cpfValido) return Alert.alert('CPF inválido', 'Corrija o CPF antes de gerar.');
    if (!cepValido) return Alert.alert('CEP inválido', 'Corrija o CEP antes de gerar.');
    const html = `
      <html><body style="font-family:Arial;padding:40px;line-height:1.5">
        <h2 style="text-align:center">TERMO DE CONSENTIMENTO</h2>
        <h4 style="text-align:center">Lei Geral de Proteção de Dados - LGPD (Lei nº 13.709/2018)</h4>
        <p>Eu <strong>${form.nome}</strong>, pessoa física inscrita no CPF: ${form.cpf}, nascido em ${form.dataNascimento}, residente na ${form.endereco}, nº ${form.numero}. Contato: ${form.telefone} / ${form.email}.</p>
        <p>Declaro que li e compreendi os termos da LGPD e autorizo a coleta e o tratamento dos meus dados e dos meus entes queridos conforme descrito abaixo.</p>
        <h4>1. Finalidade</h4>
        <p>Autorizar a "MEMORIAL ETERNUM" reproduzir a Preservação da memória e história familiar; Criação de registros digitais memorialísticos; Consulta de dados genealógicos; Homenagem e pesquisa de ancestralidade.</p>
        <h4>2. Dados Coletados</h4>
        <p>Nome completo, RG, CPF, data de nascimento, endereço, telefone e e-mail.</p>
        <h4>3. Segurança</h4>
        <p>Dados armazenados em ambiente seguro e usados apenas para os fins aqui descritos.</p>
        <h4>4. Direitos do Usuário</h4>
        <p>Você poderá solicitar acesso, correção ou exclusão dos seus dados a qualquer momento.</p>
        <p style="margin-top:40px">Umuarama-PR, ${new Date().toLocaleDateString('pt-BR')}</p>
        <div style="margin-top:80px; border-top:1px solid #000; width:100%">Assinatura digital</div>
      </body></html>`;

    const { uri } = await Print.printToFileAsync({ html });
    await shareAsync(uri);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>TERMO DE CONSENTIMENTO</Text>
      <Text style={styles.subtitle}>Lei Geral de Proteção de Dados - LGPD (Lei nº 13.709/2018)</Text>

      <View style={styles.section}>
        <Text style={styles.heading}>1. Finalidade</Text>
        <Text style={styles.text}>
          Autorizar a "MEMORIAL ETERNUM" reproduzir a Preservação da memória e história familiar; Criação de registros digitais memorialísticos para fins afetivos e sociais; Organização e consulta de dados genealógicos e históricos; Projeto de homenagem, acervo digital, e pesquisa de ancestralidade.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>2. Dados Coletados do Contratante</Text>
        <Text style={styles.text}>
          Nome completo, CPF, data de nascimento, Cep e endereço, telefone e e-mail.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>3. Segurança</Text>
        <Text style={styles.text}>
          Os dados serão armazenados em ambiente seguro e utilizados somente para os fins aqui descritos.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>4. Direitos do Usuário</Text>
        <Text style={styles.text}>
          O usuário poderá solicitar acesso, correção ou exclusão dos seus dados a qualquer momento.
        </Text>
      </View>

      {[
  { key: 'nome', label: 'Nome completo' },
  { key: 'cpf', label: 'CPF', keyboardType: 'numeric' },
  { key: 'dataNascimento', label: 'Data de Nascimento', keyboardType: 'numeric' },
  { key: 'cep', label: 'CEP', keyboardType: 'numeric' },
  { key: 'endereco', label: 'Endereço' },
  { key: 'numero', label: 'Número da residência', keyboardType: 'number-pad' },
  { key: 'telefone', label: 'Telefone', keyboardType: 'phone-pad' },
  { key: 'email', label: 'E-mail', keyboardType: 'email-address' },
].map(({ key, label, keyboardType }) => (
  <TextInput
    key={key}
    style={styles.input}
    placeholder={label}
    placeholderTextColor="#666"
    value={form[key]}
    keyboardType={keyboardType || 'default'}
    onChangeText={(value) => handleChange(key, value)}
  />
))}

      <TouchableOpacity onPress={() => setAceite(!aceite)} style={styles.checkboxContainer}>
        <Text>{aceite ? '☑' : '☐'} Li e aceito os termos da LGPD</Text>
      </TouchableOpacity>

      <TouchableOpacity
  style={[styles.button, { backgroundColor: aceite ? '#007bff' : '#ccc' }]}
  onPress={gerarPDF}
  disabled={!aceite}
>
  <Text style={styles.buttonText}>Gerar e Baixar PDF</Text>
</TouchableOpacity>

<TouchableOpacity
  style={[styles.buttonSecondary, { backgroundColor: '#ca4736ff' }]}
  onPress={() => router.push('/contato')}
>
  <Text style={styles.buttonText}>Voltar para Contato</Text>
</TouchableOpacity>

      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 30,
    backgroundColor: '#fdfdfd',
    alignSelf: 'center',
    
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#444',
  },
  formSection: {
    marginBottom: 20,
    width: '80%',
    alignSelf: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    padding: 4,
    marginBottom: 10,
    fontSize: 15,
    width: '100%',
    alignSelf: 'center',
  },
  section: {
    marginBottom: 20,
    widht: '90%',
    alignContent: 'center',
  },
  heading: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
    alignItems:'center',
  },
  checkboxContainer: {
    marginVertical: 12,
  },
  button: {
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'center',
    padding: 10,
    marginTop: 12,
    width: '100%',
  },
  buttonSecondary: {
  backgroundColor: '#6c757d',
  borderRadius: 8,
  alignItems: 'center',
  padding: 10,
  marginTop: 10,
  width: '100%',
  marginBottom: 30,
},
buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
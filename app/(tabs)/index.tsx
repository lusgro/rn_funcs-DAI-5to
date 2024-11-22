import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Platform, Button, View, TextInput, FlatList, Alert, ImageBackground, Text } from 'react-native';
import * as Contacts from 'expo-contacts';
import { SafeAreaView } from 'react-native-safe-area-context';
import Modal from 'react-native-modal';
import { Accelerometer } from "expo-sensors";
import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useBackground } from '@/context/BackgroundContext';

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
}

const normalizePhoneNumber = (phoneNumber: string): string => {
  return phoneNumber.replace(/\D/g, '');
};

const isValidPhoneNumber = (phoneNumber: string): boolean => {
  const normalizedNumber = normalizePhoneNumber(phoneNumber);
  return /^\d{7,15}$/.test(normalizedNumber);
};

const configureShake = (onShake: () => void) => {
  const SHAKE_THRESHOLD = 100;
  const TIME_THRESHOLD = 200;
  const COOLDOWN_PERIOD = 2000;

  let lastUpdate = 0;
  let lastShake = 0;
  let lastX = 0, lastY = 0, lastZ = 0;

  Accelerometer.setUpdateInterval(100);
  
  return Accelerometer.addListener(accelerometerData => {
    const { x, y, z } = accelerometerData;
    const currentTime = new Date().getTime();

    if ((currentTime - lastUpdate) > 100) {
      const timeDiff = currentTime - lastUpdate;
      lastUpdate = currentTime;

      const speed = Math.abs(x + y + z - lastX - lastY - lastZ) / timeDiff * 10000;

      if (speed > SHAKE_THRESHOLD) {
        if (currentTime - lastShake > TIME_THRESHOLD) {
          if (currentTime - lastShake > COOLDOWN_PERIOD) {
            onShake();
          }
          lastShake = currentTime;
        }
      }

      lastX = x;
      lastY = y;
      lastZ = z;
    }
  });
};

export default function EmergencyScreen() {
  const [isModalVisible, setModalVisible] = useState(false);
  const [emergencyNumber, setEmergencyNumber] = useState('');
  const [tempEmergencyNumber, setTempEmergencyNumber] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const lastShakeTime = useRef(0);
  const { backgroundImage } = useBackground();

  const handleEmergency = async () => {
    const currentTime = new Date().getTime();
    if (currentTime - lastShakeTime.current < 5000) {
      console.log("Agitado recientemente: ignorar");
      return;
    }
    lastShakeTime.current = currentTime;

    if (emergencyNumber) {
      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        return Alert.alert('SMS no disponible', 'Tu dispositivo no soporta el envío de mensajes de texto.');
      }
      const { result } = await SMS.sendSMSAsync(emergencyNumber, '¡Emergencia!');
      if (result === 'sent') {
        Alert.alert('Mensaje enviado', 'Se ha enviado un mensaje de texto al número de emergencia.');
      } else {
        Alert.alert('Error al enviar mensaje', 'Hubo un error al enviar el mensaje de texto.');
      }
    } else {
      Alert.alert('No hay número de emergencia', 'Por favor, configura un número de emergencia primero.');
    }
  };
  useEffect(() => {
    const fetchEmergencyNumber = async () => {
      const storedEmergencyNumber = await AsyncStorage.getItem('emergencyNumber');
      setEmergencyNumber(storedEmergencyNumber || '');
    }

    const requestContactsPermission = async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
        });
        if (data.length > 0) {
          const formattedContacts: Contact[] = data
            .filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0)
            .map(contact => ({
              id: contact.id,
              name: contact.name || 'Desconocido',
              phoneNumber: contact.phoneNumbers[0].number || '',
            }));
          setContacts(formattedContacts);
        }
      }
    }

    fetchEmergencyNumber();
    requestContactsPermission();
    const subscription = configureShake(() => {
      handleEmergency();
    });

    return () => {
      subscription.remove();
    }
  }, [emergencyNumber]);

  const toggleModal = () => {
    setTempEmergencyNumber(emergencyNumber);
    setModalVisible(!isModalVisible);
  }

  const editEmergencyNumber = async () => {
    if (isValidPhoneNumber(tempEmergencyNumber)) {
      const normalizedNumber = normalizePhoneNumber(tempEmergencyNumber);
      await AsyncStorage.setItem('emergencyNumber', normalizedNumber);
      setEmergencyNumber(normalizedNumber);
      toggleModal();
    } else {
      Alert.alert('Número Inválido', 'Por favor, ingrese un número de teléfono válido.');
    }
  }

  const renderContact = ({ item }: { item: Contact }) => (
    <ThemedView style={[
      styles.contactItem, 
      normalizePhoneNumber(item.phoneNumber) === normalizePhoneNumber(emergencyNumber) && styles.emergencyContact
    ]}>
      <ThemedText style={styles.contactText}>{item.name}</ThemedText>
      <ThemedText style={styles.contactNumber}>{item.phoneNumber}</ThemedText>
      {normalizePhoneNumber(item.phoneNumber) === normalizePhoneNumber(emergencyNumber) && (
        <ThemedText style={styles.emergencyLabel}>Contacto de emergencia</ThemedText>
      )}
    </ThemedView>
  );

  return (
    <ImageBackground 
      source={backgroundImage ? { uri: backgroundImage } : undefined}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <Button title='Añadir/Editar número de emergencia' onPress={toggleModal} />
        <Modal isVisible={isModalVisible}>
          <View style={styles.modalContent}>
            <TextInput 
              value={tempEmergencyNumber} 
              onChangeText={setTempEmergencyNumber}
              keyboardType='phone-pad'
              style={styles.input}
              placeholder="Ingresa el número de emergencia"
            />
            <Button title='Guardar' onPress={editEmergencyNumber} />
            <Button title='Cancelar' onPress={toggleModal} />
          </View>
        </Modal>
        <View style={styles.emergencyNumberContainer}>
          <Text style={styles.emergencyNumberDisplay}>
            Número de emergencia actual: {emergencyNumber}
          </Text>
          <Text style={styles.instructions}>
            Agita el dispositivo para activar la llamada de emergencia
          </Text>
        </View>
        <FlatList
          data={contacts}
          renderItem={renderContact}
          keyExtractor={item => item.id}
          style={styles.contactList}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  contactItem: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactText: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 4,
  },
  contactNumber: {
    color: '#ffffff',
    fontSize: 14,
  },
  emergencyContact: {
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    borderWidth: 2,
    borderColor: '#ff4444',
  },
  emergencyLabel: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginTop: 5,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 22,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    width: '100%',
    marginBottom: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    fontSize: 16,
  },
  emergencyNumberContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 8,
    marginVertical: 15,
  },
  emergencyNumberDisplay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  instructions: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
  },
  contactList: {
    marginTop: 10,
  }
});
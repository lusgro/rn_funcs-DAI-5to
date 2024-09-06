import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Platform, Button, View, TextInput, FlatList, Alert, ImageBackground } from 'react-native';
import * as Contacts from 'expo-contacts';
import { SafeAreaView } from 'react-native-safe-area-context';
import Modal from 'react-native-modal';
import { Accelerometer } from "expo-sensors";
import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { getBackgroundImage } from '@/helper/getBackgroundImage';

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
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const lastShakeTime = useRef(0);

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

    getBackgroundImage().then((backgroundImageStored) => {
      setBackgroundImage(backgroundImageStored)
    })

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
      <ThemedText>{item.name}</ThemedText>
      <ThemedText>{item.phoneNumber}</ThemedText>
      {normalizePhoneNumber(item.phoneNumber) === normalizePhoneNumber(emergencyNumber) && (
        <ThemedText style={styles.emergencyLabel}>Contacto de emergencia</ThemedText>
      )}
    </ThemedView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground 
        source={backgroundImage ? { uri: backgroundImage } : undefined}
        style={{ flex: 1 }}
      >
        <Button title='Añadir/Editar número de emergencia' onPress={toggleModal} />
        <Modal isVisible={isModalVisible}>
          <ThemedView style={styles.modalContent}>
            <TextInput 
              value={tempEmergencyNumber} 
              onChangeText={setTempEmergencyNumber}
              keyboardType='phone-pad'
              style={styles.input}
              placeholder="Ingresa el número de emergencia"
            />
            <Button title='Guardar' onPress={editEmergencyNumber} />
            <Button title='Cancelar' onPress={toggleModal} />
          </ThemedView>
        </Modal>
        <ThemedText style={styles.emergencyNumberDisplay}>
          Número de emergencia actual: {emergencyNumber}
        </ThemedText>
        <ThemedText style={styles.instructions}>
          Agita el dispositivo para activar la llamada de emergencia
        </ThemedText>
        <FlatList
          data={contacts}
          renderItem={renderContact}
          keyExtractor={item => item.id}
        />
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  contactItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  emergencyContact: {
    backgroundColor: '#ffe6e6',
  },
  emergencyLabel: {
    color: 'red',
    fontWeight: 'bold',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  input: {
    width: '100%',
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  emergencyNumberDisplay: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  instructions: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 10,
  },
});
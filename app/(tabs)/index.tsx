import React, { useEffect, useState } from 'react';
import { StyleSheet, Platform, Button, View, TextInput, FlatList, Alert, Linking } from 'react-native';
import * as Contacts from 'expo-contacts';
import { SafeAreaView } from 'react-native-safe-area-context';
import Modal from 'react-native-modal';
import { Accelerometer } from "expo-sensors";
import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

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
  let lastUpdate = 0;
  const SHAKE_THRESHOLD = 800;
  const SHAKE_TIMEOUT = 1000;

  Accelerometer.setUpdateInterval(100);
  
  return Accelerometer.addListener(accelerometerData => {
    const { x, y, z } = accelerometerData;
    const currentTime = new Date().getTime();
    if ((currentTime - lastUpdate) > SHAKE_TIMEOUT) {
      const diffTime = currentTime - lastUpdate;
      lastUpdate = currentTime;
      const speed = Math.abs(x + y + z - lastUpdate) / diffTime * 10000;
      if (speed > SHAKE_THRESHOLD) {
        onShake();
      }
    }
  });
};

export default function EmergencyScreen() {
  const [isModalVisible, setModalVisible] = useState(false);
  const [emergencyNumber, setEmergencyNumber] = useState('');
  const [tempEmergencyNumber, setTempEmergencyNumber] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);

  const handleEmergency = async () => {
    // if (emergencyNumber) {
    //   const isAvailable = await SMS.isAvailableAsync();
    //   if (!isAvailable) {
    //     return Alert.alert('SMS no disponible', 'Tu dispositivo no soporta el envío de mensajes de texto.');
    //   }
    //   const { result } = await SMS.sendSMSAsync(emergencyNumber, '¡Emergencia!');
    //   if (result === 'sent') {
    //     Alert.alert('Mensaje enviado', 'Se ha enviado un mensaje de texto al número de emergencia.');
    //   } else {
    //     Alert.alert('Error al enviar mensaje', 'Hubo un error al enviar el mensaje de texto.');
    //   }
    // } else {
    //   Alert.alert('No hay número de emergencia', 'Por favor, configura un número de emergencia primero.');
    // }
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
    const subscription = configureShake(handleEmergency);

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
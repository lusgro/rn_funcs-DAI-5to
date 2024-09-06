import { useState, useEffect, useRef } from 'react'
import { Button, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import Modal from 'react-native-modal'
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';

export default function About () {
    const [ isVisible, setIsVisible ] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();
    const [ show, setShow ] = useState(false)
    const [scanned, setScanned] = useState(false);
    const [data, setData] = useState()

    const askCameraPermission = async () => {
        setShow(!show)
        if(permission) return
        requestPermission();
    };

    const handleAfterScanned = ({ data, type }: any) => {
        setScanned(true)
        setData(data)
        setIsVisible(true)
    };

    return (
        <SafeAreaView style={styles.container}>
            <Modal isVisible={isVisible}>
                <View style={styles.modal}>
                    <Text style={{fontSize: 18, fontWeight: 'bold'}}>{data}</Text>
                    <Button title='Cancelar' onPress={() => setIsVisible(!isVisible)} />
                </View>
            </Modal>
            <CameraView
                style={[styles.scanner, show && {opacity: 1}]}
                barcodeScannerSettings={{
                barcodeTypes: ['qr'],
                }}
                onBarcodeScanned={handleAfterScanned}
            >
                <View style={styles.overlay}>
                    <Text style={styles.scanText}>Escanea un código QR</Text>
                </View>
            </CameraView>
            <Pressable style={styles.boton} onPress={askCameraPermission}>
                <Text style={styles.textoBoton}>Escanear</Text>
            </Pressable>
            <Image
                style={styles.image}
                source={require('../../assets/images/data.png')}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    boton: {
        backgroundColor: 'white',
        paddingHorizontal: 15,
        paddingTop: 18,
        paddingBottom: 18,
        borderRadius: 20,
        marginTop: 50
    },
    textoBoton: {
        color: 'black',
        fontSize: 24,
        fontWeight: 'bold'
    },
    container: {
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
    },
    scanner: {
        width: "70%",
        height: "50%",
        backgroundColor: "white",
        opacity: 0,
        marginTop: 20
    },
    overlay: {
      flex: 1,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    scanText: {
        fontSize: 18,
        color: 'white',
        textAlign: 'center',
    },
    image: {
        height: 180,
        width: 180,
        marginTop: 20
    },
    modal: {
        backgroundColor: 'white',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: 100,
        borderRadius: 20
    }
  });
  
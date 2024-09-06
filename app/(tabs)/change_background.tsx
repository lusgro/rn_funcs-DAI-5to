import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, View, Text, TouchableOpacity, ImageBackground } from "react-native";
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getBackgroundImage } from "@/helper/getBackgroundImage";

export default function ChangeBackgroundScreen() {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const cameraRef = useRef<Camera | null>(null);
    
    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
            const savedImage = await AsyncStorage.getItem('backgroundImage');
            if (savedImage) setBackgroundImage(savedImage);
        })();
        getBackgroundImage().then((backgroundImageStored) => {
            setBackgroundImage(backgroundImageStored)
          })
    }, []);
    
    const handleTakePicture = async () => {
        if (!cameraRef.current) return;
    
        const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
        await AsyncStorage.setItem('backgroundImage', photo.uri);
        setBackgroundImage(photo.uri);
        setIsCameraActive(false);
    };
    
    const handleChoosePhoto = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });
    
        if (!result.canceled && result.assets[0].uri) {
            await AsyncStorage.setItem('backgroundImage', result.assets[0].uri);
            setBackgroundImage(result.assets[0].uri);
        }
    };

    const handleStartCamera = () => {
        if (hasPermission) {
            setIsCameraActive(true);
        }
    };

    if (hasPermission === null) {
        return <View style={styles.container}><Text>Pidiendo permisos de camara...</Text></View>;
    }

    if (hasPermission === false) {
        return <View style={styles.container}><Text>Sin acceso a la camara.</Text></View>;
    }

    if (isCameraActive) {
        return (
            <View style={styles.container}>
                <CameraView style={styles.camera} ref={cameraRef}>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.button} onPress={handleTakePicture}>
                            <Text style={styles.buttonText}>Tomar Foto</Text>
                        </TouchableOpacity>
                    </View>
                </CameraView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ImageBackground 
            source={backgroundImage ? { uri: backgroundImage } : undefined}
            style={{ flex: 1 }}
            >
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button} onPress={handleStartCamera}>
                        <Text style={styles.buttonText}>Tomar Foto</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={handleChoosePhoto}>
                        <Text style={styles.buttonText}>Elegir Foto</Text>
                    </TouchableOpacity>
                </View>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    camera: {
        flex: 1,
        width: '100%',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 20,
    },
    button: {
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 5,
        marginHorizontal: 10,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
    },
    preview: {
        width: '80%',
        height: 200,
        resizeMode: 'contain',
        marginBottom: 20,
    },
});
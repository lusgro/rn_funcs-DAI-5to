import React, { useState } from "react";
import { StyleSheet, View, Button, Image } from "react-native";
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ChangeBackgroundScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    
    React.useEffect(() => {
        AsyncStorage.getItem('backgroundImage').then(setBackgroundImage);
    }, []);
    
    const handleTakePicture = async (camera: CameraView | null) => {
        if (!camera) return;
    
        const photo = await camera.takePictureAsync({ quality: 1, base64: true });
        AsyncStorage.setItem('backgroundImage', photo.uri);
        setBackgroundImage(photo.uri);
    };
    
    return (
        <View style={styles.container}>
        {permission ? (
            <CameraView style={styles.camera} type={CameraType.Back} ratio="16:9" />
        ) : (
            <Button title="Permitir acceso a la cámara" onPress={requestPermission} />
        )}
        {backgroundImage && <Image source={{ uri: backgroundImage }} style={styles.backgroundImage} />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
        width: undefined,
        height: undefined,
        resizeMode: 'cover',
    },
});
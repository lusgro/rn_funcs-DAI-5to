import { useState, useEffect, useRef } from 'react'
import { SafeAreaView, StyleSheet } from 'react-native'
import Modal from 'react-native-modal'

export default function About () {
    const [ isVisible, setIsVisible ] = useState(false); 

    return (
        <SafeAreaView>
            {/* Imagen qr */}
            {/* boton para escanear */}
            <Modal isVisible={isVisible}>

            </Modal>
        </SafeAreaView>
    )
}
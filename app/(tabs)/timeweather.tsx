import { useState, useEffect, useRef } from 'react'
import { SafeAreaView, StyleSheet, Text, ImageBackground } from 'react-native'
import MapView, { Region as MapRegion } from "react-native-maps";
import * as ELocation from 'expo-location';
import dayjs from 'dayjs';
import { getBackgroundImage } from '@/helper/getBackgroundImage';

type Region = {
  latitude: number,
  longitude: number, 
  latitudeDelta: number,
  longitudeDelta: number
}

const API_KEY = '0ea7eebcf4bf0d046fe9ccd83cea4fc4'

export default function TimeWeather () {
  const mapRef = useRef<any>(null);
  const [location, setLocation] = useState<Region | undefined>();
  const [weatherData, setWeatherData] = useState()
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  const [date, setDate] = useState(dayjs())

  const handleRegionChangeComplete = (region : MapRegion) => {
    setLocation(region)
  }

  useEffect(() => {
    const getLocation = async () => {
      let { status } = await ELocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Por favor, otorga los permisos de ubicación');
      } else {
        let location = await ELocation.getCurrentPositionAsync({});
        const userRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.025,
          longitudeDelta: 0.03,
        };
        setLocation(userRegion);
        mapRef.current.animateToRegion(userRegion, 1000);
        fetchWeatherData(location.coords.latitude, location.coords.longitude);
      }
    };
    getBackgroundImage().then((backgroundImageStored) => {
      setBackgroundImage(backgroundImageStored)
    })
    getLocation()
  }, [])

  const fetchWeatherData = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
      );
      const data = await response.json();
      setWeatherData(data);
    } catch (error) {
      console.log('Error al obtener datos del clima');
    }
  };

  useEffect(() => {
    setInterval(() => {
      setDate(dayjs());
    }, 1000 * 1);
  }, []);

  return (
    <ImageBackground 
      source={backgroundImage ? { uri: backgroundImage } : undefined}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{width: '94%', marginHorizontal: '3%'}}>
        <Text style={styles.title}>{date.format("dddd, DD MMMM")}</Text>
        <Text style={styles.clock}>{date.format("hh:mm:ss")}</Text>
        <Text style={styles.title}>Clima Actual</Text>
        {
          weatherData ?
          <>
            <Text style={styles.text}>Temperatura: {weatherData!.main.temp}°C</Text>
            <Text style={styles.text}>Descripción: {weatherData!.weather[0].description}</Text>
            <Text style={styles.text}>Humedad: {weatherData!.main.humidity}%</Text>
          </>
          :
            <Text style={styles.text}>Cargando...</Text>
        }
        <MapView
          style={styles.map}
          onRegionChangeComplete={handleRegionChangeComplete}
          showsUserLocation
          ref={mapRef}
        />
      </SafeAreaView>
    </ImageBackground>
  )
}


const styles = StyleSheet.create({
  map: {
    height: 250,
    width: '100%',
    marginTop: 20,
    borderRadius: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'white',
    marginTop: 40,
    textAlign: 'center'
  },
  text: {
    fontSize: 18,
    marginBottom: 10,
    color: 'white'
  },
  clock: {
    fontSize: 26,
    color: 'white',
    textAlign: 'center'
  }
});

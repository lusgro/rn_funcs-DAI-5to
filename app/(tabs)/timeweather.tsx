import { useState, useEffect, useRef } from 'react'
import { SafeAreaView, StyleSheet, Text } from 'react-native'
import MapView, { Region as MapRegion } from "react-native-maps";
import * as ELocation from 'expo-location';
import dayjs from 'dayjs';

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

  const [date, setDate] = useState(daysjs())

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

  return (
    <SafeAreaView>
      <MapView
        style={styles.map}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation
        ref={mapRef}
      />
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
      <Text style={styles.date}>{dayjs().format("dddd, DD MMMM")}</Text>
      <Text style={styles.time}>{dayjs().format("hh:mm")}</Text>
    </SafeAreaView>
  )
}


const styles = StyleSheet.create({
  map: {
    height: 250,
    width: '90%',
    marginHorizontal: '5%'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  text: {
    fontSize: 18,
    marginBottom: 10,
  }
});

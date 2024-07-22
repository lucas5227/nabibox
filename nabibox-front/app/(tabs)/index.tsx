import {Image, StyleSheet, Platform, Text, SafeAreaView, Button, ScrollView, View} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import {useEffect, useState} from "react";

export default function HomeScreen() {
  const [albums, setAlbums] = useState(null);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

  async function getAlbums() {
    if (permissionResponse.status !== 'granted') {
      await requestPermission();
    }
    const fetchedAlbums = await MediaLibrary.getAlbumsAsync({
      includeSmartAlbums: true,
    });
    setAlbums(fetchedAlbums);
  }

  return (
      <SafeAreaView >
        <Button onPress={getAlbums} title="Get albums" />
        <ScrollView>
          {albums && albums.map((album) => <AlbumEntry album={album} />)}
        </ScrollView>
      </SafeAreaView>
  );
}

function AlbumEntry({ album }) {
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    async function getAlbumAssets() {
      const albumAssets = await MediaLibrary.getAssetsAsync({ album });
      setAssets(albumAssets.assets);
    }
    getAlbumAssets();
  }, [album]);

  return (
      <View key={album.id} style={styles.albumContainer}>
        <Text>
          {album.title} - {album.assetCount ?? 'no'} assets
        </Text>
        <View style={styles.albumAssetsContainer}>
          {assets && assets.map((asset) => (
              <Image source={{ uri: asset.uri }} width={50} height={50} />
          ))}
        </View>
      </View>
  );
}

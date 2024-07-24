import React, { useEffect, useState } from 'react';
import {
    Image,
    StyleSheet,
    Text,
    SafeAreaView,
    ScrollView,
    View,
    TouchableOpacity,
    Dimensions
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { Feather } from 'react-native-vector-icons';

const { width } = Dimensions.get('window'); // 화면의 가로 폭

export default function HomeScreen() {
    const [cloudView, setCloudView] = useState({});
    const [albums, setAlbums] = useState({});
    const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
    const [cloudFiles, setCloudFiles] = useState([]);

    const mergeAlbum = (storage, cloud) => {
        let tmp = [];
        let tmp2 = storage;
        Object.keys(cloud).forEach((k, i) => {
            const date = new Date(k);
            const timestamp = Math.floor(date.getTime() / 1000);
            const cloudFilename = cloud[k].toString();
            const filenameParts = cloudFilename.split('|:|');
            const extension = cloudFilename.split('.').pop();
            const filename = filenameParts[0] + '.' + extension;
            if(storage.hasOwnProperty(k)){
                //추가
            } else {
                // tmp2.k = {"creationTime": timestamp,"mediaType": "photo", "filename": filename};
            }
        });
        setCloudView(tmp);
        console.log(tmp2);
        return storage;
    };

    useEffect(() => {
        getAlbums();
    }, []);

    async function getAlbums() {
        if (!permissionResponse || permissionResponse.status !== 'granted') {
            const granted = await requestPermission();
            if (!granted) {
                console.log('Permission not granted');
                return;
            }
        }

        const fetchedAlbums = await MediaLibrary.getAlbumsAsync({
            includeSmartAlbums: true,
        });

        const photos = {};
        for (const album of fetchedAlbums) {
            const assets = await MediaLibrary.getAssetsAsync({
                album: album.id,
                sortBy: [MediaLibrary.SortBy.creationTime],
            });
            for (const asset of assets.assets) {
                const assetInfo = await MediaLibrary.getAssetInfoAsync(asset.id);
                const dateKey = new Date(asset.creationTime).toISOString().split('T')[0]; // 'YYYY-MM-DD' 형식으로 날짜 키 생성
                if (!photos[dateKey]) {
                    photos[dateKey] = []; // 배열로 초기화
                }
                photos[dateKey].push({ ...asset, localUri: assetInfo.localUri });
            }
        }
        setAlbums(mergeAlbum(photos, cloudFiles));
    }

    async function syncWithServer() {
        const url = 'http://angelicagrace.shop/list/sadmin'; // API URL

        try {
            console.log('Syncing with server...');

            // 데이터 요청
            const response = await fetch(url);

            // 응답 상태 체크
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // JSON 데이터 파싱
            const data = await response.json();
            const tmp = {};
            data.data.forEach((res, idx) => {
                res.children.forEach((file, fileIdx) => {
                    if (!tmp[res.name]) {
                        tmp[res.name] = []; // tmp[idx] 배열이 존재하지 않으면 초기화합니다.
                    }
                    tmp[res.name][fileIdx] = file.name; // 파일 이름을 저장합니다.
                });
            });
            setAlbums(mergeAlbum(albums, tmp));

            // 데이터 출력
            console.log('Data from server:', cloudFiles);
        } catch (error) {
            console.error('Failed to fetch data from server:', error);
        }
    }

    function handleUpload(photoId) {
        // 업로드 로직을 여기에 추가하세요.
        console.log(`Uploading photo with ID: ${photoId}`);
    }

    async function handleUploadAll() {
        // 모든 사진을 업로드하는 로직을 여기에 추가하세요.
        Object.values(albums).flat().forEach(photo => handleUpload(photo.id));
        console.log('Uploading all photos...');
    }

    function renderPhotoGrid() {
        return (
            <View style={styles.photoContainer}>
                {Object.keys(albums).map(dateKey => {
                    const photosForDate = albums[dateKey];
                    const date = new Date(dateKey);
                    const formattedDate = date.toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        weekday: 'short',
                    });
                    return (
                        <View key={dateKey} style={styles.dateContainer}>
                            <Text style={styles.dateText}>{formattedDate}</Text>
                            <View style={styles.photoGrid}>
                                {photosForDate.map(photo => (
                                    <View key={photo.id} style={styles.photoWrapper}>
                                        <Image source={{ uri: photo.localUri }} style={styles.photo} />
                                        <TouchableOpacity
                                            style={styles.uploadButton}
                                            onPress={() => handleUpload(photo.id)}
                                        >
                                            <Feather name="upload-cloud" size={18} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </View>
                    );
                })}
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topButtonsContainer}>
                <TouchableOpacity style={styles.uploadAllButton} onPress={handleUploadAll}>
                    <Feather name="upload-cloud" size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.rightButtonsContainer}>
                    <TouchableOpacity style={styles.syncButton} onPress={syncWithServer}>
                        <Feather name="cloud" size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.refreshButton} onPress={getAlbums}>
                        <Feather name="refresh-cw" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                {renderPhotoGrid()}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    uploadAllButton: {
        backgroundColor: '#1e90ff',
        padding: 10,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateContainer: {
        marginBottom: 16,
    },
    dateText: {
        fontSize: 18,
        marginBottom: 8,
        marginRight: 8,
        textAlign: 'right',
    },
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    photoWrapper: {
        width: width / 3 - 2, // 사진의 너비를 화면의 1/3로 설정
        height: width / 3 - 2, // 사진의 높이를 너비와 동일하게 설정하여 정사각형으로 만듭니다.
        marginBottom: 2,
        position: 'relative', // 자식 요소의 절대 위치를 설정하기 위해 사용
    },
    photo: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    uploadButton: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: '#1e90ff',
        padding: 5,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    topButtonsContainer: {
        backgroundColor: 'white',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: 20,
        paddingVertical: 8, // 버튼 컨테이너의 높이를 조절
        elevation: 4, // 안드로이드에서 그림자 효과 추가
        zIndex: 1, // 버튼들이 다른 콘텐츠 위에 보이도록 설정
    },
    scrollViewContent: {
        paddingTop: 56, // topButtonsContainer의 높이만큼 여백 추가
    },
    rightButtonsContainer: {
        flexDirection: 'row',
    },
    syncButton: {
        backgroundColor: '#1e90ff',
        padding: 10,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center', // 아이콘이 버튼 중앙에 위치하도록 설정
    },
    refreshButton: {
        backgroundColor: '#ff6347', // 빨간색 버튼 색상
        padding: 10,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center', // 아이콘이 버튼 중앙에 위치하도록 설정
        marginLeft: 10, // 버튼 간의 간격을 추가
    },
});

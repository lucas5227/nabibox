import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@settings";

export const storeData = async (value) => {
    try {
        const jsonValue = JSON.stringify(value);
        await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (e) {
        console.log("Error saving data:", e);
    }
};

export const getData = async () => {
    try {
        const value = await AsyncStorage.getItem(STORAGE_KEY);
        if (value !== null) {
            return JSON.parse(value);
        }
    } catch (e) {
        console.log("Error reading data:", e);
    }
    return { notifications: false, autoUpload: false }; // 기본값 설정
};

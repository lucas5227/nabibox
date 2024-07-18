import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Switch, SafeAreaView, Text } from 'react-native';
import { storeData, getData } from '@/components/AsyncStorageService'; // 경로는 실제 프로젝트 구조에 맞게 수정

const SwitchItem = ({ label, value, onToggle }) => {
    return (
        <View style={styles.item}>
            <Text style={styles.label}>{label}</Text>
            <Switch
                onValueChange={onToggle}
                value={value}
            />
        </View>
    );
};

export default function SettingScreen() {
    const [conf, setConf] = useState({
        notifications: false,
        autoUpload: false,
    });

    useEffect(() => {
        const fetchData = async () => {
            const data = await getData();
            setConf(data);
        };
        fetchData();
    }, []);

    const toggleSwitch = async (key) => {
        setConf((prevConf) => {
            const updatedConf = { ...prevConf, [key]: !prevConf[key] };
            storeData(updatedConf); // 상태 업데이트 후 저장
            return updatedConf;
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <SwitchItem
                label="Notifications"
                value={conf.notifications}
                onToggle={() => toggleSwitch('notifications')}
            />
            <SwitchItem
                label="Auto Upload"
                value={conf.autoUpload}
                onToggle={() => toggleSwitch('autoUpload')}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 10,
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        marginVertical: 3,
        backgroundColor: '#eee',
        borderRadius: 20,
    },
    label: {
        fontSize: 16,
    },
});

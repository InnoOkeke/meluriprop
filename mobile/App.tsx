import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View, Button, ScrollView, Modal, TextInput, Alert, TouchableOpacity } from 'react-native';
import { PrivyProvider, usePrivy } from '@privy-io/expo';

const PRIVY_APP_ID = 'cmj4he35y00tpky0cf3wm9fks';
import { DaoView } from './components/DaoView';
import { API_URL } from './config';

function Dashboard() {
  const { logout, getAccessToken, user } = usePrivy();
  const [properties, setProperties] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [selectedProperty, setSelectedProperty] = React.useState<any>(null);
  const [amount, setAmount] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('marketplace');

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/properties`);
      const data = await response.json();
      setProperties(data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvestPress = (property: any) => {
    setSelectedProperty(property);
    setAmount('');
    setModalVisible(true);
  };

  const submitInvestment = async () => {
    if (!amount || isNaN(Number(amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      const token = await getAccessToken();
      const response = await fetch(`${API_URL}/investments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          propertyId: selectedProperty.id,
          amount: Number(amount)
        })
      });

      if (response.ok) {
        Alert.alert('Success', 'Investment successful!');
        setModalVisible(false);
      } else {
        const error = await response.json();
        Alert.alert('Error', error.message || 'Investment failed');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to connect to server');
    }
  };

  React.useEffect(() => {
    fetchProperties();
  }, []);

  return (
    <View style={styles.dashboard}>

      {/* Content Area */}
      <View style={styles.content}>
        {activeTab === 'marketplace' ? (
          <>
            <Text style={styles.title}>Marketplace</Text>
            <Text style={styles.subtitle}>Welcome, {(user as any)?.email?.address || (user as any)?.id}</Text>

            <ScrollView style={styles.list}>
              <View style={{ marginBottom: 20 }}>
                <Button title="Refresh" onPress={fetchProperties} />
              </View>

              {loading ? (
                <Text>Loading properties...</Text>
              ) : (
                properties.map((p, i) => (
                  <View key={i} style={styles.card}>
                    <View style={styles.imagePlaceholder} />
                    <Text style={styles.cardTitle}>{p.name}</Text>
                    <Text>{p.location}</Text>
                    <Text style={styles.price}>Valuation: ${p.valuation}</Text>
                    <TouchableOpacity
                      style={styles.investButton}
                      onPress={() => handleInvestPress(p)}
                    >
                      <Text style={styles.investButtonText}>Invest Now</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>

            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.centeredView}>
                <View style={styles.modalView}>
                  <Text style={styles.modalText}>Invest in {selectedProperty?.name}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Amount ($)"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                  />
                  <View style={styles.modalButtons}>
                    <Button title="Cancel" onPress={() => setModalVisible(false)} color="#EF4444" />
                    <Button title="Confirm" onPress={submitInvestment} />
                  </View>
                </View>
              </View>
            </Modal>
          </>
        ) : (
          <DaoView />
        )}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('marketplace')}
        >
          <Text style={[styles.tabText, activeTab === 'marketplace' && styles.activeTabText]}>Marketplace</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('dao')}
        >
          <Text style={[styles.tabText, activeTab === 'dao' && styles.activeTabText]}>Governance</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => logout()}
        >
          <Text style={[styles.tabText, { color: '#EF4444' }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function LoginScreen() {
  const { isReady, user, login } = usePrivy();

  if (!isReady) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (user) {
    return <Dashboard />;
  }

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>MeluRiProp</Text>
      <Button
        title="Login with Google or Apple"
        onPress={() => login({ loginMethods: ['google', 'apple'] })}
      />
      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  return (
    <PrivyProvider appId={PRIVY_APP_ID}>
      <LoginScreen />
    </PrivyProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboard: {
    flex: 1,
    paddingTop: 60,
    backgroundColor: '#f5f5f5',
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imagePlaceholder: {
    height: 120,
    backgroundColor: '#eee',
    borderRadius: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  price: {
    marginTop: 5,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  investButton: {
    marginTop: 10,
    backgroundColor: '#2563EB',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  investButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    width: '100%',
    borderRadius: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  content: {
    flex: 1,
    paddingBottom: 0,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    backgroundColor: 'white',
    paddingBottom: 20,
    paddingTop: 10,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    padding: 5,
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2563EB',
    fontWeight: 'bold',
  }
});

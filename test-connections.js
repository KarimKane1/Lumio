// Simple test script to check connections API
const testConnections = async () => {
  try {
    console.log('Testing connections API...');
    
    // Test the network endpoint
    const response = await fetch('http://localhost:3000/api/connections?network=1&userId=YOUR_USER_ID');
    const data = await response.json();
    
    console.log('Connections API response:', data);
    console.log('Number of connections:', data.items?.length || 0);
    
    if (data.items && data.items.length > 0) {
      console.log('First connection:', data.items[0]);
    }
    
  } catch (error) {
    console.error('Error testing connections:', error);
  }
};

// Run the test
testConnections();

#!/usr/bin/env node
/**
 * Debug script to test the deployed API endpoints
 */

const API_BASE = 'https://communityexpress-api.onrender.com';

async function testLogin() {
  console.log('🔐 Testing login...');
  
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'master@communityexpress.com',
      password: 'Master123!'
    })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    console.log('✅ Login successful');
    console.log('User:', data.user);
    return data.access_token;
  } else {
    console.log('❌ Login failed:', data);
    return null;
  }
}

async function testCommunities(token) {
  console.log('\n🏘️  Testing communities endpoint...');
  
  const response = await fetch(`${API_BASE}/communities`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  console.log('Status:', response.status);
  const data = await response.text();
  
  try {
    const jsonData = JSON.parse(data);
    if (response.ok) {
      console.log('✅ Communities endpoint working');
      console.log('Communities count:', Array.isArray(jsonData) ? jsonData.length : 'Not an array');
      console.log('First few communities:', Array.isArray(jsonData) ? jsonData.slice(0, 2) : jsonData);
    } else {
      console.log('❌ Communities endpoint failed:', jsonData);
    }
  } catch (e) {
    console.log('❌ Invalid JSON response:', data.substring(0, 200));
  }
}

async function testDashboard(token) {
  console.log('\n📊 Testing dashboard endpoint...');
  
  const response = await fetch(`${API_BASE}/dashboard/stats`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  console.log('Status:', response.status);
  const data = await response.text();
  
  try {
    const jsonData = JSON.parse(data);
    if (response.ok) {
      console.log('✅ Dashboard endpoint working');
      console.log('Stats:', jsonData);
    } else {
      console.log('❌ Dashboard endpoint failed:', jsonData);
    }
  } catch (e) {
    console.log('❌ Invalid JSON response:', data.substring(0, 200));
  }
}

async function main() {
  console.log('🚀 Testing deployed API endpoints');
  console.log('Base URL:', API_BASE);
  console.log('=' * 50);
  
  const token = await testLogin();
  if (!token) {
    console.log('Cannot proceed without authentication');
    return;
  }
  
  await testDashboard(token);
  await testCommunities(token);
  
  console.log('\n✅ Testing complete');
}

main().catch(console.error);
